/* Yeşil Pusula v3 - yeni araçların arayüz metinleri */
(function (root) {
  var ADD = {
    tr: {
      tab_month: 'Aylık veri', tab_supplier: 'Tedarikçi talebi', tab_report: 'Rapor ve AB dosyası',
      m_title: 'Aylık fatura ve üretim verisi',
      m_intro: 'Faturalardaki aylık değerleri girin veya CSV / Excel yükleyin. Yıllık toplamlar hesaplamaya aktarılır, her ay için tutarlılık kontrolü yapılır.',
      m_month: 'Ay', m_prod: 'Üretim', m_total: 'Toplam', m_int: 'tCO2e/t', m_apply: 'Yıllık toplamı hesaplamaya aktar', m_tpl: 'CSV şablonu indir', m_upload: 'CSV / Excel yükle',
      m_applied: 'Yıllık toplamlar forma aktarıldı ve hesaplama güncellendi.', m_ok: 'Tutarlılık kontrolü: sorun bulunmadı.', m_filled: '{n}/12 ay dolu',
      a_energy_no_prod: '{m}: üretim yok ama enerji tüketimi var.', a_outlier: '{m}: ürün başına emisyon yıllık medyandan %{d} sapıyor; faturayı ve üretim kaydını kontrol edin.', a_precursor_low: '{m}: öncül malzeme üretimin %90’ından az.', a_elec_outlier: '{m}: ton başına elektrik tüketimi yıllık medyandan %{d} sapıyor; elektrik faturasını ve üretim kaydını kontrol edin.',
      m_err_file: 'Dosya okunamadı: üretim sütunu bulunamadı.', m_err_cell: '{m}. ay, geçersiz değer',
      s_title: 'Tedarikçiden öncül malzeme emisyon verisi talebi',
      s_intro: 'KOBİ’lerin en zor adımı, satın aldıkları öncül malzemenin (kütük, slab, tel çubuk) emisyon verisidir. Bu veri gelmezse AB varsayılan değeri uygulanır. Aşağıdaki mektup, tedarikçinizden AB kurallarına uygun veriyi ister.',
      s_supplier: 'Tedarikçi adı', s_precn: 'Öncül malzeme CN kodu', s_contact: 'İletişim (ad, e-posta)', s_lang: 'Mektup dili', s_copy: 'Kopyala', s_copied: 'Kopyalandı', s_download: 'İndir (.txt)',
      x_title: 'AB’li alıcı için veri dosyası',
      x_intro: 'AB iletişim şablonunun "Summary_Communication" sayfasındaki bilgilere hazırlık (Avrupa Komisyonu: şablon zorunlu değil, önerilir). Doğrulayıcı onayı öncesi taslaktır.',
      x_address: 'Tesis adresi', x_xlsx: 'Excel (.xlsx) indir', x_csv: 'CSV indir',
      p_save: 'Projeyi kaydet', p_open: 'Proje aç', p_loaded: 'Proje yüklendi.', p_bad: 'Proje dosyası okunamadı.'
    },
    az: {
      tab_month: 'Aylıq məlumat', tab_supplier: 'Təchizatçı sorğusu', tab_report: 'Hesabat və Aİ faylı',
      m_title: 'Aylıq hesab-faktura və istehsal məlumatı',
      m_intro: 'Hesab-fakturalardakı aylıq dəyərləri daxil edin və ya CSV / Excel yükləyin. İllik cəmlər hesablamaya ötürülür, hər ay üçün uyğunluq yoxlanılır.',
      m_month: 'Ay', m_prod: 'İstehsal', m_total: 'Cəmi', m_int: 'tCO2e/t', m_apply: 'İllik cəmi hesablamaya ötür', m_tpl: 'CSV şablonunu yüklə', m_upload: 'CSV / Excel yüklə',
      m_applied: 'İllik cəmlər formaya ötürüldü və hesablama yeniləndi.', m_ok: 'Uyğunluq yoxlaması: problem tapılmadı.', m_filled: '{n}/12 ay doludur',
      a_energy_no_prod: '{m}: istehsal yoxdur, amma enerji sərfi var.', a_outlier: '{m}: məhsul başına emissiya illik mediandan {d}% fərqlənir; hesab-fakturanı və istehsal qeydini yoxlayın.', a_precursor_low: '{m}: ilkin material istehsalın 90%-dən azdır.', a_elec_outlier: '{m}: ton başına elektrik sərfi illik mediandan {d}% fərqlənir; elektrik hesab-fakturasını və istehsal qeydini yoxlayın.',
      m_err_file: 'Fayl oxunmadı: istehsal sütunu tapılmadı.', m_err_cell: '{m}-ci ay, yanlış dəyər',
      s_title: 'Təchizatçıdan ilkin material emissiya məlumatı sorğusu',
      s_intro: 'KOBİ-lər üçün ən çətin addım aldıqları ilkin materialın (kütük, slab, məftil çubuq) emissiya məlumatıdır. Bu məlumat gəlməsə, Aİ standart dəyəri tətbiq olunur. Aşağıdakı məktub təchizatçıdan Aİ qaydalarına uyğun məlumat istəyir.',
      s_supplier: 'Təchizatçının adı', s_precn: 'İlkin materialın CN kodu', s_contact: 'Əlaqə (ad, e-poçt)', s_lang: 'Məktubun dili', s_copy: 'Kopyala', s_copied: 'Kopyalandı', s_download: 'Yüklə (.txt)',
      x_title: 'Aİ alıcısı üçün məlumat faylı',
      x_intro: 'Aİ əlaqə şablonunun "Summary_Communication" vərəqindəki məlumatlara hazırlıq (Avropa Komissiyası: şablon məcburi deyil, tövsiyə olunur). Verifikator təsdiqindən əvvəlki layihədir.',
      x_address: 'Müəssisənin ünvanı', x_xlsx: 'Excel (.xlsx) yüklə', x_csv: 'CSV yüklə',
      p_save: 'Layihəni saxla', p_open: 'Layihəni aç', p_loaded: 'Layihə yükləndi.', p_bad: 'Layihə faylı oxunmadı.'
    },
    kk: {
      tab_month: 'Айлық деректер', tab_supplier: 'Жеткізушіге сұрау', tab_report: 'Есеп және ЕО файлы',
      m_title: 'Айлық шот және өндіріс деректері',
      m_intro: 'Шоттардағы айлық мәндерді енгізіңіз немесе CSV / Excel жүктеңіз. Жылдық қосындылар есептеуге беріледі, әр ай үшін сәйкестік тексеріледі.',
      m_month: 'Ай', m_prod: 'Өндіріс', m_total: 'Барлығы', m_int: 'tCO2e/t', m_apply: 'Жылдық қосындыны есептеуге беру', m_tpl: 'CSV үлгісін жүктеу', m_upload: 'CSV / Excel жүктеу',
      m_applied: 'Жылдық қосындылар нысанға берілді, есептеу жаңартылды.', m_ok: 'Сәйкестік тексеруі: мәселе табылмады.', m_filled: '{n}/12 ай толтырылған',
      a_energy_no_prod: '{m}: өндіріс жоқ, бірақ энергия тұтынылған.', a_outlier: '{m}: өнім бірлігіне шығарынды жылдық медианадан {d}% ауытқиды; шот пен өндіріс жазбасын тексеріңіз.', a_precursor_low: '{m}: бастапқы материал өндірістің 90%-нан аз.', a_elec_outlier: '{m}: тонна басына электр тұтыну жылдық медианадан {d}% ауытқиды; электр шотын және өндіріс жазбасын тексеріңіз.',
      m_err_file: 'Файл оқылмады: өндіріс бағаны табылмады.', m_err_cell: '{m}-ай, қате мән',
      s_title: 'Жеткізушіден бастапқы материал шығарындысы туралы деректер сұрау',
      s_intro: 'ШОБ үшін ең қиын қадам сатып алынған бастапқы материалдың (дайындама, сляб, сым) шығарынды деректері. Бұл деректер болмаса, ЕО әдепкі мәні қолданылады. Төмендегі хат жеткізушіден ЕО ережелеріне сай деректерді сұрайды.',
      s_supplier: 'Жеткізуші атауы', s_precn: 'Бастапқы материалдың CN коды', s_contact: 'Байланыс (аты, e-mail)', s_lang: 'Хат тілі', s_copy: 'Көшіру', s_copied: 'Көшірілді', s_download: 'Жүктеу (.txt)',
      x_title: 'ЕО сатып алушысына арналған деректер файлы',
      x_intro: 'ЕО байланыс үлгісінің "Summary_Communication" парағындағы ақпаратқа дайындық (Еуропалық Комиссия: үлгі міндетті емес, ұсынылады). Верификатор растауына дейінгі жоба.',
      x_address: 'Кәсіпорын мекенжайы', x_xlsx: 'Excel (.xlsx) жүктеу', x_csv: 'CSV жүктеу',
      p_save: 'Жобаны сақтау', p_open: 'Жобаны ашу', p_loaded: 'Жоба жүктелді.', p_bad: 'Жоба файлы оқылмады.'
    },
    en: {
      tab_month: 'Monthly data', tab_supplier: 'Supplier request', tab_report: 'Report and EU file',
      m_title: 'Monthly invoice and production data',
      m_intro: 'Enter the monthly values from your invoices or upload a CSV / Excel file. Annual totals feed the calculation and every month is checked for consistency.',
      m_month: 'Month', m_prod: 'Production', m_total: 'Total', m_int: 'tCO2e/t', m_apply: 'Apply annual totals to the calculation', m_tpl: 'Download CSV template', m_upload: 'Upload CSV / Excel',
      m_applied: 'Annual totals were applied and the calculation was updated.', m_ok: 'Consistency check: no issues found.', m_filled: '{n}/12 months filled',
      a_energy_no_prod: '{m}: no production but energy was used.', a_outlier: '{m}: emissions per tonne deviate {d}% from the annual median; check the invoice and production record.', a_precursor_low: '{m}: precursor input is below 90% of production.', a_elec_outlier: '{m}: electricity use per tonne deviates {d}% from the annual median; check the electricity invoice and production record.',
      m_err_file: 'File could not be read: no production column found.', m_err_cell: 'Month {m}, invalid value',
      s_title: 'Request for precursor emissions data from your supplier',
      s_intro: 'The hardest step for SMEs is the emissions data of purchased precursors (billet, slab, wire rod). Without it the EU default value applies. The letter below asks your supplier for data in line with EU rules.',
      s_supplier: 'Supplier name', s_precn: 'Precursor CN code', s_contact: 'Contact (name, e-mail)', s_lang: 'Letter language', s_copy: 'Copy', s_copied: 'Copied', s_download: 'Download (.txt)',
      x_title: 'Data file for your EU buyer',
      x_intro: 'Prepares the information in the "Summary_Communication" sheet of the EU communication template (European Commission: the template is not compulsory but recommended). Draft before verification.',
      x_address: 'Installation address', x_xlsx: 'Download Excel (.xlsx)', x_csv: 'Download CSV',
      p_save: 'Save project', p_open: 'Open project', p_loaded: 'Project loaded.', p_bad: 'Project file could not be read.'
    }
  };
  var EU_LABELS = {
    sec_installation: 'TESİS / INSTALLATION', sec_product: 'ÜRÜN / PRODUCT', sec_emissions: 'GÖMÜLÜ EMİSYON / EMBEDDED EMISSIONS', sec_precursor: 'ÖNCÜL MALZEME / PRECURSOR', sec_method: 'YÖNTEM / METHOD',
    installation_name: 'Tesis / firma adı - Installation name', country: 'Ülke - Country', address: 'Adres - Address', contact: 'İletişim - Contact', period: 'Raporlama dönemi - Reporting period',
    cn_code: 'CN kodu - CN code', product_desc: 'Ürün tanımı - Description', route: 'Üretim rotası - Production route', production_t: 'Üretim (t) - Production (t)', export_eu_t: 'AB’ye ihracat (t) - Exports to EU (t)',
    see_direct: 'Özgül doğrudan gömülü emisyon (tCO2e/t) - SEE direct', see_indirect: 'Özgül dolaylı gömülü emisyon (tCO2e/t) - SEE indirect', see_total: 'Toplam (tCO2e/t) - SEE total',
    cbam_scope: 'CBAM kapsamı - CBAM scope', cbam_embedded: 'CBAM gömülü emisyonu (tCO2e/t) - CBAM embedded', uncertainty95: '%95 aralık - 95% range', elec_per_t: 'Elektrik tüketimi (MWh/t) - Electricity (MWh/t)', elec_factor: 'Elektrik emisyon faktörü (tCO2e/MWh) - Electricity EF',
    precursor_cn: 'Öncül CN kodu - Precursor CN', precursor_qty: 'Öncül miktarı (t) - Precursor quantity (t)', precursor_see: 'Öncül özgül emisyonu (tCO2e/t) - Precursor SEE', precursor_source: 'Öncül veri kaynağı - Precursor data source',
    method: 'Belirleme yöntemi - Determination method', default_used: 'Varsayılan değer kullanıldı mı - Default values used', carbon_price_paid: 'Menşe ülkede ödenen karbon fiyatı - Carbon price paid', verification: 'Doğrulama durumu - Verification status',
    factor_version: 'Faktör sürümü - Factor version', input_sha256: 'Girdi özeti SHA-256 - Input digest',
    v_calculation: 'Hesaplama (gerçek veri) - Calculation (actual data)', v_no: 'Hayır - No', v_none: 'Yok - None', v_not_verified: 'Doğrulanmamış taslak - Not yet verified (draft)', v_direct: 'Yalnız doğrudan - Direct only', v_total: 'Doğrudan + dolaylı - Direct + indirect'
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = { ADD: ADD, EU_LABELS: EU_LABELS };
  else {
    Object.keys(ADD).forEach(function (l) { Object.keys(ADD[l]).forEach(function (k) { root.YP_I18N[l][k] = ADD[l][k]; }); });
    root.YP_EU_LABELS = EU_LABELS;
  }
})(this);
