/* Yeşil Pusula v2 - hesaplama motoru (tarayıcı ve Node ortak).
   Kapsam 1 (yakıt), Kapsam 2 (elektrik), öncül malzeme, CBAM gömülü emisyonu,
   AB varsayılan değeriyle maliyet karşılaştırması, belirsizlik aralığı,
   güneş senaryosu ve anonim kıyaslama. */
(function (root) {
  'use strict';

  function ValidationError(field, code) {
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
    this.message = field + ':' + code;
  }
  ValidationError.prototype = Object.create(Error.prototype);

  function num(inp, key, opts) {
    opts = opts || {};
    var v = inp[key];
    if (v === undefined || v === null || v === '') {
      if (opts.required) throw new ValidationError(key, 'required');
      return opts.def || 0;
    }
    v = Number(v);
    if (!isFinite(v)) throw new ValidationError(key, 'nan');
    if (v < (opts.min || 0)) throw new ValidationError(key, 'negative');
    if (opts.positive && v <= 0) throw new ValidationError(key, 'positive');
    return v;
  }

  function round(x, d) {
    var p = Math.pow(10, d === undefined ? 3 : d);
    return Math.round(x * p) / p;
  }

  /* Ana hesap */
  function calculate(inp, D) {
    var country = inp.country;
    if (!D.grid[country]) throw new ValidationError('country', 'unknown');
    var prod = D.products[inp.product];
    if (!prod) throw new ValidationError('product', 'unknown');
    var year = Number(inp.year);
    var cy = D.cbam.years[year];
    if (!cy) throw new ValidationError('year', 'unknown');

    var production = num(inp, 'production_t', { required: true, positive: true });
    var exported = num(inp, 'export_t', { required: true });
    if (exported > production) throw new ValidationError('export_t', 'gt_production');

    var scope = inp.product === 'custom' ? (inp.scope === 'total' ? 'total' : 'direct') : prod.scope;
    var gridF = D.grid[country].value;
    var q = D.quality;

    var comps = [];
    function addFuel(key, field, qualField) {
      var qty = num(inp, field);
      var f = D.fuels[key];
      var fac = f.ncv * f.ef;
      var t = qty * fac;
      var ud = q[inp[qualField]] !== undefined ? q[inp[qualField]] : q.estimate;
      comps.push({ key: key, qty: qty, unit: f.unit, factor: fac, t: t, kind: 'direct',
        unc: Math.sqrt(ud * ud + D.factorUnc.fuel * D.factorUnc.fuel) });
    }
    addFuel('gas', 'gas_m3', 'q_gas');
    addFuel('diesel', 'diesel_l', 'q_diesel');
    addFuel('lpg', 'lpg_l', 'q_lpg');
    addFuel('coal', 'coal_t', 'q_coal');

    var elec = num(inp, 'electricity_mwh');
    var selfSolar = num(inp, 'solar_mwh');
    if (selfSolar > elec) throw new ValidationError('solar_mwh', 'gt_electricity');
    var gridMwh = elec - selfSolar;
    var ue = q[inp.q_elec] !== undefined ? q[inp.q_elec] : q.estimate;
    comps.push({ key: 'electricity', qty: gridMwh, unit: 'MWh', factor: gridF, t: gridMwh * gridF, kind: 'indirect',
      unc: Math.sqrt(ue * ue + D.factorUnc.grid * D.factorUnc.grid) });

    var preQty = num(inp, 'precursor_t');
    var preInt = num(inp, 'precursor_int');
    var up = q[inp.q_pre] !== undefined ? q[inp.q_pre] : q.supplier;
    comps.push({ key: 'precursor', qty: preQty, unit: 't', factor: preInt, t: preQty * preInt, kind: 'precursor', unc: up });

    var direct = 0, indirect = 0, pre = 0;
    comps.forEach(function (c) {
      if (c.kind === 'direct') direct += c.t;
      else if (c.kind === 'indirect') indirect += c.t;
      else pre += c.t;
    });

    /* CBAM gömülü emisyon: çelik/alüminyumda yalnız doğrudan + öncül; çimento/gübrede dolaylı da dahil */
    var cbamComps = comps.filter(function (c) { return scope === 'total' || c.kind !== 'indirect'; });
    var cbamTotal = cbamComps.reduce(function (s, c) { return s + c.t; }, 0);
    var sigma = Math.sqrt(cbamComps.reduce(function (s, c) { return s + Math.pow(c.t * c.unc, 2); }, 0));
    var embedded = cbamTotal / production;
    var embSigma = sigma / production;

    /* AB varsayılan değeri */
    var defVal = inp.default_value !== undefined && inp.default_value !== '' ? num(inp, 'default_value') :
      (prod.defaults[country] !== undefined ? prod.defaults[country] : null);
    if (defVal === null) throw new ValidationError('default_value', 'required');
    var markup = prod.sector === 'fert' ? D.cbam.fertMarkup : cy.markup;
    var defMarked = defVal * (1 + markup);

    var price = num(inp, 'price', { def: D.cbam.price.value });
    if (!(price > 0)) price = D.cbam.price.value;

    var benchActual = inp.bench_actual !== undefined && inp.bench_actual !== '' ? num(inp, 'bench_actual') :
      (prod.bench[inp.route] !== undefined ? prod.bench[inp.route] : 0);
    var benchDef = inp.bench_default !== undefined && inp.bench_default !== '' ? num(inp, 'bench_default') :
      (prod.benchDefault !== null ? prod.benchDefault : 0);

    var actual = cbamCost(embedded, benchActual, cy.factor, price, exported);
    var deflt = cbamCost(defMarked, benchDef, cy.factor, price, exported);

    var warnings = [];
    if (elec / production > 5) warnings.push('elec_high');
    if (cbamTotal === 0) warnings.push('zero');
    if (embedded > defMarked) warnings.push('above_default');
    if (preQty > 0 && preQty < production * 0.9) warnings.push('precursor_low');

    return {
      inputs: inp,
      scope: scope,
      components: comps.map(function (c) {
        return { key: c.key, qty: c.qty, unit: c.unit, factor: round(c.factor, 5), t: round(c.t, 2), kind: c.kind, unc: round(c.unc, 3) };
      }),
      direct_t: round(direct, 2),
      indirect_t: round(indirect, 2),
      precursor_t: round(pre, 2),
      footprint_t: round(direct + indirect, 2),
      embedded: round(embedded, 4),
      embedded_lo: round(Math.max(0, embedded - 1.96 * embSigma), 4),
      embedded_hi: round(embedded + 1.96 * embSigma, 4),
      default_value: defVal,
      markup: markup,
      default_marked: round(defMarked, 4),
      embedded_raw: embedded, default_marked_raw: defMarked, bench_actual: benchActual, bench_default: benchDef,
      cbam_factor: cy.factor,
      price: price,
      actual: actual,
      deflt: deflt,
      saving_eur: round(deflt.cost_eur - actual.cost_eur, 0),
      saving_per_t: round(deflt.per_t_eur - actual.per_t_eur, 2),
      warnings: warnings
    };
  }

  /* CBAM yükümlülüğü: (gömülü - kıyas x CBAM faktörü) x fiyat x ihracat */
  function cbamCost(embedded, bench, factor, price, exported) {
    var deduction = bench * factor;
    var chargeable = Math.max(0, embedded - deduction);
    return {
      embedded: round(embedded, 4),
      deduction: round(deduction, 4),
      chargeable: round(chargeable, 4),
      per_t_eur: round(chargeable * price, 2),
      cost_eur: round(chargeable * price * exported, 0)
    };
  }

  /* Güneş senaryosu */
  function solar(p) {
    var kwp = Number(p.kwp), yieldK = Number(p.yieldKwhPerKwp), capex = Number(p.capexPerKwp);
    var price = Number(p.elecPriceEurMwh), consumption = Number(p.consumptionMwh), gridF = Number(p.gridFactor);
    [kwp, yieldK, capex, price, consumption, gridF].forEach(function (v, i) {
      if (!isFinite(v) || v < 0) throw new ValidationError('solar_' + i, 'negative');
    });
    var gen = kwp * yieldK / 1000;
    var used = Math.min(gen, consumption);
    var saving = used * price;
    var invest = kwp * capex;
    var payback = saving > 0 ? invest / saving : null;
    var co2 = used * gridF;
    var cbamEffect = 0;
    if (p.scope === 'total' && p.production > 0) {
      cbamEffect = co2 / p.production * p.price * p.exported;
    }
    return {
      generation_mwh: round(gen, 1), used_mwh: round(used, 1), coverage: consumption > 0 ? round(used / consumption, 3) : 0,
      saving_eur: round(saving, 0), invest_eur: round(invest, 0), payback_y: payback === null ? null : round(payback, 1),
      co2_t: round(co2, 1), cbam_effect_eur: round(cbamEffect, 0)
    };
  }

  /* Anonim kıyaslama: en az minPeers firma yoksa sonuç gösterilmez */
  function benchmark(value, peers, minPeers) {
    if (!peers || peers.length < minPeers) return { ok: false, n: peers ? peers.length : 0 };
    var better = peers.filter(function (x) { return x > value; }).length;
    var sorted = peers.slice().sort(function (a, b) { return a - b; });
    var mid = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    return { ok: true, n: peers.length, percentile: Math.round(better / peers.length * 100), median: round(mid, 3),
      min: sorted[0], max: sorted[sorted.length - 1] };
  }

  var API = { calculate: calculate, cbamCost: cbamCost, solar: solar, benchmark: benchmark, ValidationError: ValidationError, round: round };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.YP_ENGINE = API;
})(this);
