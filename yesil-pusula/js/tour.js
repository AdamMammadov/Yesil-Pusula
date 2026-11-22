/* Yeşil Pusula - tanıtım turu: ürünün ana ekranlarını sırayla gösterir (sunum ve ilk kullanım için) */
(function (root) {
  'use strict';
  var TXT = {
    tr: {
      tour_btn: 'Tanıtım turu', tour_next: 'İleri', tour_prev: 'Geri', tour_close: 'Kapat', tour_done: 'Bitir',
      t1h: 'Sorun', t1: 'Türkiye 2025’te AB’ye yaklaşık 10,8 milyar € değerinde SKDM kapsamındaki mal ihraç etti. Ankara’da firmaların yalnız %12’si gerçek emisyon verisi sunabiliyor; diğerleri AB’nin yüksek varsayılan değerleriyle ödüyor.',
      t2h: 'Faturadan veri', t2: 'Firma 12 aylık elektrik, doğalgaz, yakıt ve üretim verisini girer veya Excel yükler. Sistem her ayı kontrol eder: yanlış girilen bir fatura anında işaretlenir.',
      t3h: 'AB kurallarıyla sonuç', t3: 'Ürün başına gömülü emisyon {emb} tCO2e/t, %95 güven aralığıyla birlikte. AB varsayılan değerine göre yıllık tasarruf: {save}.',
      t4h: '2034’e kadar maliyet', t4: 'Ücretsiz tahsis her yıl azalıyor. Gerçek veri olmadan ton başına maliyet 2034’te €{d34} oluyor, gerçek veriyle €{a34}. 2026-2034 toplam tasarruf: {cum}.',
      t5h: 'Ne yapmalı?', t5: 'Beş önlemin yatırımı, tasarrufu ve geri ödemesi; azaltım maliyet eğrisi hangi önlemle başlanacağını gösterir. Seçili önlemler: {capex} yatırım, {pb} yılda geri ödeme.',
      t6h: 'AB’li alıcıya rapor', t6: 'AB iletişim şablonuna uygun Excel veri dosyası, tedarikçiye hazır veri talebi ve PDF ön rapor tek tıkla hazırlanır.',
      t7h: 'OSB yönetimi için', t7: 'OSB yönetimi üye firmaların SKDM riskini anonim ve toplu görür. Bu örnekte gerçek veriyle yıllık {osb} tasarruf potansiyeli var; öncelikli firmalar otomatik sıralanır.',
      t8h: 'Türk dünyasına ölçek', t8: 'Aynı yöntem Orta Koridor boyunca Azerbaycan, Kazakistan, Özbekistan ve Kırgızistan’a, ülkeye özgü şebeke faktörü ve 4 dille taşınır: bir pilot, bir şablon, bir yerel ortak.'
    },
    az: {
      tour_btn: 'Təqdimat turu', tour_next: 'İrəli', tour_prev: 'Geri', tour_close: 'Bağla', tour_done: 'Bitir',
      t1h: 'Problem', t1: 'Türkiyə 2025-ci ildə Aİ-yə təxminən 10,8 milyard € dəyərində CBAM əhatəsindəki mal ixrac edib. Ankarada şirkətlərin yalnız 12%-i real emissiya məlumatı təqdim edə bilir; qalanları Aİ-nin yüksək standart dəyərləri ilə ödəyir.',
      t2h: 'Hesabdan məlumata', t2: 'Şirkət 12 aylıq elektrik, qaz, yanacaq və istehsal məlumatını daxil edir və ya Excel yükləyir. Sistem hər ayı yoxlayır: səhv yazılmış hesab dərhal işarələnir.',
      t3h: 'Aİ qaydaları ilə nəticə', t3: 'Məhsul başına yerləşdirilmiş emissiya {emb} tCO2e/t, 95% etibar aralığı ilə. Aİ standart dəyərinə görə illik qənaət: {save}.',
      t4h: '2034-ə qədər xərc', t4: 'Pulsuz bölgü hər il azalır. Real məlumat olmadan ton başına xərc 2034-də €{d34} olur, real məlumatla €{a34}. 2026-2034 ümumi qənaət: {cum}.',
      t5h: 'Nə etməli?', t5: 'Beş tədbirin investisiyası, qənaəti və geri qayıtma müddəti; azaltma xərci əyrisi hansı tədbirlə başlamaq lazım olduğunu göstərir. Seçilmiş tədbirlər: {capex} investisiya, {pb} ildə geri qayıtma.',
      t6h: 'Aİ alıcısına hesabat', t6: 'Aİ əlaqə şablonuna uyğun Excel məlumat faylı, təchizatçıya hazır məlumat sorğusu və PDF ilkin hesabat bir kliklə hazırlanır.',
      t7h: 'Sənaye zonası üçün', t7: 'Zona rəhbərliyi üzv şirkətlərin CBAM riskini anonim və ümumi görür. Bu nümunədə real məlumatla illik {osb} qənaət potensialı var; prioritet şirkətlər avtomatik sıralanır.',
      t8h: 'Türk dünyasına miqyas', t8: 'Eyni metod Orta Dəhliz boyunca Azərbaycan, Qazaxıstan, Özbəkistan və Qırğızıstana ölkəyə uyğun şəbəkə faktoru və 4 dillə daşınır: bir pilot, bir şablon, bir yerli tərəfdaş.'
    },
    kk: {
      tour_btn: 'Таныстыру туры', tour_next: 'Алға', tour_prev: 'Артқа', tour_close: 'Жабу', tour_done: 'Аяқтау',
      t1h: 'Мәселе', t1: 'Түркия 2025 жылы ЕО-ға шамамен 10,8 млрд € CBAM қамтитын тауар экспорттады. Анкарада компаниялардың тек 12%-ы нақты шығарынды деректерін ұсына алады; қалғандары ЕО-ның жоғары әдепкі мәндерімен төлейді.',
      t2h: 'Шоттан деректерге', t2: 'Компания 12 айлық электр, газ, отын және өндіріс деректерін енгізеді немесе Excel жүктейді. Жүйе әр айды тексереді: қате енгізілген шот бірден белгіленеді.',
      t3h: 'ЕО ережелерімен нәтиже', t3: 'Өнім бірлігіне кірістірілген шығарынды {emb} tCO2e/t, 95% сенім аралығымен. ЕО әдепкі мәнімен салыстырғанда жылдық үнем: {save}.',
      t4h: '2034 жылға дейінгі шығын', t4: 'Тегін бөлу жыл сайын азаяды. Нақты деректерсіз бір тоннаға шығын 2034 жылы €{d34}, нақты деректермен €{a34}. 2026-2034 жалпы үнем: {cum}.',
      t5h: 'Не істеу керек?', t5: 'Бес шараның инвестициясы, үнемі және өтелу мерзімі; азайту шығынының қисығы қай шарадан бастау керегін көрсетеді. Таңдалған шаралар: {capex} инвестиция, {pb} жылда өтеледі.',
      t6h: 'ЕО сатып алушысына есеп', t6: 'ЕО байланыс үлгісіне сай Excel деректер файлы, жеткізушіге дайын сұрау және PDF алдын ала есеп бір басумен дайындалады.',
      t7h: 'Индустриялық аймақ үшін', t7: 'Аймақ басшылығы мүше компаниялардың CBAM тәуекелін анонимді және жиынтық көреді. Бұл мысалда нақты деректермен жылына {osb} үнемдеу әлеуеті бар; басым компаниялар автоматты түрде реттеледі.',
      t8h: 'Түркі әлеміне ауқым', t8: 'Сол әдіс Орта дәліз бойымен Әзербайжан, Қазақстан, Өзбекстан және Қырғызстанға елге тән желі коэффициентімен және 4 тілмен таралады: бір пилот, бір үлгі, бір жергілікті серіктес.'
    },
    en: {
      tour_btn: 'Guided tour', tour_next: 'Next', tour_prev: 'Back', tour_close: 'Close', tour_done: 'Finish',
      t1h: 'The problem', t1: 'In 2025 Türkiye exported about €10.8bn of CBAM goods to the EU. In Ankara only 12% of firms can provide actual emissions data; the rest pay on the EU’s high default values.',
      t2h: 'From invoices to data', t2: 'The company enters 12 months of electricity, gas, fuel and production data or uploads Excel. Every month is checked: a mistyped invoice is flagged at once.',
      t3h: 'Result by EU rules', t3: 'Embedded emissions of {emb} tCO2e/t with a 95% confidence range. Annual saving versus the EU default value: {save}.',
      t4h: 'Cost until 2034', t4: 'Free allocation falls every year. Without actual data the cost per tonne reaches €{d34} in 2034, with actual data €{a34}. Total saving 2026-2034: {cum}.',
      t5h: 'What to do?', t5: 'Investment, saving and payback for five measures; the abatement cost curve shows where to start. Selected measures: {capex} investment, payback in {pb} years.',
      t6h: 'Report for the EU buyer', t6: 'An Excel data file in line with the EU communication template, a ready data request for suppliers and a PDF preliminary report in one click.',
      t7h: 'For industrial zones', t7: 'Zone management sees members’ CBAM risk anonymously and in aggregate. In this example actual data unlocks {osb} of annual savings; priority firms are ranked automatically.',
      t8h: 'Scaling across the Turkic world', t8: 'The same method travels along the Middle Corridor to Azerbaijan, Kazakhstan, Uzbekistan and Kyrgyzstan with country grid factors and 4 languages: one pilot, one template, one local partner.'
    }
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = TXT; return; }
  Object.keys(TXT).forEach(function (l) { Object.keys(TXT[l]).forEach(function (k) { root.YP_I18N[l][k] = TXT[l][k]; }); });

  var A = root.YP_APP, D = root.YP_DATA, E = root.YP_ENGINE, R = root.YP_ROADMAP, O = root.YP_OSB;
  var t = A.t, fmt = A.fmt, eur = A.eur;
  var STEPS = [
    { view: 'home', sel: '.stats' },
    { view: 'firma', tab: 'month', sel: '#tab-month .card' },
    { view: 'firma', tab: 'res', sel: '#tab-res .kpis' },
    { view: 'firma', tab: 'res', sel: '#projChart', card: true },
    { view: 'firma', tab: 'roadmap', sel: '#tab-roadmap .split2' },
    { view: 'firma', tab: 'report', sel: '#tab-report .card' },
    { view: 'osb', sel: '#osbKpis' },
    { view: 'home', sel: '#mapHome' }
  ];
  var i = 0, layer = null, timer = null;

  function vars() {
    var r = A.last(), v = {};
    if (r) {
      var p = R.projection(r, { schedule: 'law' }), y = p.years[p.years.length - 1];
      v.emb = fmt(r.embedded, 3); v.save = eur(r.saving_eur);
      v.d34 = fmt(y.defPerT, 0); v.a34 = fmt(y.actPerT, 0);
      v.cum = '€' + fmt(p.cumSaving / 1e6, 2) + 'M';
    }
    var s = root.YP_V4 && root.YP_V4.sel;
    v.capex = s ? eur(s.capex) : '-'; v.pb = s && s.payback !== null ? fmt(s.payback, 1) : '-';
    v.osb = eur(O.aggregate(O.FIRMS, D, E, 2026).potential);
    return v;
  }

  function build() {
    layer = document.createElement('div');
    layer.className = 'tour';
    layer.innerHTML = '<div class="tour-block"></div><div class="tour-hl"></div><div class="tour-box" role="dialog" aria-modal="true">' +
      '<button type="button" class="tour-x" aria-label="x">×</button><div class="tour-n"></div><h4></h4><p></p>' +
      '<div class="tour-dots"></div><div class="tour-btns"><button type="button" class="ghost tour-prev"></button><button type="button" class="primary sm tour-next"></button></div></div>';
    document.body.appendChild(layer);
    layer.querySelector('.tour-x').addEventListener('click', close);
    layer.querySelector('.tour-block').addEventListener('click', close);
    layer.querySelector('.tour-prev').addEventListener('click', function () { go(i - 1); });
    layer.querySelector('.tour-next').addEventListener('click', function () { if (i >= STEPS.length - 1) close(); else go(i + 1); });
  }

  function place() {
    if (!layer) return;
    var st = STEPS[i], el = document.querySelector(st.sel);
    if (st.card && el) el = el.closest('.card') || el;
    var hl = layer.querySelector('.tour-hl'), box = layer.querySelector('.tour-box');
    if (!el) { hl.style.display = 'none'; return; }
    var r0 = el.getBoundingClientRect(), pad = 8, vw = window.innerWidth, vh = window.innerHeight;
    var bh = box.offsetHeight || 220, mobile = vw < 700;
    /* uzun öğelerde vurgu görünen alanla sınırlanır, kutuya yer kalır */
    var topLim = 76, botLim = mobile ? vh - bh - 24 : vh - 16;
    var rc = { left: r0.left, width: r0.width, top: Math.max(r0.top, topLim), bottom: Math.min(r0.bottom, botLim) };
    if (!mobile && r0.height > vh * 0.55) rc.bottom = Math.min(rc.bottom, rc.top + vh * 0.45);
    if (rc.bottom < rc.top + 40) rc.bottom = rc.top + 40;
    rc.height = rc.bottom - rc.top;
    hl.style.display = 'block';
    hl.style.left = (rc.left - pad) + 'px'; hl.style.top = (rc.top - pad) + 'px';
    hl.style.width = (rc.width + pad * 2) + 'px'; hl.style.height = (rc.height + pad * 2) + 'px';
    if (mobile) { box.style.left = '12px'; box.style.right = '12px'; box.style.top = 'auto'; box.style.bottom = '12px'; box.style.width = 'auto'; return; }
    var bw = Math.min(400, vw - 32);
    var left = Math.min(Math.max(16, rc.left), vw - bw - 16), top;
    if (rc.bottom + 16 + bh < vh) top = rc.bottom + 16;
    else if (rc.top - 16 - bh > 0) top = rc.top - 16 - bh;
    else { top = Math.max(16, vh - bh - 16); left = vw - bw - 16; }
    box.style.width = bw + 'px'; box.style.left = left + 'px'; box.style.top = top + 'px'; box.style.right = 'auto'; box.style.bottom = 'auto';
  }

  function render() {
    var st = STEPS[i], v = vars(), n = i + 1;
    layer.querySelector('.tour-n').textContent = n + ' / ' + STEPS.length;
    layer.querySelector('h4').textContent = t('t' + n + 'h');
    layer.querySelector('p').textContent = t('t' + n, v);
    layer.querySelector('.tour-dots').innerHTML = STEPS.map(function (s, k) { return '<i class="' + (k === i ? 'on' : '') + '"></i>'; }).join('');
    layer.querySelector('.tour-prev').textContent = t('tour_prev');
    layer.querySelector('.tour-prev').disabled = i === 0;
    layer.querySelector('.tour-next').textContent = i === STEPS.length - 1 ? t('tour_done') : t('tour_next');
    layer.querySelector('.tour-x').setAttribute('aria-label', t('tour_close'));
    var el = document.querySelector(st.sel);
    if (st.card && el) el = el.closest('.card') || el;
    if (el) {
      var rc = el.getBoundingClientRect();
      var tall = rc.height > window.innerHeight * 0.55;
      var y = tall ? window.scrollY + rc.top - 90 : window.scrollY + rc.top - Math.max(90, (window.innerHeight - rc.height) / 2 - (window.innerWidth < 700 ? 120 : 60));
      window.scrollTo(0, Math.max(0, y));
    }
    setTimeout(place, 60);
  }

  function go(k) {
    if (k < 0 || k >= STEPS.length) return;
    i = k;
    var st = STEPS[i];
    var want = '#' + st.view;
    var delay = 0;
    if (location.hash !== want) { location.hash = want; delay = 260; }
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (st.tab) A.showTab(st.tab);
      setTimeout(render, 120);
    }, delay);
  }

  function open() {
    if (!layer) build();
    layer.hidden = false;
    document.body.classList.add('touring');
    go(0);
  }
  function close() {
    if (layer) layer.hidden = true;
    document.body.classList.remove('touring');
  }

  window.addEventListener('resize', function () { if (layer && !layer.hidden) place(); });
  window.addEventListener('scroll', function () { if (layer && !layer.hidden) place(); }, { passive: true });
  document.addEventListener('keydown', function (e) {
    if (!layer || layer.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); if (i >= STEPS.length - 1) close(); else go(i + 1); }
    else if (e.key === 'ArrowLeft') go(i - 1);
  });
  document.querySelectorAll('[data-i18n^="tour_"]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
  var prevLang = root.YP_onLang;
  root.YP_onLang = function () { if (prevLang) prevLang(); if (layer && !layer.hidden) render(); };
  var btn = document.getElementById('tourBtn');
  if (btn) btn.addEventListener('click', open);
  if (location.hash === '#tur') { location.hash = '#home'; setTimeout(open, 400); }
  root.YP_TOUR = { open: open, close: close, go: go };
})(this);
