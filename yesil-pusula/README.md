# Yeşil Pusula - v4 (Beta)

Türk Dünyası KOBİ'leri için ortak karbon ve enerji verimliliği platformu (Türk Forum 2026 finalisti).

## v4: tam ürün
- **Ana sayfa:** problem, kaynaklı göstergeler (Eurostat, ASO, Avrupa Komisyonu, AB ETS Direktifi), nasıl çalışır, kimler için, Orta Koridor haritası.
- **Azaltım yol haritası:** 5 önlem (atık ısı geri kazanımı, brülör ayarı, düşük karbonlu öncül tedarikçisi, verimli motor ve sürücü, çatı GES); yatırım, enerji ve SKDM tasarrufu, geri ödeme; azaltım maliyet eğrisi (MACC).
- **2026-2034 SKDM projeksiyonu:** yürürlükteki CBAM faktörü takvimi ve Komisyon önerisi COM(2026) 616 karşılaştırması; varsayılan, gerçek veri ve önlemler senaryoları.
- **OSB paneli:** üye firmaların anonim, toplu SKDM görünümü; veri hazırlığı; tasarruf potansiyeline göre öncelik (demo: 12 sentetik firma).
- **Yöntem sayfası:** formüller, CBAM faktörü takvimi, 12 kaynak, testler, sınırlar.

## v3: gerçek kullanım araçları
- **Aylık veri:** 12 aylık fatura ve üretim verisi; CSV veya Excel yükleme (Türkçe ondalık virgül ve binlik nokta desteklenir); her ay için tutarlılık kontrolü (ör. yanlış girilmiş fatura, üretimsiz enerji tüketimi); yıllık toplamı tek tıkla hesaplamaya aktarma.
- **Tedarikçi talebi:** öncül malzeme (kütük, slab, tel çubuk) tedarikçisinden AB kurallarına uygun emisyon verisi isteyen hazır mektup (Türkçe / İngilizce).
- **AB veri dosyası:** AB iletişim şablonunun "Summary_Communication" bilgilerine hazırlık; Excel (.xlsx: Summary, Monthly, Sources) ve CSV çıktısı.
- **Proje kaydet / aç:** tüm veriler tek bir JSON dosyasında; veriler bilgisayardan dışarı çıkmaz.

## v2 yenilikleri (v1'e göre)
- Demo faktörler yerine kaynaklı değerler: Türkiye şebeke faktörü (ETKB 2022), Azerbaycan, Kazakistan, Özbekistan, Kırgızistan (Ember 2025), IPCC 2006 yakıt faktörleri.
- AB CBAM kuralları: sektöre göre kapsam (çelik/alüminyumda yalnız doğrudan, çimento/gübrede dolaylı dahil), öncül malzeme, AB varsayılan değeri + işaretleme (2026 %10, 2027 %20, 2028+ %30), ücretsiz tahsis indirimi (kıyas değeri x CBAM faktörü), resmi sertifika fiyatı (Q3 2026: 82,32 €).
- %95 belirsizlik aralığı (veri kaynağına göre: sayaç, fatura, tedarikçi beyanı, tahmin).
- 4 dil: Türkiye Türkçesi, Azerbaycan Türkçesi, Kazakça, İngilizce.
- PDF olarak kaydedilebilen CBAM ön raporu (faktör sürümü ve SHA-256 girdi özeti ile).
- Sunucu gerektirmez: internetsiz (USB'den) çalışır.

## Çalıştırma
- **İnternetsiz:** `index.html` dosyasına çift tıklayın (Chrome veya Edge).
- **Vercel:** vercel.com > Add New > Project > bu klasörü yükleyin (Framework: Other, build komutu yok). Ya da GitHub'a yükleyip Vercel'e bağlayın.

## Testler
`node --test tests/engine.test.js tests/tools.test.js tests/roadmap.test.js` (Node 18+). 23 test: AB varsayılan maliyet örneği, kapsam kuralları, yıl takvimi, hatalı girdiler, belirsizlik, güneş senaryosu, en az 5 firma kuralı, SHA-256, aylık toplam ve anomali kontrolü, CSV okuma, tedarikçi mektubu, AB veri dosyası, dil anahtarları, projeksiyon, önlemler, MACC, OSB toplamları.

## Lisanslar
Excel okuma/yazma için SheetJS Community Edition 0.18.5 (Apache 2.0, vendor klasöründe).

## Not
Örnek tesis verileri kurgusaldır. Resmi CBAM beyanı akredite doğrulayıcı onayı gerektirir.
