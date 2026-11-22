/* Yeşil Pusula v2 - faktör, ürün ve CBAM parametre kütüphanesi.
   Her değer kaynağı ve sürümüyle birlikte tutulur. Çevrimdışı çalışması için JSON yerine JS olarak gömülüdür. */
(function (root) {
  var DATA = {
    version: 'YP-FAKTOR-2026.11',
    updated: '2026-11-22',

    /* Şebeke elektriği (tCO2e/MWh) */
    grid: {
      TR: { value: 0.478, alt: 0.445, src: 'tr_etkb', year: 2022 },
      AZ: { value: 0.632, src: 'ember', year: 2025 },
      KZ: { value: 0.805, src: 'ember', year: 2025 },
      UZ: { value: 1.000, src: 'ember', year: 2025 },
      KG: { value: 0.153, src: 'ember', year: 2025 }
    },

    /* Güneş verimi (kWh/kWp/yıl) - varsayım, PVGIS ile tesis bazında doğrulanmalı */
    solarYield: { TR: 1450, AZ: 1350, KZ: 1250, UZ: 1500, KG: 1350 },

    /* Yakıtlar: IPCC 2006 Kılavuzu, Cilt 2, sabit yakma varsayılan değerleri.
       t CO2 / birim = NCV (GJ/birim) x EF (t CO2/GJ) */
    fuels: {
      gas:    { unit: 'm³', ncv: 0.0345,  ef: 0.0561, src: 'ipcc', note: 'ncv_gas' },
      diesel: { unit: 'L',  ncv: 0.03612, ef: 0.0741, src: 'ipcc', note: 'ncv_diesel' },
      lpg:    { unit: 'L',  ncv: 0.02554, ef: 0.0631, src: 'ipcc', note: 'ncv_lpg' },
      coal:   { unit: 't',  ncv: 25.8,    ef: 0.0946, src: 'ipcc', note: 'ncv_coal' }
    },

    /* CBAM ürünleri. scope: 'direct' (demir-çelik, alüminyum) veya 'total' (çimento, gübre).
       defaults: ülke bazlı AB varsayılan değeri (işaretleme öncesi, tCO2e/t).
       bench: CBAM kıyas değeri (tCO2e/t) üretim rotasına göre. */
    products: {
      '7208': {
        sector: 'steel', scope: 'direct',
        defaults: { TR: 2.428 },
        bench: { 'BF-BOF': 1.370, 'DRI-EAF': 0.481, 'Scrap-EAF': 0.072 },
        benchDefault: 1.370,
        peers: [0.21, 0.25, 0.31, 0.38, 0.45, 0.52, 0.66, 0.80]
      },
      '7207': {
        sector: 'steel', scope: 'direct',
        defaults: { TR: 2.310 },
        bench: { 'BF-BOF': 1.364 },
        benchDefault: 1.364,
        peers: [0.19, 0.24, 0.29, 0.35, 0.41, 0.50, 0.61]
      },
      custom: {
        sector: 'other', scope: 'direct', defaults: {}, bench: {}, benchDefault: null, peers: []
      }
    },

    /* CBAM takvimi: işaretleme (mark-up) ve CBAM faktörü (ücretsiz tahsisin süren payı) */
    cbam: {
      price: { value: 82.32, label: 'Q3 2026', published: '2026-10-05' },
      years: {
        2026: { markup: 0.10, factor: 0.975 },
        2027: { markup: 0.20, factor: 0.95 },
        2028: { markup: 0.30, factor: 0.90 },
        2029: { markup: 0.30, factor: 0.775 },
        2030: { markup: 0.30, factor: 0.515 }
      },
      fertMarkup: 0.01
    },

    /* Veri kalitesine göre göreli belirsizlik (1 sigma) */
    quality: { meter: 0.02, invoice: 0.05, supplier: 0.10, estimate: 0.15 },
    factorUnc: { grid: 0.10, fuel: 0.03, precursor: 0.0 },

    minPeers: 5,

    sources: [
      { id: 'tr_etkb', text: 'T.C. Enerji ve Tabii Kaynaklar Bakanlığı, 2022 Türkiye Elektrik Üretim ve Tüketim Noktası Emisyon Faktörleri (dağıtım bağlantılı: 0,478; iletim bağlantılı: 0,445 tCO2e/MWh)', url: 'https://enerji.gov.tr' },
      { id: 'ember', text: 'Ember (2026), Our World in Data üzerinden: elektrik üretiminin karbon yoğunluğu, 2025 (yaşam döngüsü bazlı, gCO2e/kWh)', url: 'https://ourworldindata.org/grapher/carbon-intensity-electricity' },
      { id: 'ipcc', text: 'IPCC 2006 Ulusal Sera Gazı Envanterleri Kılavuzu, Cilt 2, Tablo 1.2 ve 2.2 (doğalgaz 56,1; motorin 74,1; LPG 63,1; bitümlü kömür 94,6 tCO2/TJ)', url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html' },
      { id: 'cbam_def', text: 'AB Uygulama Tüzüğü (EU) 2025/2621, Ek I, (EU) 2026/1740 ile değiştirilmiş hali: varsayılan değerler ve işaretleme oranları', url: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en' },
      { id: 'cbam_bench', text: 'AB Uygulama Tüzüğü (EU) 2025/2620: CBAM kıyas değerleri (CN 7208: BF-BOF 1,370; DRI-EAF 0,481; Hurda-EAF 0,072)', url: 'https://cbamguide.com/sectors/steel/bf-bof/' },
      { id: 'cbam_price', text: 'Avrupa Komisyonu, CBAM sertifika fiyatı: Q1 2026 75,36 €, Q2 2026 75,28 €, Q3 2026 82,32 € (5 Ekim 2026)', url: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/price-cbam-certificates_en' },
      { id: 'cbam_prop', text: 'Avrupa Komisyonu, ETS revizyon önerisi COM(2026) 616 (17 Temmuz 2026): CBAM faktörünün daha yavaş azaltılması; yasalaşmamıştır, yürürlükteki takvim geçerlidir', url: 'https://cbamguide.com/learn/free-allocation/' },
      { id: 'cbam_faq', text: 'Avrupa Komisyonu, CBAM Soru ve Cevaplar (27 Mayıs 2026), S1.14-1.15: iletişim şablonu ve "Summary_Communication" sayfası (zorunlu değil, önerilir)', url: 'https://nkvh.kormany.hu/download/c/a3/93000/CBAM_Questions_and_Answers_20260527.pdf' },
      { id: 'doe', text: 'ABD Enerji Bakanlığı, Process Heating Tip Sheet #1 (2007): yanma havası ön ısıtması ile %13-51 yakıt tasarrufu (önlem varsayılanı %20 alınmıştır)', url: 'https://www1.eere.energy.gov/manufacturing/tech_assistance/pdfs/et_preheated.pdf' },
      { id: 'aso', text: 'Ankara Sanayi Odası, SKDM Firma Rehberi (Nisan 2026): anket katılımcılarının %12’si gerçek emisyon verisi sunabiliyor, %5’i kamu kurumlarından yeterli bilgi aldığını belirtiyor', url: 'https://www.aso.org.tr/uploads/ortam/SKDM-Firma-Rehberi.pdf' },
      { id: 'eurostat', text: 'Eurostat Comext (CBAMGuide derlemesi): Türkiye’nin AB’ye SKDM kapsamındaki mal ihracatı 2025’te yaklaşık 10,8 milyar €', url: 'https://cbamguide.com' },
      { id: 'cbam_factor', text: 'AB ETS Direktifi 2003/87/AT Md. 10a(1a): CBAM faktörü 2026 %97,5; 2027 %95; 2028 %90; 2029 %77,5; 2030 %51,5; 2031 %39; 2032 %26,5; 2033 %14; 2034 %0', url: 'https://eur-lex.europa.eu/eli/dir/2003/87/oj' }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.YP_DATA = DATA;
})(this);
