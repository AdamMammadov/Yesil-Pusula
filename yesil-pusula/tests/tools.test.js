const test = require('node:test');
const assert = require('node:assert');
const D = require('../js/data.js');
const E = require('../js/engine.js');
const TL = require('../js/tools.js');
const T = require('../js/i18n.js');
const V3 = require('../js/i18n_v3.js');
const V4 = require('../js/i18n_v4.js');
const V5 = require('../js/i18n_v5.js');
const TOUR = require('../js/tour.js');

const F = { gas: D.fuels.gas.ncv * D.fuels.gas.ef, diesel: D.fuels.diesel.ncv * D.fuels.diesel.ef, lpg: D.fuels.lpg.ncv * D.fuels.lpg.ef, coal: D.fuels.coal.ncv * D.fuels.coal.ef, preInt: 0.2 };
const p = [380, 400, 430, 420, 440, 410, 390, 350, 430, 450, 460, 440];
const g = [15500, 15800, 15600, 14200, 14000, 12800, 12100, 10900, 13800, 15400, 16800, 18100];
const d = [650, 650, 700, 680, 700, 660, 640, 560, 690, 700, 690, 680];
const rows = p.map((x, i) => ({ production_t: x, electricity_mwh: Math.round(x * 0.12 * 10) / 10, gas_m3: g[i], diesel_l: d[i], lpg_l: 0, coal_t: 0, precursor_t: Math.round(x * 1.03 * 10) / 10 }));

test('Aylık toplamlar örnek yıllık veriyle aynı', () => {
  const a = TL.aggregate(rows, F);
  assert.strictEqual(a.totals.production_t, 5000);
  assert.strictEqual(Math.round(a.totals.electricity_mwh * 10) / 10, 600);
  assert.strictEqual(a.totals.gas_m3, 175000);
  assert.strictEqual(a.totals.diesel_l, 8000);
  assert.strictEqual(Math.round(a.totals.precursor_t * 10) / 10, 5150);
  assert.strictEqual(a.anomalies.length, 0);
  assert.strictEqual(a.filled, 12);
});

test('Hatalı fatura girişi (10 kat doğalgaz) ve üretimsiz enerji yakalanır', () => {
  const bad = rows.map(r => ({ ...r }));
  bad[2].gas_m3 = 156000;
  bad[7].production_t = 0;
  const a = TL.aggregate(bad, F);
  assert.ok(a.anomalies.some(x => x.month === 3 && x.code === 'outlier'));
  assert.ok(a.anomalies.some(x => x.month === 8 && x.code === 'energy_no_prod'));
});

test('Hatalı elektrik faturası (10 kat) SKDM kapsamı dışında olsa da yakalanır', () => {
  const bad = rows.map(r => ({ ...r }));
  bad[2].electricity_mwh = bad[2].electricity_mwh * 10;
  const a = TL.aggregate(bad, F);
  const e = a.anomalies.find(x => x.month === 3 && x.code === 'elec_outlier');
  assert.ok(e);
  assert.ok(e.dev > 800);
  assert.ok(!a.anomalies.some(x => x.code === 'outlier'));
  assert.strictEqual(a.anomalies.filter(x => x.code === 'elec_outlier').length, 1);
});

test('CSV: Türkçe başlık, noktalı virgül ve ondalık virgül okunur', () => {
  const csv = '﻿Ay;Üretim (t);Elektrik (MWh);Doğalgaz (m3);Motorin (L);Öncül (t)\n1;380;45,6;15.500;650;391,4\n2;400;48;15800;650;412\n';
  const r = TL.parseCSV(csv);
  assert.ok(r.ok);
  const a = TL.aggregate(r.rows, F);
  assert.strictEqual(a.totals.production_t, 780);
  assert.strictEqual(Math.round(a.totals.electricity_mwh * 10) / 10, 93.6);
  assert.strictEqual(a.totals.gas_m3, 31300);
  assert.strictEqual(r.rows.length, 12);
  assert.strictEqual(TL.parseCSV('a;b\n1;2').ok, false);
});

test('CSV şablonu tekrar okunduğunda aynı toplamı verir', () => {
  const r = TL.parseCSV(TL.csvTemplate(rows));
  assert.strictEqual(TL.aggregate(r.rows, F).totals.gas_m3, 175000);
});

test('Tedarikçi mektubu CN kodlarını, miktarı ve AB tüzüğünü içerir', () => {
  const s = TL.supplierLetter({ supplier: 'X Çelik', company: 'Y Haddehane', period: '2026', qty: '5.150', preCn: '7207', preDesc: 'yarı mamul çelik', productCn: '7208', productDesc: 'sıcak haddelenmiş yassı çelik' }, 'tr');
  assert.match(s, /CN 7207/); assert.match(s, /CN 7208/); assert.match(s, /5\.150 ton/); assert.match(s, /2023\/956/);
  assert.match(TL.supplierLetter({ qty: '5,150', preCn: '7207', preDescEn: 'semi-finished steel', productCn: '7208', productDescEn: 'hot-rolled flat steel', period: '2026' }, 'en'), /Regulation \(EU\) 2023\/956/);
});

test('AB veri dosyası: özgül doğrudan emisyon = (doğrudan + öncül) / üretim', () => {
  const r = E.calculate({ country: 'TR', product: '7208', year: 2026, production_t: 5000, export_t: 4000, electricity_mwh: 600, gas_m3: 175000, diesel_l: 8000, precursor_t: 5150, precursor_int: 0.2, route: 'Scrap-EAF', q_pre: 'supplier' }, D);
  const rowsEU = TL.euSummary(r, { company: 'Y', countryName: 'Türkiye', periodStart: '2026-01-01', periodEnd: '2026-12-31', productDesc: 'x', routeName: 'EAF', gridFactor: 0.478, gridSource: 'ETKB 2022', preCn: '7207', preSource: 'supplier', version: D.version, hash: 'h' });
  const get = k => rowsEU.find(x => x[0] === k)[1];
  assert.strictEqual(get('see_direct'), Math.round((360.12 + 1030) / 5000 * 10000) / 10000);
  assert.strictEqual(get('see_indirect'), Math.round(286.8 / 5000 * 10000) / 10000);
  assert.strictEqual(get('elec_per_t'), 0.12);
});

test('Tüm diller aynı metin anahtarlarına sahip', () => {
  for (const l of ['az', 'kk', 'en']) {
    assert.deepStrictEqual(Object.keys(T[l]).sort(), Object.keys(T.tr).sort());
    assert.deepStrictEqual(Object.keys(V3.ADD[l]).sort(), Object.keys(V3.ADD.tr).sort());
    assert.deepStrictEqual(Object.keys(V4.ADD[l]).sort(), Object.keys(V4.ADD.tr).sort());
    assert.deepStrictEqual(Object.keys(V5.ADD[l]).sort(), Object.keys(V5.ADD.tr).sort());
    assert.deepStrictEqual(Object.keys(TOUR[l]).sort(), Object.keys(TOUR.tr).sort());
  }
});
