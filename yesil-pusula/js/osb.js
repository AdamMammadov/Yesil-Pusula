/* Yeşil Pusula v4 - OSB paneli: üye firmaların anonim, toplulaştırılmış SKDM görünümü.
   DEMO: firmalar sentetiktir (gerçek firma değildir). */
(function (root) {
  'use strict';

  /* status: actual (gerçek veri hazır), partial (kısmi veri), none (veri yok, AB varsayılanı) */
  var FIRMS = [
    { id: 'A', cn: '7208', export_t: 4000, emb: 0.278, route: 'Scrap-EAF', status: 'actual', staff: 85 },
    { id: 'B', cn: '7208', export_t: 9200, emb: 0.31, route: 'Scrap-EAF', status: 'partial', staff: 210 },
    { id: 'C', cn: '7207', export_t: 6500, emb: 2.05, route: 'BF-BOF', status: 'none', staff: 160 },
    { id: 'D', cn: '7208', export_t: 1800, emb: 0.24, route: 'Scrap-EAF', status: 'none', staff: 40 },
    { id: 'E', cn: '7208', export_t: 3100, emb: 0.35, route: 'Scrap-EAF', status: 'none', staff: 65 },
    { id: 'F', cn: '7207', export_t: 7400, emb: 1.95, route: 'BF-BOF', status: 'partial', staff: 240 },
    { id: 'G', cn: '7208', export_t: 950, emb: 0.29, route: 'Scrap-EAF', status: 'none', staff: 22 },
    { id: 'H', cn: '7208', export_t: 2600, emb: 0.26, route: 'Scrap-EAF', status: 'actual', staff: 58 },
    { id: 'I', cn: '7208', export_t: 5200, emb: 0.95, route: 'DRI-EAF', status: 'none', staff: 130 },
    { id: 'J', cn: '7207', export_t: 1200, emb: 2.10, route: 'BF-BOF', status: 'none', staff: 30 },
    { id: 'K', cn: '7208', export_t: 3800, emb: 0.33, route: 'Scrap-EAF', status: 'partial', staff: 90 },
    { id: 'L', cn: '7208', export_t: 700, emb: 0.22, route: 'Scrap-EAF', status: 'none', staff: 18 }
  ];

  function aggregate(firms, D, E, year) {
    var cy = D.cbam.years[year] || D.cbam.years[2026];
    var price = D.cbam.price.value;
    var tot = { export_t: 0, costDefaultAll: 0, costNow: 0, costActualAll: 0, staff: 0 };
    var counts = { actual: 0, partial: 0, none: 0 };
    var rows = firms.map(function (f) {
      var p = D.products[f.cn];
      var defM = p.defaults.TR * (1 + cy.markup);
      var cDef = E.cbamCost(defM, p.benchDefault, cy.factor, price, f.export_t).cost_eur;
      var benchA = p.bench[f.route] !== undefined ? p.bench[f.route] : p.benchDefault;
      var cAct = E.cbamCost(f.emb, benchA, cy.factor, price, f.export_t).cost_eur;
      /* kısmi veri: öncül verisi eksik, AB varsayılanı ile gerçek arası orta nokta kabul edilir */
      var cNow = f.status === 'actual' ? cAct : f.status === 'partial' ? Math.round((cAct + cDef) / 2) : cDef;
      tot.export_t += f.export_t; tot.costDefaultAll += cDef; tot.costNow += cNow; tot.costActualAll += cAct; tot.staff += f.staff;
      counts[f.status]++;
      return { id: f.id, cn: f.cn, export_t: f.export_t, status: f.status, costNow: cNow, costActual: cAct, potential: cNow - cAct, emb: f.emb };
    });
    rows.sort(function (a, b) { return b.potential - a.potential; });
    return { rows: rows, tot: tot, counts: counts, potential: tot.costNow - tot.costActualAll, n: firms.length, price: price, factor: cy.factor };
  }

  /* Orta Koridor üzerindeki sanayi merkezleri (yaklaşık koordinat) */
  var CORRIDOR = [
    { id: 'ankara', name: { tr: 'Ankara', az: 'Ankara', kk: 'Анкара', en: 'Ankara' }, c: 'TR', lon: 32.85, lat: 39.93 },
    { id: 'baku', name: { tr: 'Bakü', az: 'Bakı', kk: 'Баку', en: 'Baku' }, c: 'AZ', lon: 49.87, lat: 40.41 },
    { id: 'aktau', name: { tr: 'Aktav', az: 'Aktau', kk: 'Ақтау', en: 'Aktau' }, c: 'KZ', lon: 51.2, lat: 43.65 },
    { id: 'tashkent', name: { tr: 'Taşkent', az: 'Daşkənd', kk: 'Ташкент', en: 'Tashkent' }, c: 'UZ', lon: 69.24, lat: 41.3 },
    { id: 'bishkek', name: { tr: 'Bişkek', az: 'Bişkek', kk: 'Бішкек', en: 'Bishkek' }, c: 'KG', lon: 74.6, lat: 42.87 },
    { id: 'almaty', name: { tr: 'Almatı', az: 'Almatı', kk: 'Алматы', en: 'Almaty' }, c: 'KZ', lon: 76.95, lat: 43.24 },
    { id: 'astana', name: { tr: 'Astana', az: 'Astana', kk: 'Астана', en: 'Astana' }, c: 'KZ', lon: 71.45, lat: 51.17 }
  ];

  var API = { FIRMS: FIRMS, aggregate: aggregate, CORRIDOR: CORRIDOR };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.YP_OSB = API;
})(this);
