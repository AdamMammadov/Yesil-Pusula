const test = require('node:test');
const assert = require('node:assert');
const D = require('../js/data.js');
const E = require('../js/engine.js');
const R = require('../js/roadmap.js');
const O = require('../js/osb.js');

const inp = { country: 'TR', product: '7208', year: 2026, production_t: 5000, export_t: 4000, electricity_mwh: 600, gas_m3: 175000, diesel_l: 8000, precursor_t: 5150, precursor_int: 0.2, q_pre: 'supplier', route: 'Scrap-EAF' };
const r = E.calculate(inp, D);
const ctx = { gasF: D.fuels.gas.ncv * D.fuels.gas.ef, gridF: 0.478, gasPrice: 0.40, elecPrice: 100, solarYield: 1450, rate: 0.08, scope: 'direct' };

test('Projeksiyon: 2026 değerleri tek yıllık hesapla aynı, 2034’te ücretsiz tahsis biter', () => {
  const p = R.projection(r, { schedule: 'law' });
  assert.strictEqual(p.years[0].def, r.deflt.cost_eur);
  assert.strictEqual(p.years[0].act, r.actual.cost_eur);
  const y34 = p.years.find(y => y.year === 2034);
  assert.strictEqual(y34.factor, 0);
  assert.strictEqual(y34.defPerT, Math.round(2.428 * 1.3 * 82.32 * 100) / 100);
  assert.ok(p.cumSaving > 6000000);
});

test('COM(2026) 616 önerisi maliyet artışını yavaşlatır ama ortadan kaldırmaz', () => {
  const law = R.projection(r, { schedule: 'law' }), prop = R.projection(r, { schedule: 'proposal' });
  assert.ok(prop.cumDef < law.cumDef);
  assert.ok(prop.years[8].def > prop.years[0].def);
});

test('Çelikte elektrik önlemleri CBAM maliyetini değiştirmez, kurumsal ayak izini azaltır', () => {
  const ev = R.evaluate(r, R.MEASURES, ctx);
  const vsd = ev.rows.find(x => x.id === 'vsd'), solar = ev.rows.find(x => x.id === 'solar');
  assert.strictEqual(vsd.cbamSave, 0); assert.strictEqual(solar.cbamSave, 0);
  assert.ok(solar.co2Total > 270);
  const evTotal = R.evaluate(r, R.MEASURES, { ...ctx, scope: 'total' });
  assert.ok(evTotal.rows.find(x => x.id === 'solar').cbamSave > 0);
});

test('Atık ısı geri kazanımı: %20 doğalgaz azaltımı doğru hesaplanır', () => {
  const ev = R.evaluate(r, R.MEASURES, ctx);
  const rec = ev.rows.find(x => x.id === 'recup');
  assert.strictEqual(rec.energySave, 14000);
  assert.strictEqual(rec.co2Total, Math.round(35000 * ctx.gasF * 10) / 10);
  assert.ok(rec.payback > 4 && rec.payback < 6);
});

test('MACC blokları maliyete göre sıralı ve bitişik', () => {
  const m = R.macc(R.evaluate(r, R.MEASURES, ctx).rows);
  for (let i = 1; i < m.length; i++) { assert.ok(m[i].cost >= m[i - 1].cost); assert.ok(Math.abs(m[i].x0 - m[i - 1].x1) < 1e-9); }
});

test('Sermaye geri kazanım faktörü (CRF) %8, 10 yıl = 0,149', () => {
  assert.strictEqual(Math.round(R.crf(0.08, 10) * 1000) / 1000, 0.149);
});

test('OSB paneli: toplamlar firmaların toplamına eşit ve potansiyel pozitif', () => {
  const o = O.aggregate(O.FIRMS, D, E, 2026);
  assert.strictEqual(o.tot.export_t, O.FIRMS.reduce((s, f) => s + f.export_t, 0));
  assert.strictEqual(o.counts.actual + o.counts.partial + o.counts.none, O.FIRMS.length);
  assert.ok(o.potential > 0);
  assert.ok(o.tot.costActualAll <= o.tot.costNow && o.tot.costNow <= o.tot.costDefaultAll);
});
