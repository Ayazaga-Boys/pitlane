# 👤 KİŞİ 4 — V2 Track Paketi (Furkan)
> Flutter UI · Mid/Senior · Rollpit V2

## Senin V2 Sorumluluk Alanın

**Flutter UI V2 — Sosyal Ağ Ekranları**

V2'nin en büyük UI yükü sende. Story kamerası, post composer, keşfet feed'i, follow akışı, topluluk davet/rütbe ekranları, etkinlik UI'sı, yarışma UI'sı, profil foto. **~15+ yeni ekran, ~30+ yeni provider/component**.

---

## V2 Önce Oku

- `KISI_4_TRACK.md` — V1 bitiş notları
- `V2_VIZYON.md` — V2 master plan
- `03_MIMARI_KURALLAR.md` — Kural 3 (Riverpod) hâlâ kritik
- `15_TASARIM_SISTEMI.md` — yeni komponentler eklenecek

---

## Sprint Görevlerin (V2)

### V2.0a — Presence Status Göstergesi (Sprint Öncesi — Furkan isteği)

> Bağımlılık: Erol'un `presence_status` endpoint'i + Burak'ın WS `presence_update` event'i

- [ ] **`PresenceDot` widget** — 10–12px, profil fotoğrafının sağ alt köşesinde
  - 🟢 `online` → yeşil
  - 🟡 `dnd` → sarı (rahatsız etmeyin)
  - ⚫ `offline` → gri
  - `presence_visible: false` → dot hiç gösterilmez
- [ ] Presence dot tüm ekranlarda tutarlı: DM listesi, yorum, topluluk üye listesi, arama
- [ ] Ayarlar ekranında: **"Çevrimiçi durumumu göster"** toggle + DND modu
- [ ] WS `presence_update` event'i ile gerçek zamanlı güncelleme (Burak deliver eder)

### V2.0b — Araç İkonu Harita Kişiselleştirme (Sprint Öncesi — Furkan isteği)

> Bağımlılık: Erol'un `icon_slug` + ikon kataloğu endpoint'i + Burak'ın harita marker entegrasyonu

- [ ] **Araç profil düzenleme ekranı** — mevcut araç düzenleme'ye ikon seçici ekle
  - Grid görünümde ikon kataloğu (SVG siluetler)
  - Kategori filtreleri: Motosiklet / Otomobil
  - Seçili ikon vurgulu
- [ ] **Aktif araç seçimi** — birden fazla araç varsa hangisinin haritada görüneceği
- [ ] **Önizleme** — "Haritada böyle görünürsün" mini harita kartı
- [ ] İkon dosyaları: basit tek renk SVG siluetler (`assets/vehicle_icons/`)

### V2.0 — V1 Buglar (Sprint Öncesi) ⭐ İlk iş

> Burak'ın list'inde madde 1 — profil tamamlama back button bug fix

- [x] **Profil tamamlama back button** — Burak şikayetçi
  - `ProfileCompletionScreen`'de AppBar'a back butonu ekle veya WillPopScope ile profile'a yönlendir
  - Akış: kullanıcı profilden "Eksikleri tamamla" der → girer → istediği zaman geri çıkabilir
- [ ] Hot reload sonrası state korunma sorunu kontrol

### V2.1 — Profil Foto + Public/Private (Hafta 1-2)

> Bağımlılık: Erol'un `POST /v2/profiles/me/avatar` + privacy endpoint

- [ ] Profil ekranında avatar upload UI (`image_picker` + crop)
- [ ] Cloudflare Images presigned upload akışı
- [ ] Profil ayarlar ekranı:
  - Public/Private toggle (açıklama: "Public profili herkes görebilir")
  - Konum paylaşımı modu (Kimseyle / Sadece takipçiler / Belirli gruplar)
- [ ] Avatar her yerde görünmeli (DM listesi, yorum, post, vs.)

### V2.2 — Follow Sistemi (Hafta 1-2 paralel)

> Bağımlılık: Erol'un follow endpoint'leri

- [ ] **Profil sayfası** (`/profile/:username`) — başka kullanıcının
  - Follow / Unfollow butonu
  - Private hesapsa "İstek gönder"
  - Followers / Following sayıları (tıklanabilir liste)
- [ ] **Followers/Following liste ekranları**
- [ ] **Follow request bildirimleri** — kabul / reddet / sil
- [ ] **Bildirim feed**'ine yeni türler ekle: `follow_received`, `follow_accepted`

### V2.3 — Post Sistemi (Hafta 3-4)

> Bağımlılık: Erol'un post endpoint'leri + Cloudflare Images presigned

- [ ] **Post composer** (`/posts/create`)
  - Foto seç → crop → caption yaz → paylaş
  - Visibility seçimi (Public / Sadece takipçiler)
- [ ] **Post card komponenti** — foto + yazar + caption + beğen/yorum/share
- [ ] **Post detay ekranı** — full caption + yorum listesi
- [ ] **Yorum komponenti** — yanıtla, beğen
- [ ] **Beğeni listesi** ekranı
- [ ] **Optimistic UI** — beğen anında, hata olursa rollback

### V2.4 — Story Sistemi (Hafta 5-6)

> Bağımlılık: Erol'un story endpoint'leri + Cloudflare Stream

- [ ] **Story camera** (`/stories/create`) — kamera + foto + 15sn video
- [ ] **Story viewer** — fullscreen, tap → ileri, swipe → kapat
- [ ] **Story ring** (profilde, feed üstünde) — yeni story varsa renkli halka
- [ ] **Görüntüleyenler listesi** (story sahibi)
- [ ] **Story mute** — birinin story'sini gizle
- [ ] Story 24h timer animasyonu (top progress bar)

### V2.5 — Keşfet Ekranı (Hafta 5-6 paralel)

> Bağımlılık: Erol'un `/v2/discover/feed`

- [ ] **Keşfet sekmesi** — bottom nav'a 5. tab (Harita | Topluluklar | **Keşfet** | Mesajlar | Profil)
- [ ] Feed UI — sonsuz kaydırma (infinite scroll)
- [ ] Üstte story ring'leri (takip ettiklerinin yeni story'leri)
- [ ] Algoritma feed (Erol'un endpoint'i karar verir, sen sadece render)
- [ ] **Trending hashtag/topic** komponenti (opsiyonel)

### V2.6 — Topluluk V2 (Hafta 7-8)

> Bağımlılık: Erol'un community_roles, invites, events endpoint'leri

- [ ] **Topluluk oluşturma — V2** — özel topluluk seçeneği
  - Davet linki oluştur (anında katıl / istek gönder)
  - Davet kodu oluştur
- [ ] **Davet linki preview ekranı** — link'e tıklayan kişi görür (topluluk fotosu, üye sayısı, "Katıl" / "İstek Gönder" butonu)
- [ ] **Davet kodu giriş ekranı** — community settings'ten "Kodla katıl"
- [ ] **Davet isteği bildirimi** — yönetici "X kullanıcısı katılmak istiyor" — kabul/reddet
- [ ] **Yönetici davet etme** — yöneticisi → kullanıcı bildirim alır → kabul/reddet
- [ ] **Rütbe sistemi UI** — community detail'de "Roller" tab'ı
  - Yönetici rütbe oluşturabilir, izin verebilir
  - Üyelere rütbe atayabilir
  - Şablon: "Chopper Pack" / "Otomobil Klubü" / "Genel"
- [ ] **Üye listesinde rütbe gösterimi** — rütbe rozetleri

### V2.7 — Etkinlik & Poll (Hafta 7-8 paralel)

- [ ] **Etkinlik oluşturma** (rol kontrolü → backend reddederse UI gösterir)
- [ ] **Etkinlik detay** — tarih, yer (harita), RSVP butonları (Katılıyorum/Belki/Hayır)
- [ ] **Etkinlik haritada** — flare benzeri marker (Burak'ın MapScreen'ine entegre)
- [ ] **Poll UI** — etkinlik içinde anket (yes/maybe/no görsel grafik)
- [ ] **Etkinlik bildirimleri** — başlamadan 1 gün önce, başlamadan 1 saat önce

### V2.8 — İşletme Self-Onboarding UI (Hafta 9-10)

> Bağımlılık: Erol'un business application endpoint'leri

- [ ] **Profil sayfasına yeni opsiyon** — "İşletmen mi var? Başvur"
- [ ] **Başvuru wizard'ı** (4 adım):
  1. İşletme türü (tamirci/galeri/satıcı/diğer)
  2. İşletme bilgileri (ad, adres, telefon)
  3. Belge yükleme (vergi levhası, ruhsat) — `file_picker` + R2 private upload
  4. Önizleme + gönder
- [ ] **Başvuru durumu sayfası** — pending/approved/rejected
- [ ] Onaylandıktan sonra: haritada foto-bubble olarak görünür (Burak'ın işi)

### V2.9 — SOS Hedefleme + Tagged Needs (Hafta 11-12)

> Bağımlılık: Erol'un `/v2/help` + community_needs endpoint'leri

- [ ] **SOS form'una hedefleme seçimi**:
  - Yakındaki herkes (default)
  - Sadece takip ettiklerim
  - Belirli grup(lar)
- [ ] **Aciliyet seçimi** (kırmızı/turuncu/sarı)
- [ ] **Topluluk içi "İhtiyaç paylaş" UI**
  - Tür seç (yedek parça / yakıt / acil / diğer)
  - Renk kodu otomatik atanır
  - Sohbete karışmıyor — ayrı "İhtiyaçlar" tab'ında
- [ ] **İhtiyaçlar tab'ı** — community detail içinde — açık/kapalı filtre

### V2.10 — Yarışma UI (Hafta 11-12 paralel)

- [ ] **Yarışma oluşturma** (rol kontrolü)
  - Filter seç: motor tipi, otomobil tipi, custom, marka
  - Oylama tarihi seç
- [ ] **Yarışma detay** — katılımcılar grid (Instagram explore tarzı)
- [ ] **Katılım** — foto seç, açıklama yaz, gönder
- [ ] **Oylama UI** — fotolara tıklayıp oy ver, kalan oy göster
- [ ] **Sonuç ekranı** — kazanan + en çok oy alan 3 katılımcı

---

## V2 Sayfa Listesi (Yeni)

| Ekran | Route | Sprint |
|---|---|---|
| Diğer kullanıcı profili | `/profile/:username` | V2.2 |
| Followers listesi | `/profile/:username/followers` | V2.2 |
| Following listesi | `/profile/:username/following` | V2.2 |
| Follow requests | `/follow-requests` | V2.2 |
| Post composer | `/posts/create` | V2.3 |
| Post detay | `/posts/:id` | V2.3 |
| Beğeni listesi | `/posts/:id/likes` | V2.3 |
| Story camera | `/stories/create` | V2.4 |
| Story viewer | `/stories/:id` | V2.4 |
| Keşfet (tab) | `/discover` | V2.5 |
| Davet linki preview | `/invites/:slug` | V2.6 |
| Davet kodu girişi | `/communities/join-by-code` | V2.6 |
| Topluluk rolleri | `/communities/:id/roles` | V2.6 |
| Etkinlik oluşturma | `/communities/:id/events/create` | V2.7 |
| Etkinlik detay | `/events/:id` | V2.7 |
| İşletme başvuru | `/business/apply` | V2.8 |
| Başvuru durumu | `/business/applications/me` | V2.8 |
| Yarışma oluşturma | `/communities/:id/competitions/create` | V2.10 |
| Yarışma detay | `/competitions/:id` | V2.10 |
| Yarışma katılım | `/competitions/:id/enter` | V2.10 |

---

## Yeni Riverpod Providers (Tahmini)

```dart
// Profile V2
final avatarUploadProvider = ...
final privacySettingsProvider = ...

// Follow
final followStatusProvider = FutureProvider.family<FollowStatus, String>(...);
final followersProvider = ...
final followingProvider = ...
final incomingFollowRequestsProvider = ...

// Posts
final postsFeedProvider = ...
final postDetailProvider = FutureProvider.family<Post, String>(...);
final postLikeNotifierProvider = ...
final postCommentsProvider = ...

// Stories
final storiesFeedProvider = ...
final storyViewersProvider = ...

// Discover
final discoverFeedProvider = ...

// Communities V2
final communityRolesProvider = ...
final communityInvitesProvider = ...
final eventsProvider = ...

// Business
final businessApplicationProvider = ...

// Competitions
final competitionsProvider = ...
```

---

## Diğer Track'lerle Bağımlılıkların

| Bağımlılık | Kimden | Ne Zaman |
|---|---|---|
| Tüm yeni endpoint'ler | Erol | Her sprint |
| WS event tipleri (follow, story, like, comment) | Burak | V2.6 sonu |
| Etkinlik haritada görünümü | Burak | V2.7 |
| Yarışma admin onayı | Tufan | V2.10 |

---

## V2 Sahip Olduğun Yeni Paketler (Tahmini)

```yaml
# pubspec.yaml ekle:
dependencies:
  cached_network_image: ^3.4.0
  image_cropper: ^8.0.0
  video_player: ^2.9.0          # story viewer için
  chewie: ^1.8.0                # video controller
  shimmer: ^3.0.0               # loading state
  flutter_html: ^3.0.0          # caption renderer (mention/hashtag)
```

---

## Kritik Hatırlatmalar (V2)

```
❌ ASLA: Story viewer'da medya'yı tek tek backend'den çek
✅ DOĞRU: Bir önceki/sonraki story preload + Cloudflare CDN

❌ ASLA: Feed'i her açılışta yeniden yükle
✅ DOĞRU: cursor pagination + AsyncNotifier ile cache

❌ ASLA: Post beğeniyi state'de tutmadan API'ye gönder
✅ DOĞRU: Optimistic UI — anında UI güncelle, sonra API, hata olursa revert

❌ ASLA: Davet linki preview'unu DeepLink olmadan çalıştır
✅ DOĞRU: Universal Link + DeepLink hem iOS hem Android için

❌ ASLA: Profil fotoğrafını backend'e tam boyutta yolla
✅ DOĞRU: image_cropper ile 512x512 crop + Cloudflare Images variant
```
