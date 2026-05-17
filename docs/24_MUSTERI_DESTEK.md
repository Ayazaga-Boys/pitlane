# 24 — Müşteri Destek

> Kullanıcı sorunları nasıl alınır, kimde takılır, nasıl yanıtlanır.
> Hedef: %95'i 24 saat içinde yanıt, NPS > 40.

---

## 1. Destek Kanalları

| Kanal | Hedef Kitle | Yanıt Süresi |
|---|---|---|
| Uygulama içi "Geri bildirim gönder" | Tüm kullanıcılar | 24 saat |
| `support@rollpit.com` | Tüm kullanıcılar | 24 saat |
| Twitter/X mention | Public sorunlar | 4 saat (mesai içi) |
| App Store / Play Store yorum | Yorum bırakanlar | Haftalık batch |
| `business@rollpit.com` | İşletme hesapları | 12 saat |
| `privacy@rollpit.com` | KVKK/GDPR talepleri | 30 gün (yasal süre) |
| `security@rollpit.com` | Güvenlik açığı bildirimi | 48 saat |

---

## 2. Destek Akışı

```
Kullanıcı şikayeti
   │
   ▼
Linear ticket (otomatik oluşturulur, kanal bazlı tag)
   │
   ▼
Tier 1 — Topluluk Yöneticisi (CM)
   │
   ├──▶ Çözüldü → kullanıcıya yanıt + ticket close
   │
   └──▶ Eskalasyon gerek?
         │
         ▼
       Tier 2 — Geliştirici / Hukuk / Ürün
         │
         └──▶ Çözüldü → kullanıcıya yanıt + post-mortem (gerekirse)
```

---

## 3. Tier 1 — CM Yetki Alanı

CM şu sorulara doğrudan yanıt verir:

- "Nasıl flare oluştururum?" → screenshot + makro yanıt
- "Hesabımı nasıl silerim?" → akış adımları
- "Bildirim almıyorum" → ayar kontrol listesi
- "Bu kullanıcıyı bana mesaj atmaktan nasıl engellerim?" → blok akışı
- "Topluluk kuralları nedir?" → link

CM eskaledir:

- Hesap kurtarma (e-posta yok, OTP gelmiyor)
- İşletme onay sorunu
- Veri dışa aktarma talebi (KVKK)
- Hesap geri yükleme (silme talebi geri çekme)
- Şikayet kararına itiraz
- Ödeme/abonelik (Faz 2'de)

---

## 4. Yanıt Şablonları (Türkçe)

### T1: Hoş Geldin (İlk Kontak)

```
Merhaba [Kullanıcı Adı],

Rollpit'i tercih ettiğin için teşekkürler! Sorununu inceledim.

[Çözüm/yönerge]

Daha fazla yardıma ihtiyacın varsa hiç çekinmeden yaz.

İyi yolculuklar 🏍️🚗
[CM İsmi] - Rollpit Ekibi
```

### T2: Hesap Kurtarma

```
Merhaba,

Hesabına erişim sorunu yaşadığını anladım. Aşağıdaki adımları
deneyebilir misin?

1. E-posta adresini doğru yazdığından emin ol
2. Spam klasörüne bak
3. 60 saniye geçtikten sonra "Yeniden gönder"e bas

Hâlâ çalışmıyorsa, hesabına ait e-postayı bana özel mesajla
yazarsan manuel olarak yardımcı olabilirim.

Rollpit Ekibi
```

### T3: Bildirim Sorunu

```
Merhaba,

Bildirim almama sorunu için:

1. Ayarlar → Bildirimler → Rollpit → tüm toggle'lar açık mı?
2. (iOS) Ayarlar → Bildirimler → Rollpit → "Sürekli Teslim" açık mı?
3. (Android) Pil optimizasyonu Rollpit için kapalı mı?
4. "Sessiz Modu" veya "Rahatsız Etme" açık mı?

Bu adımlardan sonra yine sorun yaşarsan ekran görüntüsü gönderirsen
bakacağız.

Rollpit Ekibi
```

### T4: Yanlışlıkla Banlandığını İddia Eden

```
Merhaba,

Hesap erişim kısıtlaması için yaptığın itirazı aldık. Hesabını
incelemek için 5 iş günü süre rica ediyoruz.

Bu süre içinde topluluk kurallarımızı (link: ...) inceleyebilirsin.

Sonuç hakkında en geç [TARİH] tarihinde sana e-posta ile dönüş yapacağız.

Saygılarımızla,
Rollpit Moderasyon Ekibi
```

### T5: Veri Dışa Aktarma (KVKK)

```
Merhaba,

KVKK kapsamında verilerinin kopyasını talep ettin. Talebini aldık.

İşlem 24 saat içinde tamamlanacak ve sonuçlar e-posta ile sana
ulaştırılacak. Link 48 saat geçerli olacak.

Daha fazla bilgi için: rollpit.com/legal/privacy

Rollpit Ekibi
```

### T6: İşletme Doğrulama Reddi

```
Merhaba [İşletme Sahibi],

İşletme doğrulama başvurunu inceledik ve şu eksiklikler tespit ettik:

- [Eksiklik 1]
- [Eksiklik 2]

Eksiklikleri tamamladıktan sonra başvurunu yeniden gönderebilirsin.
Yardıma ihtiyacın varsa: business@rollpit.com

Rollpit Ekibi
```

### T7: Sahte SOS / Ban Açıklaması

```
Merhaba,

Hesabın şu sebeple kalıcı olarak askıya alındı:
"[Açıklama: örn. sahte yardım çağrısı (15.05.2026 tarihinde)]"

Bu Topluluk Kuralları'mızın 3. maddesini ihlal eder. Sahte yardım
çağrıları gerçek acil durumlardaki yanıt süresini olumsuz etkiler.

İtiraz: privacy@rollpit.com (30 gün içinde)

Rollpit Moderasyon
```

### T8: Apple/Play Store Yorumu (Olumsuz)

```
Merhaba [Kullanıcı Adı],

Rollpit'i denediğin için teşekkürler. Yaşadığın sorun için üzgünüm.

[Sorunun cevabı + adımlar]

Konuyu çözmek için bize support@rollpit.com adresinden ulaşırsan
hızlı yardımcı olabiliriz. Şikayetin haklı bulunursa yorumunu güncellemeyi
düşünür müsün?

Rollpit Ekibi
```

---

## 5. Yanıt Şablonları (English)

### T1-EN: Welcome

```
Hi [Name],

Thanks for choosing Rollpit! I looked into your issue.

[Solution]

Let me know if you need anything else.

Ride safe 🏍️🚗
[CM Name] - Rollpit Team
```

### T7-EN: Suspension Notice

```
Hi,

Your account has been permanently suspended for the following reason:
"[Reason]"

This violates section 3 of our Community Guidelines.

You may appeal: privacy@rollpit.com (within 30 days).

Rollpit Moderation
```

---

## 6. SLA Hedefleri

| Konu | İlk yanıt | Çözüm |
|---|---|---|
| Hesap erişim sorunu | 4 saat | 24 saat |
| Push çalışmıyor | 8 saat | 48 saat |
| Hata raporu (UI bug) | 24 saat | Sıradaki sprint |
| İşletme onay | 24 saat | 48 saat |
| Veri dışa aktarma | 24 saat | 24 saat (otomatik) |
| Hesap silme | 24 saat | 30 gün (yasal süreç) |
| Ban itirazı | 24 saat | 5 iş günü |
| KVKK / GDPR talep | 24 saat | 30 gün (yasal süre) |
| Güvenlik açığı | 12 saat | Severity'ye göre |

---

## 7. SSS (Public — `rollpit.com/help`)

### Hesap & Giriş

**Q: Davet kodu nereden alabilirim?**
A: Bekleme listesine kayıt ol (rollpit.com), kapasite açıldıkça kod gönderiyoruz.

**Q: OTP kodu gelmiyor.**
A: Spam klasörüne bak. 60 sn sonra yeniden gönder. Hâlâ gelmiyorsa: support@rollpit.com

**Q: E-posta adresimi nasıl değiştiririm?**
A: Şu an uygulama içinden değiştirilemez. support@rollpit.com yaz, manuel yapalım.

**Q: Apple ile giriş yapamıyorum.**
A: iOS 13+ gerekli. Apple ID'nde 2FA açık olmalı.

### Konum & Mahremiyet

**Q: Konumum başkalarına gösteriliyor mu?**
A: Hayır. Kimse senin tam GPS'ini göremez. Sadece ~100 metrelik H3 hücresinde olduğun bilgisi paylaşılır, hayalet mod açıkken o da gönderilmez.

**Q: Hayalet mod nasıl açılır?**
A: Profil ikonu → Hayalet Mod toggle. Veya Ayarlar → Mahremiyet → Hayalet Mod.

**Q: Konum izni neden gerekli?**
A: Sana yakındaki etkinlikleri ve yardım taleplerini gösterebilmek için. İzin vermezsen harita çalışmaz ama uygulamanın diğer kısımlarını kullanabilirsin.

### Topluluk & Etkinlik

**Q: Flare nedir?**
A: Anlık veya planlı bir etkinlik. Cruise, buluşma, klasik araba sergisi vb.

**Q: RSVP'mi değiştirebilir miyim?**
A: Evet, etkinlik bitene kadar.

**Q: Topluluğum private — yeni üye nasıl alırım?**
A: Davet linkin var. Topluluk detay → Davet et.

### Acil Yardım

**Q: Yardım çağrım kimseye gitmedi.**
A: 100 m yarıçapında aktif kullanıcı yoksa kimse görmemiş olabilir. 8 dk içinde yanıt almazsan yarıçap genişler. Hâlâ yoksa: 112'yi ara.

**Q: Sahte yardım çağırırsam ne olur?**
A: Hesabın kalıcı olarak banlanır. Bu çok ciddi alıyoruz; gerçek yardım taleplerini olumsuz etkiliyor.

### İşletme

**Q: İşletme hesabı nasıl açılır?**
A: Profil → "İşletmem var" → form. VKN ve vergi levhası gerekir.

**Q: Doğrulama ne kadar sürer?**
A: 48 saat içinde. Eksiklik varsa size mail atarız.

**Q: Pin oluşturma ücretli mi?**
A: V1.0'da ücretsiz. İleride uygun fiyatlı bir plan getirebiliriz; mevcut işletmelere önceden bildirim yapacağız.

### Bildirim

**Q: Bildirim gelmiyor.**
A: Sistem ayarları → Bildirimler → Rollpit → tüm toggle'lar açık. Pil optimizasyonu kapalı (Android).

**Q: Hangi bildirimleri kapatabilirim?**
A: Ayarlar → Bildirimler → kategori bazında toggle.

### Hesap & Veri

**Q: Hesabımı nasıl silerim?**
A: Ayarlar → Hesabı Sil. 30 gün soft-delete, sonra kalıcı silinir.

**Q: Verilerimin kopyasını nasıl alabilirim?**
A: Ayarlar → Veri Dışa Aktarma. 24 saat içinde e-postana JSON link gelir.

**Q: Beni biri taciz ediyor.**
A: O kullanıcının profilinde "..." → Engelle. Mesaj/etkinlikteyse "..." → Şikayet et. 24 saat içinde inceleriz.

### Teknik

**Q: Uygulama çakılıyor.**
A: 1) Tekrar başlat. 2) En son sürüm mü? 3) Cihaz yer kontrolü. 4) support@rollpit.com + sürüm bilgisi.

**Q: Ne kadar veri tüketiyor?**
A: Aktif kullanımda saatte ~10-20 MB. Wi-Fi öneririz.

**Q: Pil tüketimi yüksek.**
A: Konum servisi açık olunca etkili. Hayalet mod ile azaltabilirsin.

---

## 8. Tier 2 Eskalasyon

| Konu | Sorumlu |
|---|---|
| Hesap kurtarma (manuel) | Kişi 2 (Backend) |
| Mobile crash bug | Kişi 1 (Flutter) |
| WS bağlantı sorunu | Kişi 1 (Go) |
| Admin panel hata | Kişi 3 |
| KVKK / hukuk | Hukuk danışmanı |
| Güvenlik açığı | Tüm dev'ler + dış pen-tester |
| Ödeme (Faz 2) | Stripe destek + Kişi 2 |

---

## 9. NPS (Net Promoter Score) Anketi

### Tetik

- Kullanıcı 30 gün aktif olduktan sonra
- Çeyrekte bir kez
- Aktif kullanım sırasında değil (rahatsız edici)

### Anket Sorusu

```
0-10 arası: Rollpit'i bir arkadaşına ne kadar olası tavsiye edersin?

[Cevap]
─────────────────────
Neden bu puanı verdin? (opsiyonel)
[Metin alanı]
```

### Kategori

- 0-6: Detractor
- 7-8: Passive
- 9-10: Promoter

NPS = (% Promoter) - (% Detractor)

Hedef: > 40 (sağlıklı topluluk).

---

## 10. App Store / Play Store Yorum Yönetimi

### İzleme

- Haftalık Pazartesi: yeni yorumları topla.
- Sentiment analizi (manuel veya AI ile basit kategori).

### Yanıt Politikası

- ⭐⭐⭐⭐⭐ : "Teşekkürler!" + emoji
- ⭐⭐⭐⭐ : Spesifik teşekkür + öneri varsa "ekibimize ileteceğim"
- ⭐⭐⭐ : Ne eksik, çözüm önerisi
- ⭐⭐ : Sorun analizi + support@rollpit.com davet
- ⭐ : Kişisel + acil yanıt + iletişim daveti

### Yanıt Süresi

- 1-2 yıldız: 48 saat
- 3 yıldız: 1 hafta
- 4-5 yıldız: 2 hafta

---

## 11. Geri Bildirim Döngüsü

### Linear → Sprint Backlog

CM her hafta:
- Tekrarlayan şikayetleri grupla
- Ürün ekibiyle paylaş (Pazartesi sync)
- Yüksek frekans → backlog'a ekle (priority belirt)

### Trend Tespiti

- 5+ kullanıcı aynı şikayet → "ürün issue" olarak işaretle
- Sentry'ye bağlı olabilir mi? → entegrasyon

---

## 12. Topluluk Forumları (Faz 2)

V1.0'da yok. Gelecekte düşünülen:
- Discord sunucusu (resmi)
- Subreddit (`r/Rollpit`)
- Rollpit Forum (özel — karmaşık tartışma)

---

## 13. Eğitim Materyali

CM için:
- Yeni sürüm changelog (her release)
- Teknik bilgi seviyeleri (TR otomotiv terimleri)
- Empati & profesyonel yanıt training (haftalık örnekler)
- KVKK temel bilgisi (yıllık tazeleme)

---

## 14. Maliyet Tahmini

| Yıl | Kullanıcı | CM ihtiyacı |
|---|---|---|
| Yıl 1 | 25k MAU | 1 tam zamanlı |
| Yıl 2 | 250k MAU | 3 tam zamanlı + 1 senior |
| Yıl 3 | 2M MAU | 8 tam zamanlı + 2 senior + 1 manager |

> CM rolü "Topluluk Yöneticisi" hibrit (sosyal medya + destek). Faz 3'te ayrılır.

---

## 15. Mevzuata Uyum (Tüketici Mevzuatı)

- Türkiye Tüketici Hakem Heyeti talepleri: 30 gün içinde yanıt zorunlu.
- Resmi yazışma için: privacy@rollpit.com + posta adresi.
- Müşteri Şikayeti Çözümleme Politikası web'de yayınlı: rollpit.com/legal/complaints
