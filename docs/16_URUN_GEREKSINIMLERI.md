# 16 — Ürün Gereksinimleri (PRD)

> Her özelliğin "kim, ne, neden, nasıl" detayı. `01_PROJE_GENEL_BAKIS.md`'deki MVP listesinin uygulama detayı.
> Geliştirici, tasarımcı ve QA için tek doğruluk kaynağı: bir özellik bittiğinde bu dosyadaki kabul kriterlerinin hepsi yeşil olmalı.

---

## 0. Persona Detayı

### P1 — Mert (24, motorcu)
- Honda CB650R sahibi, İstanbul Anadolu yakası.
- Hafta sonu cruise düzenliyor, WhatsApp grubu yorucu.
- **İhtiyaç:** Bir tek dokunuşta kolay etkinlik paylaşımı + harita üzerinde topluluk.

### P2 — Selin (32, klasik araba sahibi)
- 1985 BMW E30, garaj ve klasik buluşmalar.
- Topluluğu var ama yeni üyeler bulmakta zorlanıyor.
- **İhtiyaç:** Şehirdeki benzer araç sahiplerini bulma, havalı bir profil sunumu.

### P3 — Cem (40, yolda kalan sürücü)
- Sıradan binek araç, periyodik kullanıcı.
- Yolda kaldı, yardım çağırma süreci stresli.
- **İhtiyaç:** Tek dokunuşta yakınındaki kullanıcıya/tamirciye sinyal.

### P4 — Yetkin Oto Tamircisi (işletme)
- Bağımsız garaj sahibi, dijital pazarlama bütçesi sınırlı.
- **İhtiyaç:** Bölgedeki sürücülere uygun maliyetli görünürlük + kampanya.

### P5 — Aslı (29, etkinlik organizatörü)
- "Istanbul Cars & Coffee" düzenliyor, 200+ katılımcı.
- **İhtiyaç:** RSVP, harita, planlı etkinlik panosu.

---

## 1. Onboarding & Hesap

### F1.1 — Davetli Kayıt (V1.0)

**Kullanıcı hikayesi:** Bir tutkun olarak, davet kodu ile uygulamayı denemek istiyorum.

**Akış:**
1. Açılış ekranı → "Davet kodun var mı?" sorusu.
2. Davet kodu girilir → Supabase'de doğrulanır (`invite_codes` tablosu).
3. Geçerliyse e-posta giriş ekranına geçer.
4. Geçersizse "Bekleme listesine katıl" CTA → e-posta + araç tipi alır.

**Kabul Kriterleri:**
- Davet kodu büyük/küçük harf duyarsız.
- Aynı kod 50 kullanımdan sonra geçersiz olur.
- Bekleme listesi `waiting_list` tablosuna yazar (KVKK uyumlu, e-posta + araç tipi + il).

### F1.2 — E-posta + OTP Giriş

**Kabul Kriterleri:**
- E-posta gönderildi mesajından sonra OTP girme alanı açılır.
- 6 haneli kod, 10 dk geçerli.
- 3 yanlış denemede 5 dk lock.
- Yeniden gönder: 60 sn cooldown.
- OTP doğru → `profiles` triggerı yeni satır oluşturur, profil tamamlama akışı başlar.

### F1.3 — Apple / Google ile Giriş

- iOS'ta "Apple ile Giriş" zorunludur (App Store kuralı, e-posta sağlayıcı varsa Apple da olmalı).
- Google sadece Android için zorunlu, iOS'ta opsiyonel.

### F1.4 — Profil Tamamlama (Yeni Kullanıcı)

İlk girişte zorunlu adımlar:

```
1. Kullanıcı adı seç (3-20, harf+rakam+_, benzersiz)
2. Görünür ad (2-50)
3. Avatar yükle veya atla
4. Birinci aracını ekle (tip, marka, model, yıl)
5. Konum izni rationale → izin iste
6. Bildirim izni rationale → izin iste
7. Topluluk kuralları onayı (zorunlu, link 18_TOPLULUK_KURALLARI.md)
```

**Kabul:**
- Adımları kullanıcı atlayabilir (avatar, araç hariç min. 1).
- Hat çizgisi (linear progress) ile ilerleme görülür.
- Cihaz çevrimdışıyken kayıt kuyruğa alınır, çevrimiçi olunca sync.

---

## 2. Harita & Canlı Yoğunluk

### F2.1 — Ana Harita Ekranı

**Kullanıcı hikayesi:** Açılışta haritada kendi konumumu ve etrafımdaki aktiviteyi görmek istiyorum.

**Layout:**
```
┌─────────────────────────────┐
│  🔍 Ara          🎚️ Filtre │  ← üst bar
├─────────────────────────────┤
│                             │
│    [Google Maps]            │
│    🔥 ısı katmanı           │
│    📍 flare pinleri         │
│    🏪 işletme pinleri       │
│    🚨 yardım pinleri        │
│                             │
│              ┌────┐         │
│              │ 📷 │         │  ← snap kamera FAB
│              └────┘         │
│              ┌────┐         │
│              │SOS │         │  ← acil yardım butonu
│              └────┘         │
└─────────────────────────────┘
```

**Kabul Kriterleri:**
- İlk frame < 1.2 sn.
- 200+ pin render < 16 ms (60 fps).
- Zoom seviyesi 13'ten yakın → res-9 cell, uzak → res-8 cell.
- Heatmap WS güncellemesi 200 ms içinde yansır.
- Çevrimdışıyken son cache + "İnternet yok" banner.

### F2.2 — Filtreler

| Filtre | Seçenek | Default |
|---|---|---|
| Araç tipi | Hepsi / Otomobil / Motosiklet | Hepsi |
| Etkinlik | Yakındaki / Bugün / Hafta sonu | Yakındaki |
| Pin tipi | Topluluk / İşletme / Yardım | Hepsi |

Filtre değişimi anında haritayı yeniden render eder; URL durumu `GoRouter` query parametresine yazılır.

### F2.3 — Hayalet Mod

**Kabul Kriterleri:**
- Toggle profil ayarlarında VE harita üzerinde quick-action butonunda.
- Açılınca: WS'e `ghost_on` mesajı, Valkey kaydı silinir, Flutter konum stream'i durur.
- Profil/harita üzerinde küçük "👻" rozeti gösterilir.
- Hayalet modda mesaj/RSVP gönderilebilir; yalnızca konum gizlenir.

---

## 3. Topluluklar

### F3.1 — Topluluk Keşfi

**Akış:**
- "Topluluklar" sekmesi → şehre ve araç tipine göre filtreli liste.
- Üye sayısı, son aktivite, doğrulama rozeti görünür.
- Arama: ad, slug, açıklama içinde.

**Kabul Kriterleri:**
- 1000 topluluk için < 300 ms ilk yükleme.
- Cursor pagination (20'şer).
- Arama 300 ms debounce.

### F3.2 — Topluluk Oluşturma

**Adımlar:**
1. Ad → otomatik slug önerisi (boşluk → tire, küçük harf).
2. Tip seç (public/private/secret).
3. Araç tipi (car/motorcycle/all).
4. Şehir, açıklama, kapak.
5. Onay → `POST /v1/communities`.

**Kabul:**
- Slug benzersizlik kontrolü canlı (debounced).
- Kapak görseli opsiyonel; medya pipeline ile yüklenir.
- Oluşturan otomatik `captain` rolünde üye olur.

### F3.3 — Üye Yönetimi

| Rol | Yetki |
|---|---|
| `captain` | Tüm yetkiler, rol atama, topluluk silme |
| `moderator` | Üye çıkarma, mesaj silme, flare oluşturma |
| `member` | Mesaj, RSVP, görüntüleme |

---

## 4. Flares (Etkinlikler)

### F4.1 — Flare Oluşturma

**Akış:**
1. Haritadan konum seç (uzun bas → pin) veya "buradan oluştur".
2. Form: başlık, açıklama, başlangıç, bitiş (ops.), kapak.
3. (Ops.) bir topluluğa bağla.
4. Yayınla → harita üzerinde anında pin.

**Kabul Kriterleri:**
- Konum → H3 res-9 hücresine yuvarlanır (ham GPS gönderilmez).
- Başlangıç ≥ şu an + 5 dk; geçmiş tarih kabul edilmez.
- Aynı kullanıcıdan günde max `max_flares_per_user_day` (remote_configs).

### F4.2 — RSVP

- "Gidiyorum / Belki / Gitmiyorum" üç durum.
- Kullanıcı RSVP'sini değiştirebilir; en son durum sayılır.
- "Gidiyorum" diyenlere etkinlik 1 saat öncesinde push bildirimi.

### F4.3 — Flare Sohbeti

- Ayrı sohbet odası, sadece RSVP'si "going" olanlar mesaj atabilir.
- Etkinlik bittikten 24 saat sonra read-only olur, 7 gün sonra arşivlenir.

---

## 5. Acil Yardım

### F5.1 — Yardım Talebi Açma

**Kullanıcı hikayesi:** Yolda kaldım, en yakındaki yardımı çağırmak istiyorum.

**Akış (3 dokunuş kuralı):**
1. Harita üzerinde SOS butonu.
2. Sorun tipi seç (breakdown / flat_tire / fuel / accident / other).
3. (Ops.) açıklama → Gönder.

**Kabul Kriterleri:**
- 3. dokunuştan max 1 sn sonra `POST /v1/help` cevabı dönmeli.
- Konum → H3 res-9.
- Trigger.dev job: aynı hücre + k-ring 2 içindeki aktif kullanıcılara push.
- Talep durumu real-time güncellenir (Supabase Realtime).
- 2 saat sonra otomatik `expired` olur.
- "Yanıma araç çağır" değil; "yakındaki gönüllü/tamirci" odaklı.

### F5.2 — Yardım Et

- Push bildirimi → tek tap → talep detayı.
- "Yardım edeceğim" → talep `helper_found` olur, 1-1 sohbet açılır.
- İlk gelen kazanır (atomic update).
- Yardım eden kullanıcının rotası iptal edilebilir; talep tekrar `open` olur.

### F5.3 — Sahte Talep Koruması

- Saatte max `max_help_per_user_hour` (remote_configs).
- Aynı H3 hücresinden son 1 saat içinde 2'den fazla talep → manuel review (admin).
- 10 farklı kullanıcı tarafından şikayet edilmiş kullanıcı → otomatik ban.

---

## 6. İşletme Pinleri

### F6.1 — İşletme Hesabı Oluşturma

**Akış:**
1. Profil → "İşletmem var" → işletme bilgileri formu.
2. Ad, kategori, vergi numarası (Türkiye için VKN), iletişim.
3. Belge yükle (vergi levhası fotoğrafı).
4. Admin onayı bekler (`is_verified = false`).
5. Onay → harita pininde "✓ Doğrulanmış" rozeti.

**Kabul:**
- VKN format kontrolü (10 hane).
- Belge sadece admin paneli üzerinden görüntülenir, R2'de privat saklanır.
- Onay süresi hedefi: 48 saat.

### F6.2 — Kampanya

- "Bugün %20 indirim" gibi sabit metin (max 200 karakter).
- Bitiş tarihi zorunlu (max 30 gün).
- Kampanyalı pin haritada `pit-red-soft` arka planlı badge ile vurgulanır.
- 30 günde max 4 kampanya (kötüye kullanım koruması).

### F6.3 — "Yol Tarifi Al"

- Pin detayında buton → Google Maps / Apple Maps deep link.
- Konum: pinin H3 hücresinin merkez koordinatı.

---

## 7. Mesajlaşma

### F7.1 — DM (1-1 Sohbet)

**Kabul Kriterleri:**
- Engellenen kullanıcılar mesaj atamaz, mesaj listesinde görünmez.
- Engellenmemiş kullanıcı atarsa mesaj inbox'a düşer.
- Mesajlar Supabase Realtime ile anlık.
- Offline mesaj kuyruğu (Flutter) → çevrimiçi olunca gönderir.
- Tip indikatörü (typing): Realtime presence channel.
- Görüldü işareti (read receipt): kullanıcı toggle'lı (varsayılan açık).

### F7.2 — Topluluk / Flare / Yardım Sohbeti

- Topluluk: tüm üyeler.
- Flare: sadece RSVP'si "going" olanlar.
- Yardım: requester + helper (1-1).

### F7.3 — Mesaj İçeriği

| İçerik | Limit |
|---|---|
| Metin | 2000 karakter |
| Fotoğraf | 1 adet, 20 MB öncesi sıkıştırma |
| Video | 1 adet, 15 sn, 50 MB |
| Sesli mesaj | 60 sn, opus codec |

---

## 8. Snap Kamera

### F8.1 — Foto / Video Çekimi

**Akış:**
1. Harita üstündeki kamera FAB → kamera ekranı.
2. Foto veya 15 sn video.
3. Filtre seçimi (otomotiv overlay'ler):
   - Hız göstergesi (sahte/gerçek hız — GPS'ten)
   - Vites göstergesi
   - Pusula
   - Renk LUT'ları (cinematic, vintage, warm)
4. (Ops.) etiketleme: araç markası, topluluk.
5. Paylaş: Profil feed / topluluk / flare.

**Kabul Kriterleri:**
- Çekim sırasında konum izni varsa hız overlay'ine GPS hız aktarılır (km/h).
- "Sürerken kullanma" uyarısı: araç hareketliyse (>10 km/h) recording disabled.
- Kayıt sonrası presigned URL ile direkt R2'ye yüklenir.
- Yükleme arka planda devam eder; kullanıcı uygulamayı kapatamaz mesajı + indikator.

### F8.2 — Snap Akışı

V1.0'da kullanıcı feed'i yok; çekilen içerik:
- Profil galerisinde görünür.
- Bir flare'e bağlanmışsa flare detayında.
- DM'de paylaşılırsa sohbete embed.

> Genel feed Faz 2'de eklenir.

---

## 9. Bildirimler

Detaylı bildirim taksonomisi `20_BILDIRIM_STRATEJI.md` dosyasındadır. Burası ürün gereksinimi.

| Bildirim | Hedef | Tetik |
|---|---|---|
| Yardım çağrısı (yakında) | k-ring 2 içindeki aktif kullanıcılar | Yardım talebi açılınca |
| Flare daveti | Topluluk üyeleri | Flare oluşturulduğunda |
| RSVP güncellemesi | Flare oluşturan | Yeni RSVP gelince |
| Yeni mesaj | Alıcı | DM/topluluk/flare/help'te yeni mesaj |
| Topluluk daveti | Davet edilen | Davet linki tıklanınca |

---

## 10. Ayarlar & Mahremiyet

### F10.1 — Ayarlar Menüsü

```
Hesap
  ├ Profil düzenle
  ├ Araçlarım
  └ Hesabı sil
Mahremiyet
  ├ Hayalet mod
  ├ Engellenen kullanıcılar
  ├ Görüldü işareti (toggle)
  └ Veri dışa aktarma
Bildirim
  ├ Genel toggle
  ├ Yardım çağrısı (yakında)
  ├ Flare daveti
  └ Mesaj
Uygulama
  ├ Tema (V1.0 sabit dark)
  ├ Dil (TR / EN)
  └ Sürüm bilgisi
Yasal
  ├ Topluluk kuralları
  ├ Gizlilik politikası
  ├ Kullanım koşulları
  └ Açık kaynak lisansları
Destek
  ├ SSS
  ├ İletişim (mailto)
  └ Geri bildirim gönder
```

### F10.2 — Hesap Silme

**Kabul Kriterleri (Apple Guideline 5.1.1(v)):**
- Ayarlar > Hesabı Sil yoluyla erişilebilir.
- 2 adımlı onay (uyarı + parola/OTP teyidi).
- Onay sonrası:
  - Profil 30 gün soft-delete (kullanıcı vazgeçebilir).
  - 30 gün sonra:
    - `auth.users` silme
    - Mesajlar anonim (`username = deleted_<uuid>`)
    - Medya R2'den silinir (Trigger.dev job)
    - Konum kaydı Valkey'den silinir
- E-posta ile teyit + iptal linki gönderilir.

### F10.3 — Veri Dışa Aktarma (GDPR Madde 20)

- Kullanıcı tek tıkla `GET /v1/profiles/me/export` çağırır.
- Trigger.dev job arka planda JSON arşivi oluşturur.
- 24 saat içinde e-posta ile presigned R2 link (48 saat geçerli).

### F10.4 — Şikayet & Engelleme

- Her içerik kartında "..." menüsü → Şikayet et / Engelle.
- Şikayet sebep listesi: `spam, harassment, inappropriate, fake, other`.
- Engelle: anında uygulanır, karşı tarafa bildirim yok.

---

## 11. Sürüm Yönetimi & Force Update

### F11.1 — Min. Sürüm Kontrolü

- App açılışta `GET /v1/config` çağrılır.
- `min_supported_app_version` < cihaz sürümü → bloklayıcı modal:
  - "Yeni sürüm zorunlu" + App Store / Play Store linki.
  - Devam edilemez.
- Cihaz sürümü `package_info_plus` ile alınır.

### F11.2 — Yumuşak Güncelleme Önerisi

- Yeni sürüm var ama zorunlu değil → açılışta dismissable banner.
- 7 gün sonra tekrar gösterilir.

---

## 12. Kabul Kriterleri Özeti

| Özellik | Sprint | Kabul Kriteri Sayısı |
|---|---|---|
| Onboarding | S1 | 12 |
| Harita & Heatmap | S2 | 10 |
| Topluluklar | S3 | 8 |
| Flares | S3 | 9 |
| Acil Yardım | S5 | 11 |
| İşletme Pin | S5 | 7 |
| Mesajlaşma | S4 | 9 |
| Kamera | S6 | 6 |
| Bildirim | S4 | 5 |
| Ayarlar | S6 | 8 |

> Her kabul kriteri için E2E veya integration test bağlantılı olmalı (`13_TEST_KALITE.md`).
