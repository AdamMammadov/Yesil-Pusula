/* Yeşil Pusula v5 - tema, ana sayfa hızlı hesap, gerçek coğrafyalı Orta Koridor haritası, SSS, hazırlık skoru, animasyonlar */
(function () {
  'use strict';
  var A = window.YP_APP, D = window.YP_DATA, R = window.YP_ROADMAP, M = window.YP_MAP;
  var $ = function (id) { return document.getElementById(id); };
  var t = A.t, fmt = A.fmt, esc = A.esc;
  function eur(v) { return '€' + fmt(Math.round(v), 0); }

  /* ---------------- tema ---------------- */
  function setTheme(th) {
    document.documentElement.setAttribute('data-theme', th);
    try { localStorage.setItem('yp_theme', th); } catch (e) { /* yok */ }
  }
  $('themeBtn').addEventListener('click', function () {
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });

  /* ---------------- sayı animasyonu ---------------- */
  var tweens = {};
  function tween(id, to, fmtFn) {
    var el = $(id); if (!el) return;
    var from = tweens[id] !== undefined ? tweens[id] : to * 0.6;
    tweens[id] = to;
    var t0 = performance.now(), dur = 450;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmtFn(to); return; }
    function step(now) {
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmtFn(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------------- hızlı hesap (ana sayfa) ---------------- */
  var hc = { prod: '7208', year: 2026 };
  var INT_DEF = { '7208': 0.28, '7207': 1.95 };
  function heroCalc() {
    var p = D.products[hc.prod];
    var exp = Number($('hcExp').value), intv = Number($('hcInt').value);
    var f = R.SCHEDULES.law[hc.year], mk = R.markupFor(hc.year, 'steel'), price = D.cbam.price.value;
    var benchA = hc.prod === '7208' ? p.bench['Scrap-EAF'] : p.bench['BF-BOF'];
    var defC = Math.max(0, p.defaults.TR * (1 + mk) - p.benchDefault * f) * price * exp;
    var actC = Math.max(0, intv - benchA * f) * price * exp;
    $('hcExpV').textContent = fmt(exp, 0) + ' t';
    $('hcIntV').textContent = fmt(intv, 2) + ' tCO2e/t';
    tween('hcDef', defC, eur); tween('hcAct', actC, eur); tween('hcSave', defC - actC, eur);
    var mx = Math.max(defC, actC, 1);
    $('hcDefBar').style.width = (defC / mx * 100).toFixed(1) + '%';
    $('hcActBar').style.width = (actC / mx * 100).toFixed(1) + '%';
  }
  function seg(id, key, after) {
    $(id).addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $(id).querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      hc[key] = key === 'year' ? Number(b.dataset.v) : b.dataset.v;
      if (after) after();
      heroCalc();
    });
  }
  seg('hcProd', 'prod', function () { $('hcInt').value = INT_DEF[hc.prod]; });
  seg('hcYear', 'year');
  $('hcExp').addEventListener('input', heroCalc);
  $('hcInt').addEventListener('input', heroCalc);
  $('heroTour').addEventListener('click', function () { if (window.YP_TOUR) window.YP_TOUR.open(); });

  /* özellik kartları ilgili sekmeyi açar */
  document.querySelectorAll('.feat[data-tab]').forEach(function (a) {
    a.addEventListener('click', function () {
      var tab = a.getAttribute('data-tab');
      if (tab) setTimeout(function () { A.showTab(tab); }, 80);
    });
  });

  /* ---------------- görünür olunca belirme ---------------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 }) : null;
  function observe() {
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); });
  }

  /* ---------------- harita ---------------- */
  var CITY = {
    istanbul: { tr: 'İstanbul', az: 'İstanbul', kk: 'Ыстамбұл', en: 'Istanbul', minor: true },
    ankara: { tr: 'Ankara', az: 'Ankara', kk: 'Анкара', en: 'Ankara', pilot: true, dx: -8, dy: 20, a: 'end' },
    tbilisi: { tr: 'Tiflis', az: 'Tbilisi', kk: 'Тбилиси', en: 'Tbilisi', minor: true, dx: -6, dy: 16, a: 'end' },
    baku: { tr: 'Bakü', az: 'Bakı', kk: 'Баку', en: 'Baku', dy: 22 },
    aktau: { tr: 'Aktav', az: 'Aktau', kk: 'Ақтау', en: 'Aktau', dx: 12, dy: 4, a: 'start' },
    tashkent: { tr: 'Taşkent', az: 'Daşkənd', kk: 'Ташкент', en: 'Tashkent', dy: 22 },
    bishkek: { tr: 'Bişkek', az: 'Bişkek', kk: 'Бішкек', en: 'Bishkek', dx: -6, dy: 22, a: 'end' },
    almaty: { tr: 'Almatı', az: 'Almatı', kk: 'Алматы', en: 'Almaty', dx: 4, dy: -12 },
    astana: { tr: 'Astana', az: 'Astana', kk: 'Астана', en: 'Astana', dy: -13 },
    khorgos: { tr: 'Horgos', az: 'Xorqos', kk: 'Қорғас', en: 'Khorgos', minor: true, dx: 10, dy: 4, a: 'start' }
  };
  var PHASE = { TR: 'ph1', AZ: 'ph2', KZ: 'ph2', UZ: 'ph3', KG: 'ph3' };
  function smooth(pts) {
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ' C' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + ' ' + p2[0] + ' ' + p2[1];
    }
    return d;
  }
  function mapSvg() {
    var lang = A.lang(), C = M.cities, g = '';
    g += '<rect width="' + M.W + '" height="' + M.H + '" style="fill:var(--sea)"/>';
    M.countries.forEach(function (c) {
      g += '<path class="cty' + (c.k === 'm' ? ' m' : c.k === 'o' ? ' o' : '') + '"' + (c.c ? ' data-c="' + c.c + '"' : '') + ' d="' + c.d + '"/>';
    });
    g += '<text class="sea" x="' + M.seas.caspian[0] + '" y="' + M.seas.caspian[1] + '" text-anchor="middle">' + esc(t('sea_caspian')) + '</text>';
    g += '<text class="sea" x="' + M.seas.black[0] + '" y="' + M.seas.black[1] + '" text-anchor="middle">' + esc(t('sea_black')) + '</text>';
    /* ülke adları ve şebeke faktörü */
    Object.keys(M.labels).forEach(function (c) {
      var p = M.labels[c];
      g += '<text class="clbl" x="' + p[0] + '" y="' + p[1] + '" text-anchor="middle">' + esc(t('c_' + c).toLocaleUpperCase({ tr: 'tr', az: 'az', kk: 'kk', en: 'en' }[lang])) + '</text>';
      if (D.grid[c]) g += '<text class="clbl2" x="' + p[0] + '" y="' + (p[1] + 15) + '" text-anchor="middle">' + fmt(D.grid[c].value, 3) + ' tCO2e/MWh</text>';
    });
    /* güzergah */
    var land1 = [C.istanbul, C.ankara, C.kars, C.tbilisi, C.baku];
    var land2 = [C.aktau, C.beyneu, C.kyzylorda, C.shymkent, C.almaty, C.khorgos];
    g += '<path class="route-bg" d="' + smooth(land1) + '"/><path class="route-bg" d="' + smooth(land2) + '"/>';
    g += '<path class="branch" d="M' + C.shymkent + ' L' + C.tashkent + '"/><path class="branch" d="M' + C.almaty + ' L' + C.bishkek + '"/><path class="branch" d="' + smooth([C.almaty, [C.almaty[0] - 30, C.almaty[1] - 80], C.astana]) + '"/>';
    g += '<path class="route" d="' + smooth(land1) + '"/><path class="route" d="' + smooth(land2) + '"/>';
    g += '<path class="route-sea" d="' + smooth([C.baku, [(C.baku[0] + C.aktau[0]) / 2 + 14, (C.baku[1] + C.aktau[1]) / 2], C.aktau]) + '"/>';
    /* şehirler */
    Object.keys(CITY).forEach(function (k) {
      var c = CITY[k], p = C[k]; if (!p) return;
      var cls = 'city' + (c.minor ? ' minor' : '');
      g += '<g class="' + cls + '">';
      if (!c.minor) g += '<circle class="ring" cx="' + p[0] + '" cy="' + p[1] + '" r="8"' + (c.pilot ? '' : ' style="animation-delay:' + (Object.keys(CITY).indexOf(k) * 0.3).toFixed(1) + 's"') + '/>';
      g += '<circle class="c" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (c.minor ? 4 : 6.5) + '"/>';
      if (!c.minor) g += '<circle class="p" cx="' + p[0] + '" cy="' + p[1] + '" r="2.6"/>';
      g += '<text x="' + (p[0] + (c.dx || 0)) + '" y="' + (p[1] + (c.dy || -12)) + '" text-anchor="' + (c.a || 'middle') + '">' + esc(c[lang] || c.en) + '</text></g>';
    });
    return '<svg viewBox="0 0 ' + M.W + ' ' + M.H + '" role="img" aria-label="' + esc(t('map_title')) + '">' + g + '</svg><div class="maptip"></div>';
  }
  function mapInto(id) {
    var box = $(id); if (!box) return;
    box.innerHTML = mapSvg();
    var tip = box.querySelector('.maptip');
    box.querySelectorAll('.cty.m').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var c = el.getAttribute('data-c'), g = D.grid[c], rb = box.getBoundingClientRect();
        tip.innerHTML = '<b>' + esc(t('c_' + c)) + '</b>' + esc(t(PHASE[c])) + (g ? '<br>' + esc(t('mt_grid')) + ': ' + fmt(g.value, 3) + ' tCO2e/MWh (' + (g.src === 'tr_etkb' ? 'ETKB ' : 'Ember ') + g.year + ')' : '');
        tip.style.left = Math.min(rb.width - 250, e.clientX - rb.left + 14) + 'px';
        tip.style.top = (e.clientY - rb.top + 14) + 'px';
        tip.style.opacity = 1;
        box.querySelectorAll('.cty.m[data-c="' + c + '"]').forEach(function (x) { x.classList.add('hov'); });
      });
      el.addEventListener('mouseleave', function () { tip.style.opacity = 0; box.querySelectorAll('.cty.hov').forEach(function (x) { x.classList.remove('hov'); }); });
    });
  }
  function legend() {
    var el = $('mapLegend'); if (!el) return;
    el.innerHTML = '<span><i class="m"></i>' + esc(t('lg_member')) + '</span><span><i class="o"></i>' + esc(t('lg_obs')) + '</span><span><i class="r"></i>' + esc(t('lg_route')) + '</span><span><i class="s"></i>' + esc(t('lg_sea')) + '</span>';
  }

  /* ---------------- hazırlık skoru ---------------- */
  var QW = { meter: 1, invoice: 0.8, supplier: 0.6, estimate: 0.3 };
  function readiness(r) {
    var inp = r.inputs;
    var mon = window.YP_V3 && window.YP_V3.monthly ? window.YP_V3.monthly() : null;
    var filled = mon ? mon.filled : 0, anoms = mon ? mon.anomalies.length : 0;
    var comps = r.components.filter(function (c) { return c.kind !== 'precursor' && c.t > 0; });
    var tot = comps.reduce(function (s, c) { return s + c.t; }, 0);
    var qmap = { gas: inp.q_gas, diesel: inp.q_diesel, lpg: inp.q_lpg, coal: inp.q_coal, electricity: inp.q_elec };
    var q = tot > 0 ? comps.reduce(function (s, c) { return s + c.t * (QW[qmap[c.key]] || 0.3); }, 0) / tot : 0;
    var preNeeded = Number(inp.precursor_t) > 0;
    var preOk = !preNeeded || (Number(inp.precursor_int) > 0 && inp.q_pre !== 'estimate');
    var sel = window.YP_V4 && window.YP_V4.sel;
    var plan = !!(sel && sel.co2Total > 0);
    var items = [
      { k: 'months', pts: 20 * filled / 12, max: 20, ok: filled === 12, v: filled + '/12' },
      { k: 'pre', pts: preOk ? 20 : (preNeeded && Number(inp.precursor_int) > 0 ? 6 : 0), max: 20, ok: preOk, v: preOk ? '✓' : '-' },
      { k: 'quality', pts: 20 * q, max: 20, ok: q >= 0.8, v: Math.round(q * 100) + '%' },
      { k: 'anom', pts: Math.max(0, 15 - 5 * anoms), max: 15, ok: anoms === 0, v: anoms ? String(anoms) : '✓' },
      { k: 'plan', pts: plan ? 15 : 0, max: 15, ok: plan, v: plan ? '✓' : '-' },
      { k: 'verif', pts: 0, max: 10, ok: false, v: '-' }
    ];
    var score = Math.round(items.reduce(function (s, i) { return s + i.pts; }, 0));
    var next = items.filter(function (i) { return !i.ok; })[0];
    return { score: score, items: items, next: next };
  }
  function gauge(score) {
    var lvl = score >= 90 ? 'high' : score >= 50 ? 'mid' : 'low';
    var col = lvl === 'high' ? 'var(--good)' : lvl === 'mid' ? 'var(--warn)' : 'var(--def)';
    var r = 80, cx = 100, cy = 98, a = Math.PI * score / 100;
    var x = cx - r * Math.cos(a), y = cy - r * Math.sin(a);
    var arcBg = 'M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy;
    var arc = 'M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 0 1 ' + x.toFixed(1) + ' ' + y.toFixed(1);
    return '<svg viewBox="0 0 200 124" role="img" aria-label="' + score + '/100"><path d="' + arcBg + '" fill="none" style="stroke:var(--track)" stroke-width="16" stroke-linecap="round"/>' +
      '<path d="' + arc + '" fill="none" style="stroke:' + col + '" stroke-width="16" stroke-linecap="round"/>' +
      '<text class="gv" x="100" y="92" text-anchor="middle">' + score + '</text><text class="gl2" x="100" y="116" text-anchor="middle" style="fill:' + col + '">' + esc(t('rd_' + lvl)) + '</text></svg>';
  }
  var ICOK = '<svg class="ic ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>', ICNO = '<svg class="ic no" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v5M12 16h.01"/></svg>';
  function renderReady() {
    var r = A.last(), el = $('readyCard'); if (!el) return;
    if (!r) { el.innerHTML = ''; el.style.display = 'none'; return; }
    el.style.display = '';
    var rd = readiness(r);
    el.innerHTML = '<div class="gauge">' + gauge(rd.score) + '</div><div><h2>' + esc(t('rd_title')) + '</h2><ul class="rlist">' +
      rd.items.map(function (i) { return '<li>' + (i.ok ? ICOK : ICNO) + '<span>' + esc(t('rd_' + i.k)) + '</span><b>' + i.v + '</b></li>'; }).join('') + '</ul>' +
      (rd.next ? '<p class="rnext"><b>' + esc(t('rd_next')) + '</b> ' + esc(t('ra_' + rd.next.k)) + '</p>' : '') + '</div>';
  }

  /* ---------------- ana sayfa ---------------- */
  function renderHome() {
    heroCalc();
    mapInto('mapHome');
    legend();
    observe();
  }

  window.YP_V5 = { renderHome: renderHome, mapInto: mapInto, renderReady: renderReady, readiness: readiness };
  var prevRender = window.YP_onRender, prevLang = window.YP_onLang;
  window.YP_onRender = function (r) { if (prevRender) prevRender(r); renderReady(); };
  window.YP_onLang = function () {
    if (prevLang) prevLang();
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    tweens = {};
    renderHome(); renderReady();
    var v = (location.hash || '#home').slice(1);
    if (v === 'osb') mapInto('mapOsb');
  };
  $('themeBtn').setAttribute('aria-label', t('th_toggle'));
  document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
  renderHome();
  renderReady();
  if ((location.hash || '#home').slice(1) === 'osb') mapInto('mapOsb');
  setTimeout(observe, 50);
})();
