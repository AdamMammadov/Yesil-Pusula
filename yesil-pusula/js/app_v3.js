/* Yeşil Pusula v3 - aylık veri, tedarikçi talebi, AB veri dosyası, proje kaydetme */
(function () {
  'use strict';
  var A = window.YP_APP, D = window.YP_DATA, TL = window.YP_TOOLS, EU = window.YP_EU_LABELS, SHA = window.YP_SHA256;
  var $ = function (id) { return document.getElementById(id); };
  var t = A.t, fmt = A.fmt, esc = A.esc;

  var MONTHS = {
    tr: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
    az: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'],
    kk: ['Қаң', 'Ақп', 'Нау', 'Сәу', 'Мам', 'Мау', 'Шіл', 'Там', 'Қыр', 'Қаз', 'Қар', 'Жел'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  };
  var COL_LABEL = {
    production_t: ['m_prod', 't'], electricity_mwh: ['elec', 'MWh'], gas_m3: ['gas', 'm³'], diesel_l: ['diesel', 'L'],
    lpg_l: ['lpg', 'L'], coal_t: ['coal', 't'], precursor_t: ['n_precursor', 't']
  };
  /* Örnek tesisin aylık faturaları (yıllık toplamlar örnek veriyle aynı) */
  var DEMO_MONTHS = (function () {
    var p = [380, 400, 430, 420, 440, 410, 390, 350, 430, 450, 460, 440];
    var g = [15500, 15800, 15600, 14200, 14000, 12800, 12100, 10900, 13800, 15400, 16800, 18100];
    var d = [650, 650, 700, 680, 700, 660, 640, 560, 690, 700, 690, 680];
    return p.map(function (x, i) {
      return { production_t: x, electricity_mwh: Math.round(x * 0.12 * 10) / 10, gas_m3: g[i], diesel_l: d[i], lpg_l: 0, coal_t: 0, precursor_t: Math.round(x * 1.03 * 10) / 10 };
    });
  })();
  var rows = DEMO_MONTHS.map(function (r) { return Object.assign({}, r); });

  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }
  function download(name, content, type) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function factors() {
    var f = D.fuels;
    return { gas: f.gas.ncv * f.gas.ef, diesel: f.diesel.ncv * f.diesel.ef, lpg: f.lpg.ncv * f.lpg.ef, coal: f.coal.ncv * f.coal.ef, preInt: Number($('precursor_int').value) || 0 };
  }

  /* ---------- Aylık veri ---------- */
  function renderMonthTable() {
    var mn = MONTHS[A.lang()] || MONTHS.tr;
    var head = '<tr><th>' + t('m_month') + '</th>' + TL.COLS.map(function (c) {
      return '<th class="n">' + esc(t(COL_LABEL[c][0])) + ' <span style="font-weight:400">(' + COL_LABEL[c][1] + ')</span></th>';
    }).join('') + '<th class="n">' + t('m_int') + '</th></tr>';
    var body = rows.map(function (r, i) {
      return '<tr data-m="' + i + '"><td>' + mn[i] + '</td>' + TL.COLS.map(function (c) {
        return '<td><input type="text" inputmode="decimal" data-m="' + i + '" data-c="' + c + '" value="' + esc(r[c]) + '" aria-label="' + esc(mn[i] + ' ' + t(COL_LABEL[c][0])) + '"></td>';
      }).join('') + '<td class="int" id="mi' + i + '">-</td></tr>';
    }).join('');
    $('mTable').innerHTML = head + body + '<tr class="tot" id="mTot"></tr>';
    updateMonthly();
  }

  function updateMonthly() {
    var ag = TL.aggregate(rows, factors());
    var mn = MONTHS[A.lang()] || MONTHS.tr;
    ag.months.forEach(function (m, i) { var el = $('mi' + i); if (el) el.textContent = m.intensity === null ? '-' : fmt(m.intensity, 3); });
    document.querySelectorAll('#mTable td.flag').forEach(function (td) { td.classList.remove('flag'); });
    ag.anomalies.forEach(function (a) { var el = $('mi' + (a.month - 1)); if (el) el.classList.add('flag'); });
    $('mTot').innerHTML = '<td>' + t('m_total') + '</td>' + TL.COLS.map(function (c) { return '<td>' + fmt(ag.totals[c], c === 'electricity_mwh' || c === 'precursor_t' ? 1 : 0) + '</td>'; }).join('') +
      '<td>' + (ag.totals.production_t > 0 ? fmt((ag.totals.gas_m3 * factors().gas + ag.totals.diesel_l * factors().diesel + ag.totals.lpg_l * factors().lpg + ag.totals.coal_t * factors().coal + ag.totals.precursor_t * factors().preInt) / ag.totals.production_t, 3) : '-') + '</td>';
    $('mFilled').textContent = t('m_filled', { n: ag.filled });
    var msgs = ag.errors.map(function (e) { return '<div class="msg err">' + esc(t('m_err_cell', { m: e.month })) + '</div>'; });
    msgs = msgs.concat(ag.anomalies.map(function (a) {
      return '<div class="msg warn">' + esc(t('a_' + a.code, { m: mn[a.month - 1], d: a.dev !== undefined ? fmt(Math.abs(a.dev), 0) : '' })) + '</div>';
    }));
    if (!msgs.length && ag.filled) msgs.push('<div class="msg ok">' + esc(t('m_ok')) + '</div>');
    $('mMsgs').innerHTML = msgs.join('');
    if (window.YP_V5) window.YP_V5.renderReady();
    return ag;
  }

  $('mTable').addEventListener('input', function (e) {
    var el = e.target;
    if (!el.dataset || el.dataset.m === undefined) return;
    rows[Number(el.dataset.m)][el.dataset.c] = el.value;
    var v = TL.toNum(el.value);
    el.classList.toggle('invalid', isNaN(v) || v < 0);
    updateMonthly();
  });
  $('mApply').addEventListener('click', function () {
    var ag = updateMonthly();
    if (ag.errors.length) return;
    var map = { production_t: 3, electricity_mwh: 1, gas_m3: 0, diesel_l: 0, lpg_l: 0, coal_t: 2, precursor_t: 1 };
    Object.keys(map).forEach(function (k) { $(k).value = Math.round(ag.totals[k] * Math.pow(10, map[k])) / Math.pow(10, map[k]); });
    if (Number($('export_t').value) > ag.totals.production_t) $('export_t').value = Math.floor(ag.totals.production_t);
    A.calc();
    A.showTab('res');
    toast(t('m_applied'));
  });
  $('mTpl').addEventListener('click', function () { download('yesil_pusula_aylik_veri.csv', TL.csvTemplate(rows), 'text/csv;charset=utf-8'); });
  $('mFile').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    var isX = /\.xlsx?$/i.test(file.name);
    reader.onload = function () {
      var text;
      try {
        if (isX) {
          var wb = window.XLSX.read(new Uint8Array(reader.result), { type: 'array' });
          text = window.XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], { FS: ';' });
        } else text = reader.result;
        var res = TL.parseCSV(text);
        if (!res.ok) { toast(t('m_err_file')); return; }
        rows = res.rows;
        renderMonthTable();
      } catch (err) { toast(t('m_err_file')); }
      e.target.value = '';
    };
    if (isX) reader.readAsArrayBuffer(file); else reader.readAsText(file, 'utf-8');
  });

  /* ---------- Tedarikçi talebi ---------- */
  var PRE_DESC = {
    '7207': ['yarı mamul çelik (kütük / slab)', 'semi-finished steel (billet / slab)'],
    '7206': ['ham çelik (külçe)', 'crude steel (ingots)'],
    '7201': ['pik demir', 'pig iron'],
    '7213': ['çelik tel çubuk (filmaşin)', 'steel wire rod'],
    '7601': ['ham alüminyum', 'unwrought aluminium']
  };
  function productDesc(code, lang) {
    var T = window.YP_I18N[lang] || window.YP_I18N.tr;
    return (T['p_' + code] || '').replace(/^\d+\s*-\s*/, '').toLowerCase();
  }
  function renderLetter() {
    var r = A.last();
    var preCn = ($('sPreCn').value || '').trim() || '7207';
    var pd = PRE_DESC[preCn] || ['öncül malzeme', 'precursor material'];
    var prodCode = $('product').value;
    var qty = Number($('precursor_t').value) || 0;
    var letter = TL.supplierLetter({
      supplier: $('sSupplier').value.trim(), company: $('company').value.trim(), contact: $('sContact').value.trim(),
      period: $('year').value, qty: new Intl.NumberFormat($('sLang').value === 'en' ? 'en-GB' : 'tr-TR').format(qty),
      preCn: preCn, preDesc: pd[0], preDescEn: pd[1],
      productCn: prodCode === 'custom' ? '...' : prodCode, productDesc: productDesc(prodCode, 'tr'), productDescEn: productDesc(prodCode, 'en')
    }, $('sLang').value);
    $('sLetter').value = letter;
    return r;
  }
  ['sSupplier', 'sPreCn', 'sContact', 'sLang'].forEach(function (id) { $(id).addEventListener('input', renderLetter); $(id).addEventListener('change', renderLetter); });
  $('sCopy').addEventListener('click', function () {
    var txt = $('sLetter').value;
    function done() { toast(t('s_copied')); }
    try {
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, function () { $('sLetter').select(); document.execCommand('copy'); done(); });
      else { $('sLetter').select(); document.execCommand('copy'); done(); }
    } catch (e) { $('sLetter').select(); }
  });
  $('sDl').addEventListener('click', function () { download('tedarikci_veri_talebi.txt', $('sLetter').value); });

  /* ---------- AB veri dosyası ---------- */
  function euMeta(r) {
    var c = r.inputs.country, g = D.grid[c];
    var route = $('route').value;
    var T = window.YP_I18N;
    return {
      company: r.inputs.company, countryName: T.tr['c_' + c] + ' / ' + T.en['c_' + c], address: $('xAddress').value.trim(), contact: $('xContact').value.trim(),
      periodStart: r.inputs.year + '-01-01', periodEnd: r.inputs.year + '-12-31',
      productDesc: productDesc(r.inputs.product, 'tr') + ' / ' + productDesc(r.inputs.product, 'en'),
      routeName: route === 'none' ? 'manuel / manual' : (T.tr['r_' + route.replace(/-/g, '_')] + ' / ' + T.en['r_' + route.replace(/-/g, '_')]),
      gridFactor: g.value, gridSource: (g.src === 'tr_etkb' ? 'ETKB ' : 'Ember ') + g.year,
      preCn: ($('sPreCn').value || '').trim(), preSource: (T.tr['q_' + r.inputs.q_pre] || '') + ' / ' + (T.en['q_' + r.inputs.q_pre] || ''),
      version: D.version, hash: SHA(JSON.stringify(Object.keys(r.inputs).sort().reduce(function (o, k) { o[k] = r.inputs[k]; return o; }, {})) + '|' + D.version)
    };
  }
  function euValue(k, v) {
    if (k === 'method') return EU.v_calculation;
    if (k === 'default_used') return EU.v_no;
    if (k === 'carbon_price_paid') return EU.v_none;
    if (k === 'verification') return EU.v_not_verified;
    if (k === 'cbam_scope') return v === 'total' ? EU.v_total : EU.v_direct;
    if (k === 'uncertainty95') return fmt(v[0], 4) + ' - ' + fmt(v[1], 4);
    if (k === 'elec_factor') return v.replace(/^([\d.]+)/, function (m) { return fmt(Number(m), 3); });
    return v;
  }
  function euRows() {
    var r = A.last();
    if (!r) return [];
    return TL.euSummary(r, euMeta(r)).map(function (row) {
      return row[0] === 'section' ? { sec: true, label: EU['sec_' + row[1]] } : { label: EU[row[0]] || row[0], value: euValue(row[0], row[1]) };
    });
  }
  function renderEU() {
    var list = euRows();
    $('xTable').innerHTML = list.map(function (x) {
      return x.sec ? '<tr class="sec"><td colspan="2">' + esc(x.label) + '</td></tr>' : '<tr><td>' + esc(x.label) + '</td><td>' + esc(typeof x.value === 'number' ? fmt(x.value, x.value % 1 ? 4 : 0) : x.value) + '</td></tr>';
    }).join('');
  }
  ['xAddress', 'xContact'].forEach(function (id) { $(id).addEventListener('input', renderEU); });
  $('xCsv').addEventListener('click', function () {
    var lines = euRows().map(function (x) { return x.sec ? '"' + x.label + '";' : '"' + String(x.label).replace(/"/g, '""') + '";"' + String(x.value).replace(/"/g, '""') + '"'; });
    download('yesil_pusula_AB_veri_' + $('year').value + '.csv', '﻿' + lines.join('\n'), 'text/csv;charset=utf-8');
  });
  $('xXlsx').addEventListener('click', function () {
    var X = window.XLSX;
    var wb = X.utils.book_new();
    var sum = [['Yeşil Pusula - AB veri dosyası / EU data file (draft)'], []].concat(euRows().map(function (x) { return x.sec ? [x.label] : [x.label, x.value]; }));
    var ws = X.utils.aoa_to_sheet(sum); ws['!cols'] = [{ wch: 62 }, { wch: 48 }];
    X.utils.book_append_sheet(wb, ws, 'Summary');
    var mn = MONTHS.tr;
    var ag = TL.aggregate(rows, factors());
    var mrows = [['Ay / Month', 'Üretim (t)', 'Elektrik (MWh)', 'Doğalgaz (m3)', 'Motorin (L)', 'LPG (L)', 'Kömür (t)', 'Öncül (t)', 'tCO2e/t']].concat(ag.months.map(function (m, i) {
      return [mn[i]].concat(TL.COLS.map(function (c) { return m[c]; })).concat([m.intensity === null ? '' : Math.round(m.intensity * 10000) / 10000]);
    }));
    var ws2 = X.utils.aoa_to_sheet(mrows); ws2['!cols'] = [{ wch: 12 }].concat(TL.COLS.map(function () { return { wch: 14 }; })).concat([{ wch: 10 }]);
    X.utils.book_append_sheet(wb, ws2, 'Monthly');
    var src = [['Kaynaklar / Sources']].concat(D.sources.map(function (s) { return [s.text, s.url]; }));
    var ws3 = X.utils.aoa_to_sheet(src); ws3['!cols'] = [{ wch: 110 }, { wch: 60 }];
    X.utils.book_append_sheet(wb, ws3, 'Sources');
    var out = X.write(wb, { bookType: 'xlsx', type: 'array' });
    download('yesil_pusula_AB_veri_' + $('year').value + '.xlsx', new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  });

  /* ---------- Proje kaydet / aç ---------- */
  $('pSave').addEventListener('click', function () {
    var form = {};
    A.FIELDS.forEach(function (k) { form[k] = $(k).value; });
    var proj = {
      app: 'yesil-pusula', saved: new Date().toISOString(), factorVersion: D.version, form: form, monthly: rows,
      solar: { kwp: $('s_kwp').value, yield: $('s_yield').value, capex: $('s_capex').value, price: $('s_price').value },
      supplier: { name: $('sSupplier').value, preCn: $('sPreCn').value, contact: $('sContact').value, lang: $('sLang').value },
      eu: { address: $('xAddress').value, contact: $('xContact').value }
    };
    var name = ($('company').value || 'proje').replace(/[^\wçğıöşüÇĞİÖŞÜ]+/g, '_').slice(0, 40);
    download('yesil_pusula_' + name + '.json', JSON.stringify(proj, null, 2), 'application/json');
  });
  $('pOpen').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var p = JSON.parse(reader.result);
        if (p.app !== 'yesil-pusula' || !p.form) throw new Error('bad');
        ['country', 'product'].forEach(function (k) { if (p.form[k] !== undefined) $(k).value = p.form[k]; });
        A.fillRoutes(p.form.route);
        A.FIELDS.forEach(function (k) { if (p.form[k] !== undefined && $(k)) $(k).value = p.form[k]; });
        $('scopeWrap').hidden = $('product').value !== 'custom';
        if (Array.isArray(p.monthly) && p.monthly.length === 12) rows = p.monthly;
        if (p.solar) { $('s_kwp').value = p.solar.kwp; $('s_yield').value = p.solar.yield; $('s_capex').value = p.solar.capex; $('s_price').value = p.solar.price; }
        if (p.supplier) { $('sSupplier').value = p.supplier.name || ''; $('sPreCn').value = p.supplier.preCn || ''; $('sContact').value = p.supplier.contact || ''; $('sLang').value = p.supplier.lang || 'tr'; }
        if (p.eu) { $('xAddress').value = p.eu.address || ''; $('xContact').value = p.eu.contact || ''; }
        renderMonthTable();
        A.calc();
        toast(t('p_loaded'));
      } catch (err) { toast(t('p_bad')); }
      e.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
  });

  /* demo düğmesi aylık veriyi de sıfırlasın */
  $('demo').addEventListener('click', function () {
    rows = DEMO_MONTHS.map(function (r) { return Object.assign({}, r); });
    renderMonthTable(); renderLetter(); renderEU();
  });

  window.YP_V3 = { monthly: function () { return TL.aggregate(rows, factors()); } };
  window.YP_onRender = function () { renderLetter(); renderEU(); updateMonthly(); };
  window.YP_onLang = function () { renderMonthTable(); };

  renderMonthTable();
  A.calc();
})();
