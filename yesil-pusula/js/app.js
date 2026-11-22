/* Yeşil Pusula v2 - arayüz */
(function () {
  'use strict';
  var D = window.YP_DATA, T = window.YP_I18N, E = window.YP_ENGINE, SHA = window.YP_SHA256;
  var $ = function (id) { return document.getElementById(id); };
  var lang = 'tr';
  try { var saved = localStorage.getItem('yp_lang'); if (saved && T[saved]) lang = saved; } catch (e) { /* depolama yok */ }
  var last = null;

  var DEMO = {
    company: 'Örnek Haddehane A.Ş. (kurgusal)', country: 'TR', year: '2026', product: '7208', scope: 'direct',
    production_t: 5000, export_t: 4000, route: 'Scrap-EAF',
    electricity_mwh: 600, q_elec: 'invoice', solar_mwh: 0,
    gas_m3: 175000, q_gas: 'meter', diesel_l: 8000, q_diesel: 'invoice', lpg_l: 0, q_lpg: 'invoice', coal_t: 0, q_coal: 'invoice',
    precursor_t: 5150, precursor_int: 0.20, q_pre: 'supplier',
    price: D.cbam.price.value
  };
  var FIELDS = ['company', 'country', 'year', 'product', 'scope', 'production_t', 'export_t', 'route', 'electricity_mwh', 'q_elec', 'solar_mwh',
    'gas_m3', 'q_gas', 'diesel_l', 'q_diesel', 'lpg_l', 'q_lpg', 'coal_t', 'q_coal', 'precursor_t', 'precursor_int', 'q_pre',
    'default_value', 'bench_actual', 'price'];

  function t(key, vars) {
    var s = (T[lang] && T[lang][key]) || T.tr[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  function fmt(x, d) {
    if (x === null || x === undefined || !isFinite(x)) return '-';
    return new Intl.NumberFormat(numLocale(), { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }).format(x);
  }
  function numLocale() {
    var l = T[lang].locale;
    if (lang === 'kk') return 'ru-RU';
    try { if (Intl.NumberFormat.supportedLocalesOf([l]).length) return l; } catch (e) { /* yok */ }
    return lang === 'kk' ? 'ru-RU' : lang === 'az' ? 'tr-TR' : l;
  }
  function pct(x, d) { return '%' + fmt(x * 100, d || 0); }
  function pctL(x, d) { return lang === 'tr' ? pct(x, d) : fmt(x * 100, d || 0) + '%'; }
  function eur(x) { return '€' + fmt(x, 0); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function options(sel, list, value) {
    var el = $(sel);
    el.innerHTML = list.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + '</option>'; }).join('');
    if (value !== undefined && list.some(function (o) { return String(o[0]) === String(value); })) el.value = value;
  }

  function fillSelects() {
    var keep = {};
    ['country', 'year', 'product', 'scope', 'route', 'q_elec', 'q_gas', 'q_diesel', 'q_lpg', 'q_coal', 'q_pre'].forEach(function (k) { keep[k] = $(k).value; });
    options('country', Object.keys(D.grid).map(function (c) { return [c, t('c_' + c)]; }), keep.country || 'TR');
    options('year', Object.keys(D.cbam.years).map(function (y) { return [y, y]; }), keep.year || '2026');
    options('product', Object.keys(D.products).map(function (p) { return [p, t('p_' + p)]; }), keep.product || '7208');
    options('scope', [['direct', t('scope_direct')], ['total', t('scope_total')]], keep.scope || 'direct');
    var q = ['meter', 'invoice', 'supplier', 'estimate'].map(function (k) { return [k, t('q_' + k)]; });
    ['q_elec', 'q_gas', 'q_diesel', 'q_lpg', 'q_coal'].forEach(function (k) { options(k, q, keep[k] || 'invoice'); });
    options('q_pre', q, keep.q_pre || 'supplier');
    fillRoutes(keep.route);
  }

  function fillRoutes(value) {
    var prod = D.products[$('product').value];
    var list = Object.keys(prod.bench).map(function (r) { return [r, t('r_' + r.replace(/-/g, '_')) + ' (' + fmt(prod.bench[r], 3) + ')']; });
    list.push(['none', t('r_none')]);
    options('route', list, value || list[0][0]);
  }

  function syncProduct(resetDefault) {
    var prod = D.products[$('product').value], c = $('country').value;
    $('scopeWrap').hidden = $('product').value !== 'custom';
    var has = prod.defaults[c] !== undefined;
    if (resetDefault) $('default_value').value = has ? prod.defaults[c] : '';
    $('defHint').textContent = has ? t('default_hint_ok') : t('default_hint_need');
    syncRoute();
    var g = D.grid[c];
    $('gridHint').textContent = t('grid_hint') + ': ' + fmt(g.value, 3) + ' tCO2e/MWh (' + (g.src === 'tr_etkb' ? 'ETKB' : 'Ember') + ' ' + g.year + ')';
    $('s_yield').value = D.solarYield[c];
  }
  function syncRoute() {
    var prod = D.products[$('product').value], r = $('route').value;
    if (r !== 'none' && prod.bench[r] !== undefined) $('bench_actual').value = prod.bench[r];
  }

  function applyLang() {
    document.documentElement.lang = lang === 'kk' ? 'kk' : lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('.lang button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-lang') === lang); });
    fillSelects();
    syncProduct(false);
    renderSources();
    if (window.YP_onLang) window.YP_onLang();
    if (last) render(last); else calc();
  }

  function readForm() {
    var inp = {};
    FIELDS.forEach(function (k) { inp[k] = $(k).value; });
    if (inp.route === 'none') delete inp.route;
    if (inp.product === 'custom') inp.bench_default = inp.bench_actual;
    return inp;
  }

  function clearErrors() {
    document.querySelectorAll('.invalid').forEach(function (el) { el.classList.remove('invalid'); });
    document.querySelectorAll('.ferr').forEach(function (el) { el.remove(); });
    $('msgs').innerHTML = '';
  }

  function calc() {
    clearErrors();
    var inp = readForm();
    try {
      last = E.calculate(inp, D);
      render(last);
    } catch (err) {
      if (!(err instanceof E.ValidationError)) throw err;
      var el = $(err.field);
      var msg = t('e_' + err.code);
      if (el) {
        el.classList.add('invalid');
        var span = document.createElement('span');
        span.className = 'ferr';
        span.textContent = msg;
        (el.parentNode.classList.contains('inp') ? el.parentNode : el).insertAdjacentElement('afterend', span);
        el.focus();
      }
      $('msgs').innerHTML = '<div class="msg err">' + esc((el && el.labels && el.labels[0] ? el.labels[0].textContent + ': ' : '') + msg) + '</div>';
      showTab('res');
    }
  }

  function render(r) {
    var w = r.warnings.map(function (k) { return '<div class="msg warn">' + esc(t('w_' + k)) + '</div>'; }).join('');
    $('msgs').innerHTML = w;
    $('kEmb').textContent = fmt(r.embedded, 3) + ' tCO2e/t';
    $('kRange').textContent = t('k_range') + ': ' + fmt(r.embedded_lo, 3) + ' - ' + fmt(r.embedded_hi, 3);
    $('kDef').textContent = fmt(r.default_marked, 3);
    $('kSave').textContent = eur(r.saving_eur);
    $('kSaveT').textContent = '€' + fmt(r.saving_per_t, 2) + ' / t';
    $('kFoot').textContent = fmt(r.footprint_t, 0);

    var rows = [
      ['row_emb', r.actual.embedded, r.deflt.embedded, 3],
      ['row_ded', r.actual.deduction, r.deflt.deduction, 3],
      ['row_chg', r.actual.chargeable, r.deflt.chargeable, 3],
      ['row_pt', r.actual.per_t_eur, r.deflt.per_t_eur, 2]
    ];
    $('cmpTable').innerHTML = '<tr><th></th><th class="n">' + t('col_actual') + '</th><th class="n">' + t('col_default') + '</th></tr>' +
      rows.map(function (x) { return '<tr><td>' + t(x[0]) + '</td><td class="n a">' + fmt(x[1], x[3]) + '</td><td class="n d">' + fmt(x[2], x[3]) + '</td></tr>'; }).join('') +
      '<tr class="tot"><td>' + t('row_cost') + '</td><td class="n a">' + eur(r.actual.cost_eur) + '</td><td class="n d">' + eur(r.deflt.cost_eur) + '</td></tr>';
    $('chart').innerHTML = costChart(r);
    $('scopeNote').textContent = r.scope === 'total' ? t('scope_note_total') : t('scope_note_direct');
    $('formula').textContent = t('formula', { f: pctL(r.cbam_factor, 1), m: pctL(r.markup, 0) });

    $('bdTable').innerHTML = '<tr><th>' + t('col_src') + '</th><th class="n">' + t('col_qty') + '</th><th class="n">' + t('col_fac') + '</th><th class="n">' + t('col_t') + '</th><th>' + t('col_kind') + '</th><th class="n">' + t('col_unc') + '</th></tr>' +
      r.components.filter(function (c) { return c.qty > 0; }).map(function (c) {
        return '<tr><td>' + t('n_' + c.key) + '</td><td class="n">' + fmt(c.qty, 0) + ' ' + c.unit + '</td><td class="n">' + fmt(c.factor, 5) + '</td><td class="n"><b>' + fmt(c.t, 1) + '</b></td><td><span class="tag ' + c.kind + '">' + t('kind_' + c.kind) + '</span></td><td class="n">±' + pctL(c.unc, 1) + '</td></tr>';
      }).join('');

    renderSolar();
    renderBench(r);
    renderReport(r);
    if (window.YP_onRender) window.YP_onRender(r);
  }

  function costChart(r) {
    var a = r.actual.cost_eur, d = r.deflt.cost_eur, max = Math.max(a, d, 1);
    var W = 300, x0 = 92;
    function bar(y, v, col, label) {
      var w = Math.max(2, (W - 10) * v / max);
      var inside = w > W - 90;
      var lx = inside ? x0 + w - 8 : x0 + w + 6;
      return '<text x="0" y="' + (y + 19) + '" font-size="12" fill="#5c6b7a">' + esc(label) + '</text>' +
        '<rect x="' + x0 + '" y="' + y + '" width="' + w + '" height="28" rx="5" fill="' + col + '"/>' +
        '<text x="' + lx + '" y="' + (y + 19) + '" font-size="12.5" font-weight="700" fill="' + (inside ? '#fff' : '#1b2632') + '"' + (inside ? ' text-anchor="end"' : '') + '>' + eur(v) + '</text>';
    }
    var svg = '<svg viewBox="0 0 ' + (x0 + W) + ' 92" width="100%" role="img" aria-label="' + esc(t('chart_title')) + '">' +
      bar(10, a, '#2A7F8E', t('col_actual')) + bar(52, d, '#C8553D', t('col_default')) +
      '</svg><p style="margin:4px 0 0;font-weight:700;color:#2E8B57;font-size:13.5px">' + esc(t('k_saving')) + ': ' + eur(r.saving_eur) + '</p>';
    return svg;
  }

  function renderSolar() {
    var c = $('country').value;
    try {
      var r = last;
      var s = E.solar({
        kwp: $('s_kwp').value || 0, yieldKwhPerKwp: $('s_yield').value || 0, capexPerKwp: $('s_capex').value || 0,
        elecPriceEurMwh: $('s_price').value || 0, consumptionMwh: Number($('electricity_mwh').value) || 0,
        gridFactor: D.grid[c].value, scope: r ? r.scope : 'direct', production: r ? Number(r.inputs.production_t) : 0,
        exported: r ? Number(r.inputs.export_t) : 0, price: r ? r.price : D.cbam.price.value
      });
      var items = [
        ['o_gen', fmt(s.generation_mwh, 0) + ' MWh'], ['o_cov', pctL(s.coverage, 0)], ['o_saving', eur(s.saving_eur)], ['o_invest', eur(s.invest_eur)],
        ['o_payback', s.payback_y === null ? '-' : fmt(s.payback_y, 1) + ' ' + t('years')], ['o_co2', fmt(s.co2_t, 0) + ' tCO2e'],
        ['o_used', fmt(s.used_mwh, 0) + ' MWh'], ['o_cbam', r && r.scope === 'total' ? eur(s.cbam_effect_eur) : '-']
      ];
      $('solarOut').innerHTML = items.map(function (i) { return '<div class="kpi"><div class="l">' + t(i[0]) + '</div><div class="v">' + i[1] + '</div></div>'; }).join('');
      $('solarCbam').textContent = r && r.scope === 'total' ? '' : t('cbam_none');
    } catch (e) {
      $('solarOut').innerHTML = '<div class="msg err">' + esc(t('e_negative')) + '</div>';
    }
  }

  function renderBench(r) {
    var prod = D.products[r.inputs.product];
    var b = E.benchmark(r.embedded, prod.peers, D.minPeers);
    $('benchMin').textContent = t('bench_min', { k: D.minPeers });
    if (!b.ok) { $('benchOut').innerHTML = '<div class="msg warn">' + esc(t('bench_min', { k: D.minPeers })) + '</div>'; return; }
    var lo = Math.min(b.min, r.embedded) * 0.85, hi = Math.max(b.max, r.embedded) * 1.1, W = 560, x = function (v) { return 20 + (W - 40) * (v - lo) / (hi - lo); };
    var dots = prod.peers.map(function (p) { return '<circle cx="' + x(p) + '" cy="52" r="8" fill="#b9c6d3"/>'; }).join('');
    var svg = '<svg viewBox="0 0 ' + W + ' 110" width="100%" role="img">' +
      '<line x1="20" y1="52" x2="' + (W - 20) + '" y2="52" stroke="#dde4eb" stroke-width="4" stroke-linecap="round"/>' + dots +
      '<line x1="' + x(b.median) + '" y1="30" x2="' + x(b.median) + '" y2="74" stroke="#5c6b7a" stroke-dasharray="4 3"/>' +
      '<text x="' + x(b.median) + '" y="92" font-size="12" text-anchor="middle" fill="#5c6b7a">' + esc(t('bench_median')) + ' ' + fmt(b.median, 2) + '</text>' +
      '<circle cx="' + x(r.embedded) + '" cy="52" r="11" fill="#2A7F8E" stroke="#fff" stroke-width="3"/>' +
      '<text x="' + x(r.embedded) + '" y="24" font-size="13" font-weight="700" text-anchor="middle" fill="#2A7F8E">' + esc(t('bench_you')) + ' ' + fmt(r.embedded, 2) + '</text>' +
      '<text x="20" y="108" font-size="11" fill="#5c6b7a">tCO2e/t</text></svg>';
    $('benchOut').innerHTML = '<p style="font-size:16px;font-weight:600;color:#1F3A5F;margin:0 0 8px">' + esc(t('bench_text', { n: b.n, p: fmt(b.percentile, 0) })) + '</p>' + svg;
  }

  function sortedJSON(o) {
    var keys = Object.keys(o).sort(), out = {};
    keys.forEach(function (k) { out[k] = o[k]; });
    return JSON.stringify(out);
  }

  function renderReport(r) {
    var hash = SHA(sortedJSON(r.inputs) + '|' + D.version);
    var date = new Date().toLocaleDateString(T[lang].locale, { year: 'numeric', month: 'long', day: 'numeric' });
    var bd = r.components.filter(function (c) { return c.qty > 0; }).map(function (c) {
      return '<tr><td>' + t('n_' + c.key) + '</td><td class="n">' + fmt(c.qty, 0) + ' ' + c.unit + '</td><td class="n">' + fmt(c.factor, 5) + '</td><td class="n">' + fmt(c.t, 1) + '</td><td>' + t('kind_' + c.kind) + '</td></tr>';
    }).join('');
    $('report').innerHTML =
      '<h3>' + t('rep_title') + '</h3><div class="note">Yeşil Pusula · ' + esc(t('badge')) + '</div>' +
      '<div class="meta">' +
      '<div><b>' + t('rep_company') + '</b>' + esc(r.inputs.company || '-') + '</div>' +
      '<div><b>' + t('rep_product') + '</b>' + esc(t('p_' + r.inputs.product)) + '</div>' +
      '<div><b>' + t('country') + ' / ' + t('rep_period') + '</b>' + esc(t('c_' + r.inputs.country)) + ' / ' + esc(r.inputs.year) + '</div>' +
      '<div><b>' + t('production') + '</b>' + fmt(Number(r.inputs.production_t), 0) + ' t</div>' +
      '<div><b>' + t('export') + '</b>' + fmt(Number(r.inputs.export_t), 0) + ' t</div>' +
      '<div><b>' + t('rep_date') + '</b>' + esc(date) + '</div>' +
      '</div>' +
      '<table class="cmp"><tr><th></th><th class="n">' + t('col_actual') + '</th><th class="n">' + t('col_default') + '</th></tr>' +
      '<tr><td>' + t('row_emb') + '</td><td class="n a">' + fmt(r.actual.embedded, 3) + ' (' + fmt(r.embedded_lo, 3) + ' - ' + fmt(r.embedded_hi, 3) + ')</td><td class="n d">' + fmt(r.deflt.embedded, 3) + '</td></tr>' +
      '<tr><td>' + t('row_chg') + '</td><td class="n a">' + fmt(r.actual.chargeable, 3) + '</td><td class="n d">' + fmt(r.deflt.chargeable, 3) + '</td></tr>' +
      '<tr class="tot"><td>' + t('row_cost') + '</td><td class="n a">' + eur(r.actual.cost_eur) + '</td><td class="n d">' + eur(r.deflt.cost_eur) + '</td></tr></table>' +
      '<p class="note">' + esc(t('formula', { f: pctL(r.cbam_factor, 1), m: pctL(r.markup, 0) })) + ' ' + esc(t('price')) + ': €' + fmt(r.price, 2) + '/tCO2e.</p>' +
      '<h3 style="font-size:14px;margin-top:14px">' + t('breakdown') + '</h3>' +
      '<table><tr><th>' + t('col_src') + '</th><th class="n">' + t('col_qty') + '</th><th class="n">' + t('col_fac') + '</th><th class="n">' + t('col_t') + '</th><th>' + t('col_kind') + '</th></tr>' + bd + '</table>' +
      '<div class="meta" style="margin-top:14px"><div><b>' + t('rep_ver') + '</b>' + D.version + '</div><div style="grid-column:span 2"><b>' + t('rep_hash') + '</b><span class="hash">' + hash + '</span></div></div>' +
      '<div class="disc">' + esc(t('rep_disc')) + '</div>';
  }

  function renderSources() {
    $('ver').textContent = t('rep_ver') + ': ' + D.version + ' (' + D.updated + ')';
    $('srcList').innerHTML = D.sources.map(function (s) {
      return '<li>' + esc(s.text) + '<br><a href="' + s.url + '" target="_blank" rel="noopener">' + esc(s.url) + '</a></li>';
    }).join('');
  }

  function showTab(name) {
    document.querySelectorAll('.tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === name); });
    document.querySelectorAll('.tab').forEach(function (el) { el.hidden = el.id !== 'tab-' + name; });
  }

  function loadDemo() {
    Object.keys(DEMO).forEach(function (k) { if ($(k)) $(k).value = DEMO[k]; });
    syncProduct(true);
    $('route').value = DEMO.route;
    syncRoute();
    $('s_kwp').value = 400; $('s_capex').value = 650; $('s_price').value = 100;
    calc();
  }

  /* olaylar */
  $('f').addEventListener('submit', function (e) { e.preventDefault(); calc(); });
  $('country').addEventListener('change', function () { syncProduct(true); calc(); });
  $('product').addEventListener('change', function () { fillRoutes(); syncProduct(true); calc(); });
  $('route').addEventListener('change', function () { syncRoute(); calc(); });
  $('year').addEventListener('change', calc);
  $('scope').addEventListener('change', calc);
  ['s_kwp', 's_yield', 's_capex', 's_price'].forEach(function (id) { $(id).addEventListener('input', renderSolar); });
  $('demo').addEventListener('click', loadDemo);
  $('clear').addEventListener('click', function () {
    ['company', 'production_t', 'export_t', 'electricity_mwh', 'solar_mwh', 'gas_m3', 'diesel_l', 'lpg_l', 'coal_t', 'precursor_t', 'precursor_int'].forEach(function (k) { $(k).value = ''; });
    last = null; clearErrors();
    ['kEmb', 'kDef', 'kSave', 'kFoot'].forEach(function (k) { $(k).textContent = '-'; });
    ['kRange', 'kSaveT'].forEach(function (k) { $(k).textContent = ''; });
    $('cmpTable').innerHTML = ''; $('chart').innerHTML = ''; $('bdTable').innerHTML = ''; $('report').innerHTML = '';
    $('production_t').focus();
  });
  document.querySelectorAll('.tabs button').forEach(function (b) { b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); }); });
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.getAttribute('data-lang');
      try { localStorage.setItem('yp_lang', lang); } catch (e) { /* yok say */ }
      applyLang();
    });
  });
  $('print').addEventListener('click', function () { showTab('report'); window.print(); });

  window.YP_APP = {
    calc: calc, t: t, fmt: fmt, eur: eur, esc: esc, showTab: showTab, syncProduct: syncProduct, fillRoutes: fillRoutes, syncRoute: syncRoute,
    FIELDS: FIELDS, last: function () { return last; }, lang: function () { return lang; }, numLocale: numLocale
  };

  /* başlangıç */
  Object.keys(DEMO).forEach(function (k) { if ($(k)) $(k).value = DEMO[k]; });
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
  document.querySelectorAll('.lang button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-lang') === lang); });
  fillSelects();
  Object.keys(DEMO).forEach(function (k) { if ($(k) && $(k).tagName === 'SELECT') $(k).value = DEMO[k]; });
  fillRoutes(DEMO.route);
  syncProduct(true);
  renderSources();
  showTab('res');
  calc();
})();
