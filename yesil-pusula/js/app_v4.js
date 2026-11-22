/* Yeşil Pusula v4 - sayfa yönlendirme, ana sayfa, yol haritası, projeksiyon, OSB paneli, yöntem sayfası */
(function () {
  'use strict';
  var A = window.YP_APP, D = window.YP_DATA, E = window.YP_ENGINE, R = window.YP_ROADMAP, O = window.YP_OSB;
  var $ = function (id) { return document.getElementById(id); };
  var t = A.t, fmt = A.fmt, esc = A.esc, eur = A.eur;
  var NS = 'http://www.w3.org/2000/svg';

  var DEMO_INPUT = { company: 'Örnek Haddehane A.Ş.', country: 'TR', product: '7208', year: 2026, production_t: 5000, export_t: 4000, route: 'Scrap-EAF',
    electricity_mwh: 600, q_elec: 'invoice', gas_m3: 175000, q_gas: 'meter', diesel_l: 8000, q_diesel: 'invoice', precursor_t: 5150, precursor_int: 0.2, q_pre: 'supplier' };

  function meur(v) { return Math.abs(v) >= 1e6 ? '€' + fmt(v / 1e6, 2) + 'M' : eur(v); }
  function keur(v) { return Math.abs(v) >= 1e6 ? '€' + fmt(v / 1e6, 1) + 'M' : '€' + fmt(v / 1000, 0) + 'k'; }
  function pctTxt(x, d) { return A.lang() === 'tr' ? '%' + fmt(x * 100, d || 0) : fmt(x * 100, d || 0) + '%'; }

  window.YP_V4 = { sel: null };

  /* ---------------- yönlendirme ---------------- */
  var VIEWS = { home: 'home', firma: 'firm', osb: 'osb', yontem: 'method' };
  function route() {
    var h = (location.hash || '#home').slice(1);
    var v = VIEWS[h] || 'home';
    document.querySelectorAll('.view').forEach(function (el) { el.hidden = el.id !== 'view-' + v; });
    document.querySelectorAll('.mainnav a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-view') === v); });
    if (v === 'home') renderHome();
    if (v === 'osb') renderOSB();
    if (v === 'method') renderMethod();
    if (v === 'firm') renderRoadmap();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------------- SVG yardımcıları ---------------- */
  function svg(w, h, inner, label) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" role="img" aria-label="' + esc(label || '') + '">' + inner + '</svg>';
  }
  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 11) + '" style="fill:' + (o.fill || 'var(--text3)') + '"' + (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + esc(s) + '</text>';
  }

  /* Projeksiyon çizgi grafiği */
  function projChart(p, opts) {
    opts = opts || {};
    var W = 640, H = opts.h || 250, L = 58, Rm = 14, T = 30, B = 28;
    var max = Math.max.apply(null, p.years.map(function (y) { return y.def; })) * 1.08 || 1;
    var n = p.years.length;
    var X = function (i) { return L + (W - L - Rm) * i / (n - 1); };
    var Y = function (v) { return T + (H - T - B) * (1 - v / max); };
    var g = '';
    for (var k = 0; k <= 4; k++) {
      var v = max * k / 4, y = Y(v);
      g += '<line x1="' + L + '" x2="' + (W - Rm) + '" y1="' + y + '" y2="' + y + '" class="gl"/>' + txt(L - 6, y + 4, keur(v), { anchor: 'end', size: 10.5 });
    }
    p.years.forEach(function (yr, i) { g += txt(X(i), H - 8, String(yr.year), { anchor: 'middle', size: 10.5 }); });
    function line(key, col, dash, wdt) {
      var d = p.years.map(function (yr, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(yr[key]).toFixed(1); }).join(' ');
      var dots = p.years.map(function (yr, i) {
        return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(yr[key]).toFixed(1) + '" r="3.2" style="fill:' + col + '"><title>' + yr.year + ': ' + eur(yr[key]) + '</title></circle>';
      }).join('');
      return '<path d="' + d + '" fill="none" style="stroke:' + col + '" stroke-width="' + (wdt || 2.6) + '"' + (dash ? ' stroke-dasharray="6 4"' : '') + '/>' + dots;
    }
    var area = 'M' + X(0) + ' ' + Y(p.years[0].def) + ' ' + p.years.map(function (yr, i) { return 'L' + X(i).toFixed(1) + ' ' + Y(yr.def).toFixed(1); }).join(' ') +
      ' L' + X(n - 1) + ' ' + Y(p.years[n - 1].act) + ' ' + p.years.slice().reverse().map(function (yr, i) { return 'L' + X(n - 1 - i).toFixed(1) + ' ' + Y(yr.act).toFixed(1); }).join(' ') + ' Z';
    g += '<path d="' + area + '" style="fill:var(--good)" opacity=".10"/>';
    g += line('def', 'var(--def)') + line('act', 'var(--act)');
    if (opts.after) g += line('after', 'var(--good)', true, 2.2);
    var lg = [['var(--def)', t('proj_def')], ['var(--act)', t('proj_act')]];
    if (opts.after) lg.push(['var(--good)', t('proj_after')]);
    var lx = L;
    lg.forEach(function (l) { g += '<rect x="' + lx + '" y="8" width="14" height="4" rx="2" style="fill:' + l[0] + '"/>' + txt(lx + 19, 13.5, l[1], { size: 11, fill: 'var(--text)' }); lx += 30 + l[1].length * 6.2; });
    return svg(W, H, g, t('proj_title'));
  }

  function projSummary(p, withAfter) {
    var s = '<div><span>' + esc(t('proj_cum')) + ' · ' + esc(t('proj_def')) + '</span><b class="d">' + meur(p.cumDef) + '</b></div>' +
      '<div><span>' + esc(t('proj_act')) + '</span><b class="a">' + meur(p.cumAct) + '</b></div>';
    if (withAfter) s += '<div><span>' + esc(t('proj_after')) + '</span><b class="g">' + meur(p.cumAfter) + '</b></div>';
    s += '<div><span>' + esc(t('proj_save')) + '</span><b class="g">' + meur(p.cumDef - (withAfter ? p.cumAfter : p.cumAct)) + '</b></div>';
    return s;
  }

  /* ---------------- yol haritası ---------------- */
  var measures = R.MEASURES.map(function (m) { var c = Object.assign({}, m); c.on = true; return c; });

  function ctx(r) {
    var c = r.inputs.country;
    return {
      gasF: D.fuels.gas.ncv * D.fuels.gas.ef, gridF: D.grid[c].value,
      gasPrice: Number($('rmGas').value) || 0, elecPrice: Number($('rmElec').value) || 0,
      solarYield: Number($('s_yield').value) || D.solarYield[c], rate: (Number($('rmRate').value) || 0) / 100, scope: r.scope
    };
  }

  function buildRoadmapTable() {
    var head = '<tr><th></th><th>' + t('col_measure') + '</th><th>' + t('col_param') + '</th><th class="n">' + t('col_capex') + '</th><th class="n">' + t('col_life') +
      '</th><th class="n">' + t('col_co2') + '</th><th class="n">' + t('col_energy') + '</th><th class="n">' + t('col_cbam') + '</th><th class="n">' + t('col_payback') + '</th><th class="n">' + t('col_macc') + '</th></tr>';
    var body = measures.map(function (m, i) {
      var param;
      if (m.type === 'gas' || m.type === 'elec') param = '<div class="inp sm"><input type="number" step="any" min="0" data-i="' + i + '" data-k="pct" value="' + Math.round(m.pct * 1000) / 10 + '"><span>' + esc(t('p_pct')) + '</span></div>';
      else if (m.type === 'precursor') param = '<div class="inp sm"><input type="number" step="any" min="0" data-i="' + i + '" data-k="newInt" value="' + m.newInt + '"><span>' + esc(t('p_newint')) + '</span></div>' +
        '<div class="inp sm" style="margin-top:4px"><input type="number" step="any" min="0" data-i="' + i + '" data-k="opexPerT" value="' + m.opexPerT + '"><span>' + esc(t('p_premium')) + '</span></div>';
      else param = '<div class="inp sm"><input type="number" step="any" min="0" data-i="' + i + '" data-k="kwp" value="' + m.kwp + '"><span>' + esc(t('p_kwp')) + '</span></div>';
      return '<tr id="rmr' + i + '"><td><input type="checkbox" data-i="' + i + '" data-k="on"' + (m.on ? ' checked' : '') + ' aria-label="' + esc(t('m_' + m.id)) + '"></td>' +
        '<td class="mname"><span class="num">' + (i + 1) + '</span>' + esc(t('m_' + m.id)) + '</td><td>' + param + '</td>' +
        '<td class="n"><input class="cin" type="number" step="any" min="0" data-i="' + i + '" data-k="capex" value="' + m.capex + '"></td>' +
        '<td class="n"><input class="cin s" type="number" step="1" min="1" data-i="' + i + '" data-k="life" value="' + m.life + '"></td>' +
        '<td class="n" id="rmc' + i + '"></td><td class="n" id="rme' + i + '"></td><td class="n" id="rmb' + i + '"></td><td class="n" id="rmp' + i + '"></td><td class="n" id="rmm' + i + '"></td></tr>';
    }).join('');
    $('rmTable').innerHTML = head + body;
  }

  $('rmTable').addEventListener('input', onMeasureInput);
  $('rmTable').addEventListener('change', onMeasureInput);
  function onMeasureInput(e) {
    var el = e.target, i = el.dataset ? el.dataset.i : undefined;
    if (i === undefined) return;
    var m = measures[Number(i)], k = el.dataset.k;
    if (k === 'on') m.on = el.checked;
    else {
      var v = Number(el.value);
      if (!isFinite(v) || v < 0) { el.classList.add('invalid'); return; }
      el.classList.remove('invalid');
      m[k] = k === 'pct' ? Math.min(v, 100) / 100 : (k === 'life' ? Math.max(1, Math.round(v)) : v);
    }
    renderRoadmap();
  }
  ['rmGas', 'rmElec', 'rmRate', 'rmGrowth'].forEach(function (id) { $(id).addEventListener('input', renderRoadmap); });

  function renderRoadmap() {
    var r = A.last();
    if (!r) return;
    if (!$('rmr0')) buildRoadmapTable();
    var c = ctx(r);
    var all = R.evaluate(r, measures, c);
    all.rows.forEach(function (x, i) {
      $('rmc' + i).textContent = fmt(x.co2Total, 0);
      $('rme' + i).textContent = fmt(x.energySave, 0);
      $('rmb' + i).textContent = fmt(x.cbamSave, 0);
      $('rmp' + i).textContent = x.payback === null ? '-' : fmt(x.payback, 1);
      var mc = $('rmm' + i);
      mc.textContent = x.maccCost === null ? '-' : fmt(x.maccCost, 0);
      mc.className = 'n ' + (x.maccCost === null ? '' : x.maccCost < 0 ? 'good' : x.maccCost < r.price ? 'mid' : 'bad');
      $('rmr' + i).classList.toggle('off', !measures[i].on);
    });
    var sel = R.evaluate(r, measures.filter(function (m) { return m.on; }), c);
    window.YP_V4.sel = sel.sum;
    $('rmSum').innerHTML = esc(t('rm_sum_text', {
      capex: eur(sel.sum.capex), net: eur(sel.sum.netAnnual), pb: sel.sum.payback === null ? '-' : fmt(sel.sum.payback, 1) + ' ' + t('years'),
      from: fmt(r.embedded, 3), to: fmt(sel.sum.embeddedAfter, 3), co2: fmt(sel.sum.co2Total, 0)
    }));
    $('maccChart').innerHTML = maccChart(R.macc(sel.rows.map(function (x) { return x; })), r.price);
    var p = R.projection(r, { schedule: $('projSched').value, priceGrowth: (Number($('rmGrowth').value) || 0) / 100, embeddedAfter: sel.sum.embeddedAfter });
    $('projChart2').innerHTML = projChart(p, { after: true, h: 260 });
    $('projSum2').innerHTML = projSummary(p, true);
    var p0 = R.projection(r, { schedule: $('projSched').value });
    $('projChart').innerHTML = projChart(p0, {});
    $('projSum').innerHTML = projSummary(p0, false);
    if (window.YP_V5) window.YP_V5.renderReady();
  }

  function maccChart(blocks, price) {
    var W = 640, H = 270, L = 58, Rm = 14, T = 22, B = 40;
    if (!blocks.length) return '<p class="note">-</p>';
    var total = blocks[blocks.length - 1].x1;
    var lo = Math.min(0, Math.min.apply(null, blocks.map(function (b) { return b.cost; }))) * 1.15;
    var hi = Math.max(price, Math.max.apply(null, blocks.map(function (b) { return b.cost; }))) * 1.15;
    var X = function (v) { return L + (W - L - Rm) * v / total; };
    var Y = function (v) { return T + (H - T - B) * (hi - v) / (hi - lo); };
    var g = '';
    [lo, lo / 2, 0, hi / 2, hi].forEach(function (v) { var y = Y(v); g += '<line x1="' + L + '" x2="' + (W - Rm) + '" y1="' + y + '" y2="' + y + '" class="' + (v === 0 ? 'gl0' : 'gl') + '"/>' + txt(L - 6, y + 4, fmt(v, 0), { anchor: 'end', size: 10.5 }); });
    blocks.forEach(function (b) {
      var x0 = X(b.x0), x1 = X(b.x1), y0 = Y(Math.max(0, b.cost)), y1 = Y(Math.min(0, b.cost));
      var col = b.cost < 0 ? 'var(--good)' : b.cost < price ? 'var(--warn)' : 'var(--def)';
      var idx = measures.findIndex(function (m) { return m.id === b.id; }) + 1;
      g += '<rect x="' + (x0 + 1).toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + Math.max(2, x1 - x0 - 2).toFixed(1) + '" height="' + Math.max(1, y1 - y0).toFixed(1) + '" style="fill:' + col + '" rx="2"><title>' + esc(t('m_' + b.id)) + ': ' + fmt(b.cost, 0) + ' €/tCO2e, ' + fmt(b.x1 - b.x0, 0) + ' tCO2e</title></rect>';
      g += txt((x0 + x1) / 2, b.cost < 0 ? y1 + 14 : y0 - 5, String(idx), { anchor: 'middle', size: 12, weight: 700, fill: 'var(--head)' });
    });
    var yp = Y(price);
    g += '<line x1="' + L + '" x2="' + (W - Rm) + '" y1="' + yp + '" y2="' + yp + '" style="stroke:var(--def)" stroke-dasharray="6 4" stroke-width="1.6"/>' + txt(W - Rm, yp - 5, t('macc_price') + ' €' + fmt(price, 2), { anchor: 'end', size: 11, fill: '#C8553D', weight: 600 });
    g += txt(L, H - 6, '0', { size: 10.5 }) + txt(W - Rm, H - 6, fmt(total, 0) + ' tCO2e/' + t('years').replace(/s$/, ''), { anchor: 'end', size: 10.5 });
    g += '<text x="12" y="' + (T + (H - T - B) / 2) + '" font-size="10.5" style="fill:var(--text3)" text-anchor="middle" transform="rotate(-90 12 ' + (T + (H - T - B) / 2) + ')">€/tCO2e</text>';
    return svg(W, H, g, t('macc_title'));
  }

  /* ---------------- ana sayfa ---------------- */
  function renderHome() {
    if (window.YP_V5 && window.YP_V5.renderHome) window.YP_V5.renderHome();
  }

  /* Orta Koridor haritası */
  function mapSvg() {
    var W = 560, H = 300, lon0 = 27, lon1 = 80, lat0 = 35.5, lat1 = 54;
    var X = function (lon) { return 20 + (W - 40) * (lon - lon0) / (lon1 - lon0); };
    var Y = function (lat) { return 14 + (H - 34) * (lat1 - lat) / (lat1 - lat0); };
    var P = {};
    O.CORRIDOR.forEach(function (c) { P[c.id] = [X(c.lon), Y(c.lat)]; });
    var caspian = [[47, 46.8], [49, 46.5], [51, 45.5], [52.6, 44.9], [51.3, 43.4], [52.7, 42], [53.1, 40], [53.9, 38], [53.3, 37.1], [50.5, 37], [49.1, 38.2], [49.6, 40.3], [48.5, 41.8], [47.4, 43.5], [46.6, 44.6]];
    var black = [[28, 41.3], [29.2, 41.2], [31.5, 41.1], [33.5, 42], [35.2, 42], [38.3, 40.9], [41.5, 41.5], [41.7, 42.6], [39.8, 43.6], [37.4, 44.7], [36.6, 45.3], [34.9, 44.6], [33.5, 44.5], [32.5, 45.4], [30.8, 46.5], [29.6, 45.4], [28.6, 44], [28, 43]];
    function poly(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ') + ' Z'; }
    function seg(a, b, dash) { return '<line x1="' + P[a][0] + '" y1="' + P[a][1] + '" x2="' + P[b][0] + '" y2="' + P[b][1] + '" stroke="#2A7F8E" stroke-width="' + (dash ? 2 : 3.2) + '"' + (dash ? ' stroke-dasharray="5 5"' : '') + ' stroke-linecap="round"/>'; }
    var g = '<rect x="0" y="0" width="' + W + '" height="' + H + '" rx="12" fill="#f3f8fa"/>';
    for (var lo = 30; lo <= 80; lo += 10) g += '<line x1="' + X(lo) + '" x2="' + X(lo) + '" y1="10" y2="' + (H - 18) + '" stroke="#e3ecf1"/>';
    for (var la = 40; la <= 50; la += 5) g += '<line x1="16" x2="' + (W - 16) + '" y1="' + Y(la) + '" y2="' + Y(la) + '" stroke="#e3ecf1"/>';
    g += '<path d="' + poly(caspian) + '" fill="#cfe6ef"/><path d="' + poly(black) + '" fill="#cfe6ef"/>';
    var SEA = { tr: ['Hazar Denizi', 'Karadeniz', 'Orta Koridor'], az: ['Xəzər dənizi', 'Qara dəniz', 'Orta Dəhliz'], kk: ['Каспий теңізі', 'Қара теңіз', 'Орта дәліз'], en: ['Caspian Sea', 'Black Sea', 'Middle Corridor'] }[A.lang()] || ['Caspian Sea', 'Black Sea', 'Middle Corridor'];
    g += txt(X(50.9), Y(39.2), SEA[0], { anchor: 'middle', size: 9.5, fill: '#5d8fa3' }) + txt(X(34.5), Y(43.2), SEA[1], { anchor: 'middle', size: 9.5, fill: '#5d8fa3' });
    g += seg('ankara', 'baku') + seg('baku', 'aktau') + seg('aktau', 'almaty') + seg('aktau', 'tashkent', true) + seg('tashkent', 'bishkek', true) + seg('bishkek', 'almaty', true) + seg('almaty', 'astana', true);
    var lang = A.lang();
    O.CORRIDOR.forEach(function (c) {
      var p = P[c.id];
      var pos = { ankara: [0, -13, 'middle'], baku: [0, 22, 'middle'], aktau: [11, 4, 'start'], tashkent: [0, 22, 'middle'], bishkek: [-4, 22, 'end'], almaty: [6, -12, 'start'], astana: [0, -13, 'middle'] }[c.id] || [0, -12, 'middle'];
      g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" fill="#fff" stroke="#1F3A5F" stroke-width="2.5"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="#3DBE8B"/>';
      g += txt(p[0] + pos[0], p[1] + pos[1], c.name[lang] || c.name.en, { anchor: pos[2], size: 12, weight: 700, fill: '#1F3A5F' });
    });
    g += '<line x1="' + (W - 170) + '" x2="' + (W - 140) + '" y1="' + (H - 8) + '" y2="' + (H - 8) + '" stroke="#2A7F8E" stroke-width="3.2"/>' + txt(W - 134, H - 4, SEA[2], { size: 10.5, fill: '#2A7F8E', weight: 600 });
    return svg(W, H, g, t('map_title'));
  }

  /* ---------------- OSB paneli ---------------- */
  function renderOSB() {
    var year = Number($('osbYear').value) || 2026;
    var o = O.aggregate(O.FIRMS, D, E, year);
    var k = [
      [t('o_firms'), fmt(o.n, 0), ''], [t('o_export'), fmt(o.tot.export_t, 0) + ' t', ''],
      [t('o_now'), eur(o.tot.costNow), 'd'], [t('o_pot'), eur(o.potential), 'g']
    ];
    $('osbKpis').innerHTML = k.map(function (x) { return '<div class="kpi' + (x[2] === 'g' ? ' good' : '') + '"><div class="l">' + esc(x[0]) + '</div><div class="v' + (x[2] === 'd' ? ' dcol' : '') + '">' + x[1] + '</div></div>'; }).join('');
    var cols = { actual: 'var(--good)', partial: 'var(--warn)', none: 'var(--def)' };
    var W = 560, x = 0, bar = '';
    ['actual', 'partial', 'none'].forEach(function (s) {
      var w = W * o.counts[s] / o.n;
      if (w > 0) bar += '<rect x="' + x + '" y="0" width="' + w + '" height="34" style="fill:' + cols[s] + '"/>' + txt(x + w / 2, 22, String(o.counts[s]), { anchor: 'middle', size: 14, weight: 700, fill: '#fff' });
      x += w;
    });
    $('osbReady').innerHTML = svg(W, 34, bar, t('o_ready')) + '<div class="legend">' + ['actual', 'partial', 'none'].map(function (s) {
      return '<span><i style="background:' + cols[s] + '"></i>' + esc(t('st_' + s)) + ' (' + o.counts[s] + ')</span>';
    }).join('') + '</div>';
    var top = o.rows.slice(0, 3), sum = top.reduce(function (s, r) { return s + r.potential; }, 0);
    $('osbAction').innerHTML = '<p class="actiontxt">' + esc(t('o_action_text', { n: top.length, sum: eur(sum) })) + '</p><div class="chips">' +
      top.map(function (r) { return '<span class="chip"><b>' + esc(t('o_firm')) + ' ' + r.id + '</b> ' + eur(r.potential) + '</span>'; }).join('') + '</div>';
    var maxPot = Math.max.apply(null, o.rows.map(function (r) { return r.potential; })) || 1;
    $('osbTable').innerHTML = '<tr><th>' + t('o_firm') + '</th><th>CN</th><th class="n">' + t('o_export') + ' (t)</th><th>' + t('o_status') + '</th><th class="n">' + t('o_cost') + '</th><th>' + t('o_potc') + '</th></tr>' +
      o.rows.map(function (r) {
        return '<tr><td><b>' + esc(t('o_firm')) + ' ' + r.id + '</b></td><td>' + r.cn + '</td><td class="n">' + fmt(r.export_t, 0) + '</td><td><span class="st ' + r.status + '">' + esc(t('st_' + r.status)) + '</span></td><td class="n">' + fmt(r.costNow, 0) +
          '</td><td><div class="pbar"><i style="width:' + (r.potential / maxPot * 100).toFixed(1) + '%"></i><span>' + fmt(r.potential, 0) + '</span></div></td></tr>';
      }).join('');
    if (window.YP_V5 && window.YP_V5.mapInto) window.YP_V5.mapInto('mapOsb'); else $('mapOsb').innerHTML = mapSvg();
  }
  $('osbYear').addEventListener('change', renderOSB);

  /* ---------------- yöntem ---------------- */
  function renderMethod() {
    var yrs = Object.keys(R.SCHEDULES.law);
    $('schedTable').innerHTML = '<tr><th></th>' + yrs.map(function (y) { return '<th class="n">' + y + '</th>'; }).join('') + '</tr>' +
      '<tr><td>' + esc(t('law_col')) + '</td>' + yrs.map(function (y) { return '<td class="n">' + pctTxt(R.SCHEDULES.law[y], 1) + '</td>'; }).join('') + '</tr>' +
      '<tr><td>' + esc(t('prop_col')) + '</td>' + yrs.map(function (y) { return '<td class="n">' + pctTxt(R.SCHEDULES.proposal[y], 1) + '</td>'; }).join('') + '</tr>';
  }

  /* ---------------- dil ve seçim kutuları ---------------- */
  function fillV4Selects() {
    var sv = $('projSched').value || 'law';
    $('projSched').innerHTML = '<option value="law">' + esc(t('sched_law')) + '</option><option value="proposal">' + esc(t('sched_prop')) + '</option>';
    $('projSched').value = sv;
    var oy = $('osbYear').value || '2026';
    $('osbYear').innerHTML = Object.keys(D.cbam.years).map(function (y) { return '<option value="' + y + '">' + y + '</option>'; }).join('');
    $('osbYear').value = oy;
    document.querySelectorAll('.mainnav a, #view-home [data-i18n], #view-osb [data-i18n], #view-method [data-i18n], #tab-roadmap [data-i18n]').forEach(function (el) {
      if (el.getAttribute('data-i18n')) el.textContent = t(el.getAttribute('data-i18n'));
    });
    var g = document.querySelector('#rmGrowth + span'); if (g) g.textContent = '%/' + t('years').replace(/s$/, '');
  }
  $('projSched').addEventListener('change', renderRoadmap);
  $('clear').addEventListener('click', function () {
    ['projChart', 'projSum', 'projChart2', 'projSum2', 'maccChart', 'rmSum', 'xTable'].forEach(function (id) { $(id).innerHTML = ''; });
    ['rmc', 'rme', 'rmb', 'rmp', 'rmm'].forEach(function (k) { for (var i = 0; i < measures.length; i++) { var el = $(k + i); if (el) el.textContent = '-'; } });
  });

  var prevRender = window.YP_onRender, prevLang = window.YP_onLang;
  window.YP_onRender = function (r) { if (prevRender) prevRender(r); renderRoadmap(); };
  window.YP_onLang = function () {
    if (prevLang) prevLang();
    fillV4Selects();
    buildRoadmapTable();
    var v = (location.hash || '#home').slice(1);
    if ((VIEWS[v] || 'home') === 'home') renderHome();
    if (VIEWS[v] === 'osb') renderOSB();
    if (VIEWS[v] === 'method') renderMethod();
  };

  fillV4Selects();
  buildRoadmapTable();
  A.calc();
  route();
})();
