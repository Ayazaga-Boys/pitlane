# 19 — Kullanıcı Akışları (User Flows)

> Her kritik kullanıcı senaryosunun adım adım akışı, edge case'leri ve hata durumları.
> `16_URUN_GEREKSINIMLERI.md`'deki kabul kriterlerinin görsel/metinsel haritası.

---

## 1. UF-01 — İlk Açılış & Kayıt

```
┌─────────────────┐
│  Splash (1 sn)  │
└────────┬────────┘
         │
         ▼
   ┌─────────────┐
   │ Davet kodu  │ ◄── (girilmemiş) ──── "Bekleme listesi" CTA
   │   ekranı    │
   └──────┬──────┘
          │ Geçerli kod
          ▼
   ┌─────────────────┐
   │ Auth seçimi:    │
   │ • Apple         │
   │ • Google        │
   │ • E-posta + OTP │
   └─────────┬───────┘
             │
             ▼
       ┌────────────┐
       │ Yeni mi?   │
       └─┬────────┬─┘
   Evet  │        │  Hayır
         ▼        ▼
   ┌──────────┐  ┌─────────────┐
   │ Profil   │  │ /map        │
   │ tamamla  │  │ (giriş ok)  │
   └────┬─────┘  └─────────────┘
        │
        ▼
   ┌──────────┐
   │ İzinler: │
   │ konum +  │
   │ bildirim │
   └────┬─────┘
        ▼
   ┌──────────────────┐
   │ Topluluk         │
   │ kuralları onayı  │
   └────┬─────────────┘
        ▼
      /map
```

### Edge Cases

| Durum | Davranış |
|---|---|
| Davet kodu yanlış | Inline error: "Bu kod geçersiz". CTA: "Bekleme listesine katıl" |
| OTP süresi doldu | "Kod süresi doldu. Yeniden gönder?" |
| OTP 3 yanlış deneme | 5 dk lock + sayaç |
| Apple/Google iptal | Auth seçim ekranına geri |
| İnternet yok | "Bağlantı yok" banner, retry butonu |
| Konum izni reddedildi | "Rollpit'i tam kullanmak için..." rationale + Ayarlar deep link |
| Bildirim izni reddedildi | Devam edilebilir, ama uyarı: "Yardım çağrısı bildirimi alamayacaksın" |

---

## 2. UF-02 — Konum Akışı (Pasif & Aktif)

```
[App açık + konum izni var + hayalet mod kapalı]

  Geolocator stream
       │
       ▼
  Position {lat,lng}
       │
       ▼
  toH3Cell(lat,lng, res:9)
       │
       ▼
  WS.send({type:"location", h3_cell})
       │
       ▼
  [Go service]
       │
       ├──▶ Valkey: SET loc:user:{id} {cell} EX 300
       │
       └──▶ Pub/Sub: PUBLISH cell:{cell} {userId}
              │
              ▼
          [Aynı k-ring içindeki diğer kullanıcılar
           heatmap_update mesajı alır]
```

### Hayalet Mod Toggle

```
[User: ghost toggle ON]
   ▼
Flutter: stop position stream
Flutter: WS.send({type:"ghost_on"})
   ▼
[Go service]
   ▼
Valkey: DEL loc:user:{id}
Hub: removeFromAllCells(userId)
   ▼
[Diğer kullanıcılar bu kişiyi haritada göremez]
```

### Distance Filter

- `LocationSettings.distanceFilter = kLocationDistanceFilterMeters` (30 m).
- Kullanıcı 30 m'den az hareket ederse yeni event yayılmaz.
- Cihaz GPS güncellemeleri (~1 sn) bu sayede backend'e baskı yapmaz.

---

## 3. UF-03 — Acil Yardım (Critical Path)

> Hedef: SOS basıldıktan sonra 1 sn içinde "talep alındı" feedback'i, 8 dk içinde ortalama yanıt.

```
┌─────────────────┐
│  Harita ekranı  │
└────────┬────────┘
         │ SOS butonu (tek tap)
         ▼
┌────────────────────┐
│ Sorun tipi seç:    │
│ ⚙️  Arıza          │
│ 🛞 Patlak lastik   │
│ ⛽ Yakıt bitti      │
│ 🚨 Kaza            │
│ ❓ Diğer           │
└─────────┬──────────┘
          │ Seçim
          ▼
┌────────────────────┐
│ (Ops.) açıklama:   │
│ "Akü bitti, yardım │
│  gerek"            │
│                    │
│ [Gönder] [Vazgeç]  │
└─────────┬──────────┘
          │ Gönder (3. tap)
          ▼
┌────────────────────────┐
│ POST /v1/help          │
│ { h3_cell, issue_type,│
│   description }        │
└────────┬───────────────┘
         │ ≤ 1 sn
         ▼
┌─────────────────────────┐
│ ✅ Talep oluşturuldu    │
│                         │
│ [Pulse animasyonu]      │
│ "Yakındakiler           │
│  bilgilendirildi"       │
│                         │
│ [İptal et]              │
└────────┬────────────────┘
         │
         │ [Trigger.dev]
         │ k-ring 2 içindeki aktif kullanıcılara push
         │
         ▼
┌──────────────────────────┐
│ Helper push aldı:        │
│ "🚨 100 m'de yardım      │
│  gerekiyor"              │
└────────┬─────────────────┘
         │ Tap
         ▼
┌──────────────────────────┐
│ Yardım detayı            │
│ • Sorun: "Akü bitti..."  │
│ • Mesafe: yaklaşık 90 m  │
│ • Yön: kuzeydoğu         │
│                          │
│ [Yardım edeceğim]        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ PATCH /v1/help/:id/      │
│ respond                  │
│ (atomic upsert helper)   │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ 1-1 sohbet açılır        │
│ "Geliyorum, 5 dk"        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Requester:               │
│ "Çözüldü olarak işaretle"│
└────────┬─────────────────┘
         │
         ▼
   PATCH /v1/help/:id/resolve
   help.status = 'resolved'
   sohbet 24 saat sonra arşiv
```

### Edge Cases

| Durum | Davranış |
|---|---|
| Konum izni yok | SOS basınca "Yardım için konum izni gerekli" → izin akışı |
| Hayalet mod açık | "Yardım için konum gönderilecek. Onaylıyor musun?" |
| 2 saat içinde kimse yardım etmedi | Talep `expired` olur, kullanıcıya bildirim |
| Saatlik limit aşıldı (3) | "Çok fazla talep açtın. 1 saat sonra dener misin?" |
| Helper son anda vazgeçti | Talep tekrar `open`, requester'a bildirim |
| Çoklu helper yarışı | Atomic update: ilk gelen kazanır, 409 Conflict |
| İnternet kesildi (talep açıldıktan sonra) | Sohbet offline kuyruk; çevrimiçi olunca sync |

---

## 4. UF-04 — Flare Oluşturma & RSVP

```
[Map screen]
   │
   │ Long-press konum
   ▼
[Quick action menu]
   • "Buradan flare oluştur"
   • "Bu konumu paylaş"
   │
   ▼
[Flare form]
  Başlık: ____________
  Açıklama: ____________
  Başlangıç: [date+time picker, ≥ now+5min]
  Bitiş (ops.): [date+time picker]
  Topluluk (ops.): [dropdown]
  Kapak (ops.): [media picker]
  │
  ▼
[POST /v1/flares]
  │
  ▼
[Flare detail screen]
  ✅ "Flare yayında"
  Pin haritada görünür
  Topluluk üyelerine push gider
  │
  ▼
[Other user]: push → flare detail → RSVP
   "Gidiyorum / Belki / Gitmiyorum"
   │
   ▼
[POST /v1/flares/:id/rsvp]
   │
   ▼
[Flare creator]: badge + "+3 katılımcı"
```

### Edge Cases

| Durum | Davranış |
|---|---|
| Geçmiş tarih | Form validation: "Başlangıç gelecekte olmalı" |
| Günlük limit (5) aşıldı | "Bugün için flare limitin doldu" |
| Topluluk üyesi değil | Topluluk dropdown'ında yalnızca üye olduğu görünür |
| Kapak yüklenirken iptal | Flare oluşturulur, sonra kapak eklenebilir |
| Etkinlik bitti | RSVP butonları gizlenir, "Etkinlik bitti" badge |

---

## 5. UF-05 — DM (Yeni Sohbet)

```
[Profil ekranı: @ahmet]
   │
   │ "Mesaj at" butonu
   ▼
[Chat screen — peerId=ahmet's id]
   Boş ekran:
   "Henüz mesajınız yok"
   │
   │ Mesaj yaz + gönder
   ▼
[POST /v1/messages/dms/:peerId]
   │
   ▼
[Realtime subscribe: DM channel]
   peer'in ekranında 1 sn içinde mesaj görünür
```

### Engelleme Edge Case

```
[Ahmet, beni engelledi]
   │
   ▼
[Ben mesaj attım]
   ▼
[POST /v1/messages/dms/:peerId]
   ▼
Backend kontrol: Ahmet'in blocks tablosunda ben var mıyım?
   │
   ├─ Evet → 403 FORBIDDEN, code: 'BLOCKED'
   │   Flutter: "Bu kullanıcıya mesaj gönderemiyorsun"
   │
   └─ Hayır → mesaj gönderilir, normal akış
```

---

## 6. UF-06 — Snap Kamera & Yükleme

```
[Map screen → 📷 FAB]
   │
   ▼
[Camera screen]
   • Foto / Video toggle
   • Filtre seçimi
   • Front/back kamera
   │
   │ Çekim
   ▼
[Preview screen]
   • Yeniden çek
   • Filtre değiştir
   • [Paylaş]
   │
   ▼
[Hedef seç]
   • Profil galerisi
   • Topluluk: [select]
   • Flare: [select]
   • DM: [select user]
   │
   ▼
[Compress (background)]
   image_compress / video_compress
   │
   ▼
[POST /v1/media/upload-url]
   ↳ presigned URL
   │
   ▼
[PUT direct R2]
   ↳ progress bar (yüklemenin hangi yüzdesi)
   │
   ▼
[POST /v1/media/finalize]
   ↳ DB'de status=ready
   │
   ▼
[Hedef ekrana embed]
   ↳ medya kartı görünür
```

### Edge Cases

| Durum | Davranış |
|---|---|
| Hareketli araç (>10 km/h) | Kamera kayıt butonu disabled + uyarı toast |
| Yükleme sırasında app kapandı | iOS: BackgroundTask 30 sn devam; sonra resume |
| Yükleme sırasında bağlantı kesildi | Yerel kuyruk → çevrimiçi olunca devam |
| Yükleme tamamlandı, finalize başarısız | Otomatik 3 retry; sonra "Yükleme bekleniyor" badge |
| Maksimum boyut aşıldı | Compress sonrası tekrar dene; başarısızsa hata |
| Video > 15 sn | Kayıt otomatik durur 15. sn'de |

---

## 7. UF-07 — Topluluk Katılma

```
[Communities screen → ara: "İstanbul Klasik Otomobil"]
   │
   ▼
[Community detail]
   • Cover, üye sayısı, şehir
   • [Katıl] (public) veya [Katılım iste] (private)
   │
   ▼
PUBLIC:
   POST /v1/communities/:id/join
   ↳ instant join, sohbet erişimi açılır

PRIVATE:
   POST /v1/communities/:id/join
   ↳ status='pending', kaptana bildirim
   ↳ kaptan onayı sonrası member rolüne çevrilir
```

---

## 8. UF-08 — İşletme Onboarding

```
[Profile screen]
   │
   │ "İşletmem var" CTA
   ▼
[Business form]
   • İşletme adı
   • Kategori (garage, repair, parts, fuel, cafe, other)
   • VKN
   • Adres
   • Telefon
   • Web
   • Vergi levhası fotoğrafı (zorunlu)
   │
   ▼
[POST /v1/pins] + media upload
   ↳ status='pending_verification', is_verified=false
   ↳ admin paneline bildirim
   │
   ▼
[Admin panel]
   ↳ /pins?filter=pending → verify ekranı
   ↳ Belge inceler → Onayla / Reddet
   │
   ▼
[Onaylandı]
   ↳ is_verified=true
   ↳ kullanıcıya push: "İşletmen doğrulandı"
   ↳ pin haritada "✓ Doğrulanmış" rozetiyle görünür
```

---

## 9. UF-09 — Şikayet & Engelleme

```
[Mesaj kartı → "..." menü]
   • "Şikayet et"
   • "Engelle"
   │
   ▼
"Şikayet et" → modal:
   • Sebep (radio): spam/harassment/inappropriate/fake/other
   • Açıklama (ops.)
   • [Gönder]
   │
   ▼
POST /v1/reports
   ↳ admin paneline düşer
   ↳ kullanıcıya: "Teşekkürler, 24 saat içinde inceleyeceğiz"

"Engelle" → onay:
   "Bu kullanıcıyı engellemek istediğinden emin misin?"
   • [Engelle] [Vazgeç]
   │
   ▼
POST /v1/blocks/:userId
   ↳ engellenen kullanıcı listemden, mesajları gizlenir
   ↳ sohbet ekranı kapatılır
```

---

## 10. UF-10 — Hesap Silme (GDPR/KVKK)

```
[Settings → Hesabı Sil]
   ⚠️ Uyarı: "Bu işlem geri alınamaz..."
   │
   │ "Devam et"
   ▼
[Onay 1: parola/OTP]
   • E-posta auth → OTP
   • Apple/Google → re-auth
   │
   ▼
[Onay 2: silme nedeni (ops.)]
   • Geri bildirim formu
   │
   ▼
[DELETE /v1/profiles/me]
   ↳ profile.role = 'pending_deletion'
   ↳ Trigger.dev job 30 gün sonra çalışacak şekilde planlanır
   ↳ E-posta: "Hesabın 30 gün içinde silinecek. Vazgeçmek için: <link>"
   │
   ▼
[Logout + login ekranına dön]
   │
   │ (30 gün geçti)
   ▼
[Trigger.dev job: hard delete]
   ↳ auth.users sil
   ↳ messages: anonim
   ↳ media: R2'den sil
   ↳ Valkey: konum sil
   ↳ profile satırı sil
```

### Geri Çekme

```
[E-posta link tıkla]
   ↳ /undelete?token=xxx
   ↳ profile.role = 'user'
   ↳ Trigger.dev job iptal edilir
   ↳ "Hesabın geri yüklendi" toast
```

---

## 11. UF-11 — Force Update

```
[App açılış]
   │
   ▼
[GET /v1/config]
   ↳ min_supported_app_version = "1.4.0"
   │
   ▼
[Cihaz sürümü < 1.4.0?]
   │
   ├─ Evet → Bloklayıcı modal:
   │         "Yeni sürüm zorunlu"
   │         [App Store'da güncelle]
   │         (kapatma yok, geri tuşu inactive)
   │
   └─ Hayır → normal akış
```

---

## 12. UF-12 — Çevrimdışı Mod

```
[connectivity_plus: offline detected]
   │
   ▼
[Banner gösterilir]
   "Çevrimdışısın — bazı özellikler sınırlı"
   │
   ▼
Davranış:
   • Harita: son cache'den render
   • Mesaj yaz: yerel kuyruğa eklenir, "gönderilmedi" rozeti
   • Flare oluştur: disabled
   • Yardım talebi: disabled (kritik özellik, online şart)
   • WS: reconnect döngüsü
   │
   ▼
[Online]
   ↳ Kuyruktaki mesajlar gönderilir
   ↳ Banner kaldırılır
   ↳ WS yeniden bağlanır
```

---

## 13. UF-13 — Push Bildirim İşleme

### Foreground (Uygulama Açık)

```
[FCM/APNs message arrived]
   │
   ▼
firebase_messaging.onMessage listener
   │
   ▼
Type'a göre yönlendirme:
   • help_nearby → Snackbar + harita üzerinde pin highlight
   • flare_invite → toast + flare detayına link
   • message → in-app banner + sohbete navigate
```

### Background (Uygulama Arka Planda)

```
[Push notification göründü]
   │
   │ Kullanıcı tıkladı
   ▼
firebase_messaging.onMessageOpenedApp
   │
   ▼
GoRouter ile direkt sayfaya:
   • help_nearby → /help/:id
   • flare_invite → /flares/:id
   • message → /messages/:peerId
```

### Terminated (Uygulama Kapalı)

```
[App icon'a tap (badge'den)]
   │
   ▼
firebase_messaging.getInitialMessage()
   │
   ▼
Eğer message varsa → ilgili sayfaya redirect
Yoksa → /map default
```

---

## 14. Hata Akışları (Genel)

### Network Error

```
[API call failed]
   │
   ▼
Type tespiti:
   • Timeout → "Bağlantı yavaş, tekrar dene"
   • 401 → token refresh; başarısızsa logout
   • 403 → "Bu işlem için yetkin yok"
   • 422 → form üzerinde alan bazlı hata
   • 429 → "Çok fazla istek, 1 dakika bekle"
   • 500 → Snackbar + Sentry + retry CTA
```

### Realtime Disconnect

```
[Supabase Realtime disconnected]
   │
   ▼
Auto-reconnect (Supabase SDK)
Banner: "Bağlantı kuruluyor..."
   │
   ▼
[Reconnect successful]
   ↳ Pending message sync
   ↳ Banner kaldır
```

---

## 15. Akış Test Sırası (QA İçin)

Her release öncesi şu sırayla test:

1. UF-01 (kayıt) → UF-02 (konum) → UF-04 (flare) → UF-07 (topluluk)
2. UF-03 (yardım) — kritik path, 2 cihaz gerekir
3. UF-05 (DM) → UF-09 (şikayet/engelleme)
4. UF-06 (kamera + yükleme)
5. UF-11 (force update simülasyonu) → UF-12 (offline)
6. UF-10 (hesap silme — staging'de)
