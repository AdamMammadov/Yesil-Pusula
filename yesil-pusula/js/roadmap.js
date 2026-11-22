/* Yeşil Pusula v4 - azaltım yol haritası:
   2026-2034 CBAM maliyet projeksiyonu (yürürlükteki takvim ve COM(2026) 616 önerisi),
   önlem kütüphanesi, önlem etkileri, azaltım maliyet eğrisi (MACC). */
(function (root) {
  'use strict';

  /* CBAM faktörü: AB ETS Direktifi Md. 10a(1a) (yürürlükte) ve Komisyon önerisi COM(2026) 616 (17 Temmuz 2026, yasalaşmadı) */
  var SCHEDULES = {
    law: { 2026: 0.975, 2027: 0.95, 2028: 0.90, 2029: 0.775, 2030: 0.515, 2031: 0.39, 2032: 0.265, 2033: 0.14, 2034: 0 },
    proposal: { 2026: 0.975, 2027: 0.95, 2028: 0.915, 2029: 0.81, 2030: 0.59, 2031: 0.48, 2032: 0.375, 2033: 0.27, 2034: 0.15 }
  };
  var MARKUP = { 2026: 0.10, 2027: 0.20 }; /* 2028 ve sonrası %30 */
  function markupFor(y, sector) { return sector === 'fert' ? 0.01 : (MARKUP[y] !== undefined ? MARKUP[y] : 0.30); }

  function round(x, d) { var p = Math.pow(10, d === undefined ? 2 : d); return Math.round(x * p) / p; }

  /* r: engine.calculate sonucu; opt: {schedule, priceGrowth, embeddedAfter} */
  function projection(r, opt) {
    opt = opt || {};
    var sch = SCHEDULES[opt.schedule] || SCHEDULES.law;
    var g = Number(opt.priceGrowth) || 0;
    var exp = Number(r.inputs.export_t);
    var sector = opt.sector || 'steel';
    var benchA = r.bench_actual, benchD = r.bench_default, embRaw = r.embedded_raw;
    var defRaw = r.default_value;
    var after = opt.embeddedAfter !== undefined ? opt.embeddedAfter : r.embedded;
    var out = [], cum = { def: 0, act: 0, after: 0 };
    Object.keys(sch).forEach(function (ys, i) {
      var y = Number(ys), f = sch[ys], price = r.price * Math.pow(1 + g, i);
      var defM = defRaw * (1 + markupFor(y, sector));
      /* motorla aynı formül: (gömülü - kıyas x faktör) x fiyat x ihracat */
      var chD = Math.max(0, defM - benchD * f);
      var chA = Math.max(0, embRaw - benchA * f);
      var chM = Math.max(0, (after === r.embedded ? embRaw : after) - benchA * f);
      var cD = chD * price * exp, cA = chA * price * exp, cM = chM * price * exp;
      cum.def += cD; cum.act += cA; cum.after += cM;
      out.push({ year: y, factor: f, price: round(price, 2), def: Math.round(cD), act: Math.round(cA), after: Math.round(cM),
        defPerT: round(chD * price, 2), actPerT: round(chA * price, 2) });
    });
    return { years: out, cumDef: Math.round(cum.def), cumAct: Math.round(cum.act), cumAfter: Math.round(cum.after), cumSaving: Math.round(cum.def - cum.act), cumSavingMeasures: Math.round(cum.act - cum.after) };
  }

  /* Önlem kütüphanesi. type: 'gas' | 'elec' | 'precursor' | 'solar'.
     pct: azaltım oranı; capex (€); life (yıl); opex: yıllık ek maliyet (€). Değerler varsayımdır, firmaya göre düzenlenir. */
  var MEASURES = [
    { id: 'recup', type: 'gas', pct: 0.20, capex: 90000, life: 15, opex: 0, src: 'doe_preheat' },
    { id: 'burner', type: 'gas', pct: 0.07, capex: 20000, life: 10, opex: 0, src: 'assume' },
    { id: 'supplier', type: 'precursor', newInt: 0.15, capex: 0, life: 1, opexPerT: 2, src: 'assume' },
    { id: 'vsd', type: 'elec', pct: 0.08, capex: 30000, life: 12, opex: 0, src: 'assume' },
    { id: 'solar', type: 'solar', kwp: 400, capex: 260000, life: 25, opex: 0, src: 'pvgis' }
  ];

  function crf(rate, n) { if (rate <= 0) return 1 / n; var q = Math.pow(1 + rate, n); return rate * q / (q - 1); }

  /* Her önlemin etkisi. ctx: {gasF, gridF, gasPrice, elecPrice, solarYield, rate, scope} */
  function evaluate(r, measures, ctx) {
    var inp = r.inputs;
    var prod = Number(inp.production_t), exp = Number(inp.export_t);
    var gas = Number(inp.gas_m3) || 0, elec = Number(inp.electricity_mwh) || 0, solarNow = Number(inp.solar_mwh) || 0;
    var preQ = Number(inp.precursor_t) || 0, preI = Number(inp.precursor_int) || 0;
    var gridMwh = Math.max(0, elec - solarNow);
    var rows = measures.map(function (m) {
      var dGas = 0, dElec = 0, dPre = 0, energySave = 0, extra = 0;
      if (m.type === 'gas') { dGas = gas * m.pct; energySave = dGas * ctx.gasPrice; }
      if (m.type === 'elec') { dElec = gridMwh * m.pct; energySave = dElec * ctx.elecPrice; }
      if (m.type === 'solar') { dElec = Math.min(gridMwh, m.kwp * ctx.solarYield / 1000); energySave = dElec * ctx.elecPrice; }
      if (m.type === 'precursor') { dPre = preQ * Math.max(0, preI - m.newInt); extra = preQ * (m.opexPerT || 0); }
      var co2Direct = dGas * ctx.gasF;
      var co2Elec = dElec * ctx.gridF;
      var co2Cbam = co2Direct + dPre + (ctx.scope === 'total' ? co2Elec : 0);
      var co2Total = co2Direct + co2Elec + dPre;
      var cbamSave = co2Cbam / prod * r.price * exp;          /* ilk yıl, mevcut fiyatla */
      var annualized = (m.capex || 0) * crf(ctx.rate, m.life || 1);
      var netAnnual = energySave + cbamSave - extra - (m.opex || 0);
      var payback = (m.capex || 0) > 0 ? (netAnnual > 0 ? (m.capex / netAnnual) : null) : 0;
      var maccCost = co2Total > 0 ? (annualized + extra + (m.opex || 0) - energySave) / co2Total : null; /* CBAM hariç, €/tCO2e */
      return { id: m.id, type: m.type, capex: m.capex || 0, life: m.life, co2Total: round(co2Total, 1), co2Cbam: round(co2Cbam, 1),
        embeddedDelta: round(co2Cbam / prod, 4), energySave: Math.round(energySave), cbamSave: Math.round(cbamSave), extra: Math.round(extra),
        netAnnual: Math.round(netAnnual), payback: payback === null ? null : round(payback, 1), maccCost: maccCost === null ? null : round(maccCost, 1) };
    });
    var sel = rows;
    var sum = { co2Total: 0, co2Cbam: 0, capex: 0, netAnnual: 0, energySave: 0, cbamSave: 0 };
    sel.forEach(function (x) { sum.co2Total += x.co2Total; sum.co2Cbam += x.co2Cbam; sum.capex += x.capex; sum.netAnnual += x.netAnnual; sum.energySave += x.energySave; sum.cbamSave += x.cbamSave; });
    sum.embeddedAfter = round(Math.max(0, r.embedded - sum.co2Cbam / prod), 4);
    sum.footprintAfter = round(r.footprint_t + r.precursor_t - sum.co2Total, 1);
    sum.payback = sum.capex > 0 && sum.netAnnual > 0 ? round(sum.capex / sum.netAnnual, 1) : null;
    return { rows: rows, sum: sum };
  }

  /* MACC: maliyete göre sıralı bloklar (genişlik = azaltım, yükseklik = €/tCO2e) */
  function macc(rows) {
    var x = 0;
    return rows.filter(function (r) { return r.co2Total > 0 && r.maccCost !== null; })
      .sort(function (a, b) { return a.maccCost - b.maccCost; })
      .map(function (r) { var b = { id: r.id, x0: x, x1: x + r.co2Total, cost: r.maccCost }; x += r.co2Total; return b; });
  }

  var API = { SCHEDULES: SCHEDULES, MEASURES: MEASURES, markupFor: markupFor, projection: projection, evaluate: evaluate, macc: macc, crf: crf };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.YP_ROADMAP = API;
})(this);
