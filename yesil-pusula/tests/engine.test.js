const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const D = require('../js/data.js');
const E = require('../js/engine.js');
const sha = require('../js/sha256.js');

const DEMO = { country: 'TR', product: '7208', year: 2026, production_t: 5000, export_t: 4000, electricity_mwh: 600, q_elec: 'invoice',
  gas_m3: 175000, q_gas: 'meter', diesel_l: 8000, q_diesel: 'invoice', precursor_t: 5150, precursor_int: 0.2, q_pre: 'supplier', route: 'Scrap-EAF' };

test('AB varsayılan maliyeti kaynaktaki örnekle aynı (TR 7208: 109,90 €/t, Q3 2026 fiyatı)', () => {
  const r = E.calculate(DEMO, D);
  assert.strictEqual(r.default_marked, 2.6708);
  assert.strictEqual(r.deflt.deduction, 1.3358);
  assert.strictEqual(r.deflt.per_t_eur, 109.9);
});

test('Çelikte CBAM gömülü emisyonu elektrik içermez, öncül malzemeyi içerir', () => {
  const r = E.calculate(DEMO, D);
  assert.strictEqual(r.embedded, 0.278);
  const noElec = E.calculate({ ...DEMO, electricity_mwh: 0 }, D);
  assert.strictEqual(noElec.embedded, r.embedded);
  assert.ok(r.footprint_t > r.direct_t);
});

test('Çimento/gübre tipi (toplam kapsam) dolaylı emisyonu sayar', () => {
  const base = { ...DEMO, product: 'custom', default_value: 1.5, bench_actual: 0.5, bench_default: 0.5 };
  const direct = E.calculate({ ...base, scope: 'direct' }, D);
  const total = E.calculate({ ...base, scope: 'total' }, D);
  assert.ok(Math.abs((total.embedded - direct.embedded) - 600 * 0.478 / 5000) < 1e-3);
});

test('Yıl değişince işaretleme ve CBAM faktörü değişir', () => {
  const r = E.calculate({ ...DEMO, year: 2027 }, D);
  assert.strictEqual(r.markup, 0.2);
  assert.strictEqual(r.cbam_factor, 0.95);
});

test('Hatalı girdiler reddedilir', () => {
  assert.throws(() => E.calculate({ ...DEMO, export_t: 9000 }, D), e => e.code === 'gt_production');
  assert.throws(() => E.calculate({ ...DEMO, gas_m3: -5 }, D), e => e.code === 'negative');
  assert.throws(() => E.calculate({ ...DEMO, production_t: 0 }, D), e => e.code === 'positive');
  assert.throws(() => E.calculate({ ...DEMO, country: 'AZ' }, D), e => e.field === 'default_value');
  assert.throws(() => E.calculate({ ...DEMO, solar_mwh: 700 }, D), e => e.code === 'gt_electricity');
});

test('Belirsizlik aralığı tahmini değeri kapsar ve veri kalitesiyle genişler', () => {
  const good = E.calculate(DEMO, D);
  const poor = E.calculate({ ...DEMO, q_gas: 'estimate', q_pre: 'estimate' }, D);
  assert.ok(good.embedded_lo < good.embedded && good.embedded < good.embedded_hi);
  assert.ok(poor.embedded_hi - poor.embedded_lo > good.embedded_hi - good.embedded_lo);
});

test('Güneş senaryosu: 400 kWp, 1450 kWh/kWp, 650 €/kWp, 100 €/MWh', () => {
  const s = E.solar({ kwp: 400, yieldKwhPerKwp: 1450, capexPerKwp: 650, elecPriceEurMwh: 100, consumptionMwh: 600, gridFactor: 0.478, scope: 'direct' });
  assert.strictEqual(s.generation_mwh, 580);
  assert.strictEqual(s.payback_y, 4.5);
  assert.strictEqual(s.cbam_effect_eur, 0);
});

test('Kıyaslama en az 5 firma kuralını uygular', () => {
  assert.strictEqual(E.benchmark(0.3, [0.1, 0.2, 0.4, 0.5], 5).ok, false);
  const b = E.benchmark(0.278, D.products['7208'].peers, 5);
  assert.strictEqual(b.ok, true);
  assert.strictEqual(b.percentile, 75);
});

test('SHA-256 izlenebilirlik özeti Node crypto ile aynı', () => {
  const s = JSON.stringify(DEMO) + '|' + D.version;
  assert.strictEqual(sha(s), crypto.createHash('sha256').update(s, 'utf8').digest('hex'));
});
