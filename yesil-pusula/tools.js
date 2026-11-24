/* Yeşil Pusula v3 - gerçek kullanım araçları:
   aylık veri toplama ve anomali kontrolü, CSV okuma, tedarikçi veri talebi, AB veri dosyası satırları. */
(function (root) {
  'use strict';

  var COLS = ['production_t', 'electricity_mwh', 'gas_m3', 'diesel_l', 'lpg_l', 'coal_t', 'precursor_t'];

  function toNum(v) {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return isFinite(v) ? v : NaN;
    var s = String(v).trim().replace(/\s/g, '');
    if (s === '') return 0;
    if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
      /* 1.234,5 (TR) veya 1,234.5 (EN) */
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');            /* 15.500 = on beş bin beş yüz (TR binlik ayırıcı) */
    } else if (/^-?\d{1,3}(,\d{3}){2,}$/.test(s)) {
      s = s.replace(/,/g, '');             /* 1,234,567 */
    } else if (s.indexOf(',') > -1) {
      s = s.replace(',', '.');
    }
    var n = Number(s);
    return isFinite(n) ? n : NaN;
  }

  /* Aylık satırları toplar; ay bazında yoğunluk ve anomali kontrolü yapar.
     factors: {gas, diesel, lpg, coal, preInt} (t CO2e / birim) */
  function aggregate(rows, factors) {
    var tot = {};
    COLS.forEach(function (c) { tot[c] = 0; });
    var errors = [];
    var months = rows.map(function (r, i) {
      var m = { month: i + 1 };
      COLS.forEach(function (c) {
        var v = toNum(r[c]);
        if (isNaN(v)) { errors.push({ month: i + 1, col: c, code: 'nan' }); v = 0; }
        if (v < 0) { errors.push({ month: i + 1, col: c, code: 'negative' }); v = 0; }
        m[c] = v;
        tot[c] += v;
      });
      var direct = m.gas_m3 * factors.gas + m.diesel_l * factors.diesel + m.lpg_l * factors.lpg + m.coal_t * factors.coal;
      var emb = direct + m.precursor_t * factors.preInt;
      m.intensity = m.production_t > 0 ? emb / m.production_t : null;
      /* Elektrik çelik/alüminyumda SKDM kapsamına girmez ama fatura hatası yine de yakalanmalı:
         ton başına elektrik ayrı izlenir. */
      m.elecIntensity = m.production_t > 0 && m.electricity_mwh > 0 ? m.electricity_mwh / m.production_t : null;
      m.energyNoProd = m.production_t === 0 && (m.electricity_mwh > 0 || m.gas_m3 > 0);
      return m;
    });
    function median(arr) {
      var v = arr.filter(function (x) { return x !== null; }).sort(function (a, b) { return a - b; });
      return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : null;
    }
    var med = median(months.map(function (m) { return m.intensity; }));
    var medElec = median(months.map(function (m) { return m.elecIntensity; }));
    var anomalies = [];
    months.forEach(function (m) {
      if (m.energyNoProd) anomalies.push({ month: m.month, code: 'energy_no_prod' });
      else {
        if (med && m.intensity !== null && Math.abs(m.intensity - med) / med > 0.25) {
          anomalies.push({ month: m.month, code: 'outlier', dev: Math.round((m.intensity - med) / med * 100) });
        }
        if (medElec && m.elecIntensity !== null && Math.abs(m.elecIntensity - medElec) / medElec > 0.25) {
          anomalies.push({ month: m.month, code: 'elec_outlier', dev: Math.round((m.elecIntensity - medElec) / medElec * 100) });
        }
      }
      if (m.production_t > 0 && m.precursor_t > 0 && m.precursor_t < m.production_t * 0.9) anomalies.push({ month: m.month, code: 'precursor_low' });
    });
    var filled = months.filter(function (m) { return COLS.some(function (c) { return m[c] > 0; }); }).length;
    return { totals: tot, months: months, median: med, anomalies: anomalies, errors: errors, filled: filled };
  }

  /* CSV okuma: ; veya , ayırıcı, ilk satır başlık. Sütun eşleştirme başlık adına göre. */
  var ALIASES = {
    production_t: ['production', 'uretim', 'üretim', 'istehsal', 'өндіріс', 'production_t'],
    electricity_mwh: ['electricity', 'elektrik', 'elektrik_mwh', 'электр', 'electricity_mwh'],
    gas_m3: ['gas', 'dogalgaz', 'doğalgaz', 'qaz', 'газ', 'gas_m3'],
    diesel_l: ['diesel', 'motorin', 'dizel', 'дизель', 'diesel_l'],
    lpg_l: ['lpg', 'lpg_l'],
    coal_t: ['coal', 'komur', 'kömür', 'көмір', 'coal_t'],
    precursor_t: ['precursor', 'oncul', 'öncül', 'ilkin', 'бастапқы', 'precursor_t']
  };
  function norm(h) { return String(h).toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9çğıöşüəәіңғүұқөһ_а-я]/gi, '').trim(); }

  function parseCSV(text) {
    text = String(text).replace(/^﻿/, '');
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    if (lines.length < 2) return { ok: false, code: 'empty' };
    var sep = (lines[0].split(';').length > lines[0].split(',').length) ? ';' : ',';
    var head = lines[0].split(sep).map(norm);
    var idx = {};
    Object.keys(ALIASES).forEach(function (k) {
      for (var i = 0; i < head.length; i++) {
        if (ALIASES[k].some(function (a) { return head[i].indexOf(norm(a)) === 0; })) { idx[k] = i; break; }
      }
    });
    if (idx.production_t === undefined) return { ok: false, code: 'no_production' };
    var rows = lines.slice(1, 13).map(function (l) {
      var cells = l.split(sep), r = {};
      COLS.forEach(function (c) { r[c] = idx[c] !== undefined ? cells[idx[c]] : 0; });
      return r;
    });
    while (rows.length < 12) { var e = {}; COLS.forEach(function (c) { e[c] = 0; }); rows.push(e); }
    return { ok: true, rows: rows, matched: Object.keys(idx) };
  }

  function csvTemplate(months) {
    var head = 'month;production_t;electricity_mwh;gas_m3;diesel_l;lpg_l;coal_t;precursor_t';
    return '﻿' + head + '\n' + months.map(function (m, i) {
      return [i + 1].concat(COLS.map(function (c) { return String(m[c] === undefined ? 0 : m[c]).replace('.', ','); })).join(';');
    }).join('\n') + '\n';
  }

  /* Tedarikçi veri talebi mektubu */
  function supplierLetter(p, lang) {
    var L = {
      tr: [
        'Konu: SKDM (CBAM) kapsamında öncül malzeme gömülü emisyon verisi talebi',
        '',
        'Sayın ' + (p.supplier || '[Tedarikçi]') + ' yetkilisi,',
        '',
        (p.company || '[Firmamız]') + ', ' + p.period + ' döneminde tarafınızdan yaklaşık ' + p.qty + ' ton ' + p.preDesc + ' (CN ' + p.preCn + ') tedarik etmiştir. Bu malzemeden ürettiğimiz ' + p.productDesc + ' (CN ' + p.productCn + ') ürünlerini Avrupa Birliği’ne ihraç etmekteyiz.',
        '',
        'AB Sınırda Karbon Düzenleme Mekanizması (Tüzük (AB) 2023/956) gereğince ürünlerimizin gömülü emisyonlarını hesaplarken öncül malzemelerin gerçek emisyon verisine ihtiyaç duymaktayız. Bu veri sağlanamadığında AB varsayılan değerleri uygulanmakta ve bu durum, sizin malzemenizle üretilen ürünlerin AB pazarındaki rekabet gücünü düşürmektedir.',
        '',
        'Bu nedenle aşağıdaki bilgileri paylaşmanızı rica ederiz:',
        '1. Tesis adı, adresi ve ülkesi',
        '2. Üretim rotası (ör. hurda + elektrik ark ocağı, yüksek fırın)',
        '3. Ürün başına doğrudan gömülü emisyon (tCO2e/t)',
        '4. Ürün başına dolaylı gömülü emisyon (tCO2e/t) ve kullanılan elektrik emisyon faktörü',
        '5. Verinin ait olduğu dönem ve doğrulama durumu (varsa doğrulayıcı kuruluş)',
        '6. Varsa menşe ülkede ödenen karbon fiyatı',
        '',
        'Verileri AB’nin önerdiği iletişim şablonunun "Summary_Communication" sayfası formatında iletmeniz süreci kolaylaştıracaktır. Paylaşacağınız bilgiler yalnızca SKDM raporlaması için kullanılacak ve gizli tutulacaktır.',
        '',
        'Saygılarımızla,',
        (p.company || '[Firma]') + (p.contact ? '\n' + p.contact : '')
      ],
      en: [
        'Subject: Request for embedded emissions data of precursor materials under the EU CBAM',
        '',
        'Dear ' + (p.supplier || '[Supplier]') + ' team,',
        '',
        (p.company || '[Our company]') + ' sourced approximately ' + p.qty + ' tonnes of ' + p.preDescEn + ' (CN ' + p.preCn + ') from you in ' + p.period + '. We use this material to produce ' + p.productDescEn + ' (CN ' + p.productCn + ') that we export to the European Union.',
        '',
        'Under the EU Carbon Border Adjustment Mechanism (Regulation (EU) 2023/956) we need the actual embedded emissions of our precursor materials. Where such data is missing, EU default values apply, which reduces the competitiveness of products made from your material on the EU market.',
        '',
        'We would therefore be grateful if you could share:',
        '1. Installation name, address and country',
        '2. Production route (e.g. scrap + electric arc furnace, blast furnace)',
        '3. Specific direct embedded emissions (tCO2e/t)',
        '4. Specific indirect embedded emissions (tCO2e/t) and the electricity emission factor used',
        '5. Reporting period and verification status (verifier, if any)',
        '6. Carbon price paid in the country of origin, if any',
        '',
        'Sharing the data in the format of the "Summary_Communication" sheet of the EU communication template would make the process easier. The information will be used only for CBAM reporting and treated as confidential.',
        '',
        'Kind regards,',
        (p.company || '[Company]') + (p.contact ? '\n' + p.contact : '')
      ]
    };
    return (L[lang] || L.tr).join('\n');
  }

  /* AB veri dosyası (iletişim şablonu özetine hazırlık) satırları */
  function euSummary(r, meta) {
    var prod = Number(r.inputs.production_t);
    var preDirect = r.precursor_t;
    var seeDirect = (r.direct_t + preDirect) / prod;
    var seeIndirect = r.indirect_t / prod;
    function f(x, d) { return Math.round(x * Math.pow(10, d)) / Math.pow(10, d); }
    return [
      ['section', 'installation'],
      ['installation_name', meta.company || ''],
      ['country', meta.countryName],
      ['address', meta.address || ''],
      ['contact', meta.contact || ''],
      ['period', meta.periodStart + ' / ' + meta.periodEnd],
      ['section', 'product'],
      ['cn_code', r.inputs.product === 'custom' ? (meta.customCn || '') : r.inputs.product],
      ['product_desc', meta.productDesc],
      ['route', meta.routeName],
      ['production_t', prod],
      ['export_eu_t', Number(r.inputs.export_t)],
      ['section', 'emissions'],
      ['see_direct', f(seeDirect, 4)],
      ['see_indirect', f(seeIndirect, 4)],
      ['see_total', f(seeDirect + seeIndirect, 4)],
      ['cbam_scope', r.scope],
      ['cbam_embedded', r.embedded],
      ['uncertainty95', [r.embedded_lo, r.embedded_hi]],
      ['elec_per_t', f(Number(r.inputs.electricity_mwh) / prod, 4)],
      ['elec_factor', meta.gridFactor + ' (' + meta.gridSource + ')'],
      ['section', 'precursor'],
      ['precursor_cn', meta.preCn || ''],
      ['precursor_qty', Number(r.inputs.precursor_t) || 0],
      ['precursor_see', Number(r.inputs.precursor_int) || 0],
      ['precursor_source', meta.preSource],
      ['section', 'method'],
      ['method', 'calculation'],
      ['default_used', 'no'],
      ['carbon_price_paid', meta.carbonPrice || 'none'],
      ['verification', 'not_verified'],
      ['factor_version', meta.version],
      ['input_sha256', meta.hash]
    ];
  }

  var API = { COLS: COLS, toNum: toNum, aggregate: aggregate, parseCSV: parseCSV, csvTemplate: csvTemplate, supplierLetter: supplierLetter, euSummary: euSummary };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.YP_TOOLS = API;
})(this);
