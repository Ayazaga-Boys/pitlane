# 17 — KVKK & GDPR Gizlilik Politikası

> Bu dosya **iki şey** içerir:
> 1. **Yasal şablon (TR + EN)**: App Store / Play Store ve uygulama içine konacak gizlilik politikasının metni. Hukuk danışmanı tarafından son review yapılmadan yayına alınmaz.
> 2. **Geliştirici checklist'i**: Bu metnin uygulamadaki davranışla %100 örtüştüğünden emin olmak için.

> URL (yayında olacak): `https://rollpit.com/legal/privacy`
> Son güncelleme: yayın tarihinden 24 saat önce.

---

## 0. Geliştirici Checklist (Önce Bunu Doğrula)

Aşağıdaki maddeler `06_GUVENLIK_MAHREMIYET.md` ile birebir uyumlu olmalı:

- [ ] Ham GPS koordinatı hiçbir tabloda persist edilmiyor (DB grep kontrolü)
- [ ] Konum yalnızca H3 hücresi (res-9) olarak Valkey'de TTL=5 dk ile tutuluyor
- [ ] Hayalet modda Valkey'deki kayıt anında siliniyor
- [ ] Hesap silme akışı 30 gün sonra hard-delete yapıyor (Trigger.dev cron'u test edildi)
- [ ] Veri dışa aktarma JSON arşivi tüm kullanıcı verisini içeriyor (mesajlar, flare, RSVP, vehicles, blocks, reports)
- [ ] Push token logout'ta siliniyor (`DELETE /v1/notifications/devices/:token`)
- [ ] Reklam SDK'sı yok (firebase_messaging hariç hiçbir 3rd party tracker)
- [ ] PostHog kişiyi tanımlayan PII içermiyor (`distinctId = profiles.id`, e-posta yok)
- [ ] Sentry'de PII filtreleme aktif (Beforesend hook)
- [ ] App Store Privacy Nutrition Label dolduruldu (`14_DAGITIM_YAYIN.md`)
- [ ] Google Play Data Safety formu dolduruldu (`14_DAGITIM_YAYIN.md`)
- [ ] iOS NSLocationWhenInUseUsageDescription metni Türkçe + İngilizce
- [ ] Android Manifest izinleri (ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, CAMERA, RECORD_AUDIO) gerekçeli

---

## 1. Türkçe Şablon — Rollpit Gizlilik Politikası

> **NOT:** Bu metin teknik gerçeklikle hizalı bir taslaktır. Yayına almadan önce KVKK uzmanı bir avukatın onayından geçmesi zorunludur.

```
ROLLPIT GİZLİLİK POLİTİKASI
Yürürlük tarihi: [YAYIN TARİHİ]

1. VERİ SORUMLUSU

Bu uygulamayı işleten "[ŞIRKET TİCARET ÜNVANI]" ("Rollpit", "biz")
6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında
veri sorumlusu sıfatıyla kişisel verilerinizi işlemektedir.

İletişim: privacy@rollpit.com
Adres: [ŞIRKET ADRESİ]

2. İŞLENEN KİŞİSEL VERİLER

A) Kayıt sırasında topladıklarımız
   - E-posta adresi
   - Kullanıcı adı, görünen ad
   - Profil fotoğrafı (opsiyonel)
   - Araç bilgileri: tip, marka, model, yıl, renk (opsiyonel)

B) Hizmet kullanımı sırasında topladıklarımız
   - Yaklaşık konum (H3 hücre, ~100 m kapsama; ham GPS değil)
   - Cihaz türü ve işletim sistemi sürümü
   - Uygulama içi etkileşim verileri (sayfa görüntüleme, butona tıklama)
   - Push bildirim cihaz token'ı (FCM/APNs)
   - IP adresi (sadece güvenlik logları için, 30 gün sonra silinir)

C) Kullanıcı tarafından oluşturulan içerik
   - Mesajlar
   - Etkinlik ("flare") detayları
   - Yüklenen fotoğraf/videolar
   - Şikayet bildirimleri

D) İşletme hesabı için ek veriler
   - Vergi numarası (VKN/TCKN)
   - İşletme belgesi (vergi levhası)
   - İletişim telefonu, web sitesi

3. İŞLEME AMAÇLARI VE HUKUKİ SEBEPLER

| Amaç | Hukuki Sebep (KVKK m.5) |
|---|---|
| Hesap oluşturma ve sürdürme | Sözleşmenin ifası (m.5/2/c) |
| Yaklaşık konum bazlı eşleştirme | Açık rıza (m.5/1) |
| Acil yardım sinyali yayını | Açık rıza + temel hak ve özgürlüklerin korunması (m.5/2/d) |
| Hizmet iyileştirme (analitik) | Meşru menfaat (m.5/2/f) |
| Yasal yükümlülükler (vergi, savcılık talebi) | Hukuki yükümlülük (m.5/2/ç) |
| Pazarlama iletişimi | Açık rıza (ayrıca, opt-in) |

4. KONUM VERİSİ — ÖZEL HÜKÜM

Rollpit konum gizliliğini varsayılan olarak korur:
   - Cihazınızdan alınan ham GPS koordinatı sunucularımıza GÖNDERİLMEZ.
   - Koordinatınız cihazınızda ~100 metrelik H3 altıgen hücresine yuvarlanır;
     yalnızca bu hücre kimliği iletilir.
   - Hücre bilgisi sunucu hafızasında 5 dakika TTL ile tutulur, kalıcı veritabanında saklanmaz.
   - "Hayalet Mod" açıkken konum bilgisi hiç gönderilmez ve sunucudaki kayıt anında silinir.
   - Acil yardım talebi açtığınızda hücre kimliği talep süresince paylaşılır;
     ham koordinat yine paylaşılmaz.

5. VERİLERİN PAYLAŞIMI

A) Hizmet sağlayıcılar (veri işleyenler)
   - Supabase (Avrupa Birliği): kimlik doğrulama, veritabanı
   - Cloudflare: CDN, medya saklama (R2), video transcode
   - Fly.io (AB): API ve realtime sunucuları
   - Upstash (AB): konum hücresi geçici store (Valkey)
   - Trigger.dev: arka plan iş süreci
   - Firebase Cloud Messaging / Apple Push Notification Service: bildirim
   - Sentry: hata kayıtları (PII filtrelenmiş)
   - PostHog: analitik (PII filtrelenmiş)

B) Yetkili merciler
   - Mahkeme/savcılık talebi üzerine ve yalnızca yasal sınırlar içinde paylaşılır.

C) Pazarlama / Reklam
   - Üçüncü taraf reklam ağlarıyla VERİ PAYLAŞIMIMIZ YOKTUR.

6. VERİLERİN YURT DIŞINA AKTARIMI

Bazı hizmet sağlayıcılarımız (örn. Cloudflare) altyapılarını AB ve diğer ülkelerde
işletmektedir. Bu aktarımlar:
   - KVKK m.9 kapsamında yeterli koruma bulunan ülkelerde yapılır veya
   - Standart sözleşme maddeleri (SCC) ile güvence altına alınır.

7. SAKLAMA SÜRELERİ

| Veri | Süre |
|---|---|
| Hesap bilgisi (aktif kullanıcı) | Hesap silinene kadar |
| Hesap silinince | 30 gün soft-delete, sonra anonimleştirme |
| Mesajlar | DM: hesap kapatılana kadar; etkinlik: 90 gün; yardım: 180 gün |
| Konum hücresi (Valkey) | 5 dakika |
| IP adresi (güvenlik) | 30 gün |
| Yedekler | 90 gün, sonra silinir |

8. HAKLARINIZ (KVKK m.11)

Aşağıdaki haklara sahipsiniz:
   - Kişisel verilerinizin işlenip işlenmediğini öğrenme
   - İşlenmişse buna ilişkin bilgi talep etme
   - İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
   - Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme
   - Eksik/yanlış işlenmişse düzeltilmesini isteme
   - Silinmesini veya yok edilmesini isteme
   - Düzeltme/silme/yok etme işlemlerinin ilgili 3. taraflara bildirilmesini isteme
   - Otomatik analiz sonucu aleyhinize çıkan sonuca itiraz etme
   - Zarar görmüşseniz tazminat talep etme

Bu haklarınızı kullanmak için:
   - Uygulama içi: Ayarlar > Veri Dışa Aktarma / Hesabı Sil
   - E-posta: privacy@rollpit.com
   30 gün içinde yanıt veririz.

9. GÜVENLİK ÖNLEMLERİ

   - Tüm veri trafiği TLS 1.3 ile şifrelidir.
   - Veritabanında "Row Level Security" politikaları aktiftir.
   - Şifreler bcrypt ile hash'lenir.
   - Düzenli güvenlik penetrasyon testleri yapılır.
   - 2 faktörlü kimlik doğrulama (admin paneli için zorunlu).

10. ÇEREZLER

Mobil uygulamada çerez kullanılmaz. Web admin paneli yalnızca oturum çerezi
(supabase-auth-token) kullanır; analitik/reklam çerezi yoktur.

11. ÇOCUKLARIN GİZLİLİĞİ

Rollpit 18 yaş üstü kullanıcılar içindir. 18 yaş altı bir kullanıcının kayıt
olduğunu fark edersek hesabı geçici olarak kilitler ve yasal vasi onayını
talep ederiz; alınmazsa hesap silinir.

12. POLİTİKADAKİ DEĞİŞİKLİKLER

Politikayı değiştirebiliriz. Önemli değişiklikler için 30 gün önceden
e-posta ve uygulama içi bildirimle haber veririz.

13. İLETİŞİM

privacy@rollpit.com
[ŞIRKET ADRESİ]
Veri Sorumlusu Sicil Bilgi Sistemi (VERBIS) numarası: [VERBIS NO]
```

---

## 2. English Template — Rollpit Privacy Policy

```
ROLLPIT PRIVACY POLICY
Effective date: [LAUNCH DATE]

1. CONTROLLER

This app is operated by "[COMPANY LEGAL NAME]" ("Rollpit", "we").
We act as data controller under the EU General Data Protection Regulation (GDPR)
and Turkey's KVKK Law no. 6698.

Contact: privacy@rollpit.com
Address: [COMPANY ADDRESS]
EU representative (if applicable): [APPOINTED REP]

2. DATA WE COLLECT

A) On registration: email, username, display name, optional avatar, vehicle info.
B) During use: approximate location (~100 m H3 hex cell, never raw GPS), device
   type/OS, in-app interactions, push device token, IP (security logs, 30 days).
C) User-generated content: messages, flares (events), uploaded media, reports.
D) Business accounts: tax ID, business document, contact info.

3. PURPOSES AND LEGAL BASES (GDPR Art. 6)

| Purpose | Legal basis |
|---|---|
| Account operation | Contract (Art. 6(1)(b)) |
| Approximate location matching | Consent (Art. 6(1)(a)) |
| Emergency help broadcast | Consent + vital interests (Art. 6(1)(d)) |
| Service improvement (analytics) | Legitimate interests (Art. 6(1)(f)) |
| Legal obligations | Art. 6(1)(c) |
| Marketing | Consent (separate opt-in) |

4. LOCATION — SPECIAL CLAUSE

Rollpit is built on location privacy by default:
   - Raw GPS coordinates are NEVER sent to our servers.
   - Coordinates are bucketed into ~100 m H3 hexagonal cells on-device;
     only the cell ID is transmitted.
   - Cell IDs reside in server memory with 5-minute TTL only.
   - "Ghost Mode" stops transmission and deletes any prior record immediately.
   - During an active help request, your cell ID is shared until resolved;
     the raw GPS is never shared.

5. DATA SHARING

A) Processors:
   - Supabase (EU): auth + database
   - Cloudflare: CDN, media (R2), video transcoding
   - Fly.io (EU): API and realtime hosting
   - Upstash (EU): location cell ephemeral store
   - Trigger.dev: background job orchestration
   - FCM / APNS: push notifications
   - Sentry: error tracking (PII-stripped)
   - PostHog: analytics (PII-stripped)

B) Authorities: only on lawful request.
C) Advertising networks: NONE.

6. INTERNATIONAL TRANSFERS

Some processors operate outside the EEA. Such transfers rely on Standard Contractual
Clauses (SCCs) and supplementary measures.

7. RETENTION

| Data | Retention |
|---|---|
| Active account | Until deleted |
| After deletion | 30-day grace, then anonymized |
| Messages (DM) | Until account deletion |
| Messages (events) | 90 days post-event |
| Messages (help) | 180 days post-resolution |
| Location cell (Valkey) | 5 minutes |
| IP logs | 30 days |
| Backups | 90 days |

8. YOUR RIGHTS

Under GDPR you have rights to access, rectification, erasure ("right to be
forgotten"), restriction, portability, objection, and lodging a complaint with
your supervisory authority. To exercise: in-app Settings > Export / Delete or
email privacy@rollpit.com. We respond within 30 days.

9. SECURITY

TLS 1.3 transport, Postgres Row Level Security, bcrypt-hashed credentials,
2FA on admin panel, periodic security testing.

10. COOKIES

The mobile app does not use cookies. The admin panel uses a session cookie only.

11. CHILDREN

Rollpit is for users 18+. Underage accounts are locked and removed unless verified.

12. CHANGES

We notify material changes 30 days in advance via email and in-app.

13. CONTACT

privacy@rollpit.com
[COMPANY ADDRESS]
```

---

## 3. App Store Privacy Nutrition Label

| Data Type | Linked to User? | Used for Tracking? | Purposes |
|---|---|---|---|
| Email | Yes | No | App Functionality |
| Name | Yes | No | App Functionality |
| User ID | Yes | No | App Functionality, Analytics |
| Coarse Location (H3) | Yes | No | App Functionality |
| Photos / Videos | Yes | No | App Functionality |
| Audio Data (sesli mesaj) | Yes | No | App Functionality |
| Customer Support | Yes | No | App Functionality |
| Crash Data | No | No | App Functionality |
| Performance Data | No | No | Analytics |
| Other Diagnostic Data | No | No | Analytics |

> "Precise Location" KESİNLİKLE seçilmemeli. Rollpit GPS'i precise olarak iletmiyor.

---

## 4. Google Play Data Safety Form

| Data | Collected | Shared | Optional |
|---|---|---|---|
| Approximate location | ✅ | ❌ | ❌ |
| Precise location | ❌ | ❌ | — |
| Name | ✅ | ❌ | ❌ |
| Email address | ✅ | ❌ | ❌ |
| User IDs | ✅ | ❌ | ❌ |
| Photos | ✅ | ❌ | ✅ |
| Videos | ✅ | ❌ | ✅ |
| Voice or sound recordings | ✅ | ❌ | ✅ |
| Messages | ✅ | ❌ | ❌ |
| Crash logs | ✅ | ❌ | ❌ |
| Diagnostics | ✅ | ❌ | ❌ |
| App interactions | ✅ | ❌ | ❌ |

**Security practices:**
- ✅ Data is encrypted in transit
- ✅ You can request data be deleted
- ✅ Independent security review

---

## 5. iOS Info.plist Açıklamaları (TR + EN)

```xml
<!-- ios/Runner/Info.plist -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Rollpit, etrafındaki etkinlikleri ve yardım taleplerini gösterebilmek için yaklaşık konumunu (~100 m doğruluk) kullanır. Tam GPS koordinatın hiçbir zaman sunucuya gönderilmez.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Rollpit, sen uygulamayı kullanmıyorken bile yakındaki acil yardım taleplerini bildirebilmesi için yaklaşık konumunu kullanabilir. Hayalet modu istediğin zaman açabilirsin.</string>

<key>NSCameraUsageDescription</key>
<string>Snap kamera ile fotoğraf ve video çekmek için kameraya erişim izni gereklidir.</string>

<key>NSMicrophoneUsageDescription</key>
<string>Video kaydı ve sesli mesajlar için mikrofon erişimi gereklidir.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Profil avatarın ve paylaşımların için fotoğraf seçmek üzere galeri erişimi gereklidir.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>Snap ile çektiğin fotoğraf ve videoları cihaz galerine kaydetmek için izin gereklidir.</string>
```

---

## 6. Android Permissions (Gerekçeli)

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>

<!-- Konum: yaklaşık (coarse) yeterli; precise opsiyonel -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>

<!-- Kamera + ses -->
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.RECORD_AUDIO"/>

<!-- Bildirim (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

<!-- Galeri (Android 13+) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO"/>
```

> Rollpit `ACCESS_BACKGROUND_LOCATION` istemez (V1.0). Acil yardım sinyali ekran açıkken çalışır.

---

## 7. Sentry PII Filtreleme

```typescript
// apps/backend/src/index.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  beforeSend(event) {
    // E-posta, IP gibi PII'yı temizle
    if (event.user) {
      event.user.email = undefined;
      event.user.ip_address = undefined;
    }
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },
});
```

```dart
// apps/mobile/lib/main.dart
await SentryFlutter.init((options) {
  options.beforeSend = (event, hint) async {
    return event.copyWith(
      user: event.user?.copyWith(email: null, ipAddress: null),
    );
  };
});
```

---

## 8. PostHog PII Filtreleme

- `distinct_id` = `profiles.id` (UUID, doğrudan PII değil)
- E-posta gönderilmez.
- Mesaj içeriği event olarak gönderilmez (sadece mesaj sayısı/uzunluğu).
- Konum gönderilmez (H3 dahil).

```dart
// PostHog event örneği — sadece sayım
PostHog().capture(eventName: 'flare_created', properties: {
  'community_linked': communityId != null,
  'has_cover': coverUrl != null,
  // ❌ Yasak: 'h3_cell', 'title', 'lat', 'lng'
});
```

---

## 9. KVKK Aydınlatma Metni Konumlandırması

Uygulamada gizlilik politikasına bağlantı şu yerlerde olmalı:
- Onboarding > "Topluluk Kuralları onay" ekranı
- Ayarlar > Yasal > Gizlilik Politikası
- Bekleme listesi formu altı
- App Store / Play Store mağaza sayfası

Erişim 1 dokunuş içinde olmalı (Apple Guideline 5.1.2).

---

## 10. Yıllık Gözden Geçirme

Her yıl Mayıs ayında bu dosya:
1. Hukuk danışmanı tarafından review edilir.
2. Yeni servis sağlayıcılar listesi güncellenir.
3. Saklama sürelerinin koda uygunluğu doğrulanır.
4. KVKK / GDPR mevzuat değişiklikleri kontrol edilir.
5. Versiyon notu hazırlanır, kullanıcılara bildirilir.
