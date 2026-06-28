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

- [x] **`PresenceDot` widget** — 10–12px, profil fotoğrafının sağ alt köşesinde
  - 🟢 `online` → yeşil
  - 🟡 `dnd` → sarı (rahatsız etmeyin)
  - ⚫ `offline` → gri
  - `presence_visible: false` → dot hiç gösterilmez
- [ ] Presence dot tüm ekranlarda tutarlı: DM listesi ve topluluk üye listesi ortak `AppAvatar` ile tamam; yorum/arama ekranları gelince aynı komponent kullanılacak
- [x] Ayarlar ekranında: **"Çevrimiçi durumumu göster"** toggle + DND modu
- [ ] WS `presence_update` event'i ile gerçek zamanlı güncelleme (Burak deliver eder)

### V2.0b — Araç İkonu Harita Kişiselleştirme (Sprint Öncesi — Furkan isteği)

> Bağımlılık: Erol'un `icon_slug` + ikon kataloğu endpoint'i + Burak'ın harita marker entegrasyonu

- [x] **Araç profil düzenleme ekranı** — mevcut araç düzenleme'ye ikon seçici ekle
  - Grid görünümde ikon kataloğu (SVG siluetler)
  - Kategori filtreleri: Motosiklet / Otomobil
  - Seçili ikon vurgulu
- [x] **Aktif araç seçimi** — birden fazla araç varsa hangisinin haritada görüneceği
- [x] **Önizleme** — "Haritada böyle görünürsün" mini harita kartı
- [x] İkon dosyaları: basit tek renk SVG siluetler (`assets/vehicle_icons/`)

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

---

## Furkan İçin Uygulama Sırası (Pratik Plan)

Bu track'te çok ekran var; hepsine aynı anda girmek yerine UI altyapısını önce kur, sonra feature feature ilerle.

### 1) V2 UI Temeli

- [x] `AppAvatar` komponenti: avatar + fallback initials + `PresenceDot` slot'u
- [x] `MediaTile` komponenti: image/video thumbnail, loading, error, retry
- [x] `UserListTileV2`: avatar, display name, username, presence, takip butonu
- [x] `AsyncPagedList` helper: cursor pagination ekranlarında ortak kullanım
- [x] `V2EmptyState` ve `V2ErrorState`: feed/story/follow listelerinde ortak görünüm
- [ ] `UploadProgressSheet`: avatar, post, story, belge yükleme için ortak progress UI

**Neden önce bu?** Follow listesi, beğeni listesi, yorumlar, story viewer, başvuru wizard'ı aynı küçük parçaları tekrar tekrar kullanacak. Önce bu parçalar temiz olursa sonraki sprintler daha hızlı akar.

### 2) API Gelmeden Mock Modu

Backend endpoint'i hazır değilse UI beklemesin:

- [ ] Her V2 feature için `Repository` interface'i oluştur
- [ ] `MockSocialRepository`, `MockCommunityV2Repository`, `MockBusinessRepository`
- [ ] Feature flag:
  - `useMockV2Social = true`
  - `useMockV2Community = true`
  - `useMockV2Business = true`
- [ ] Mock datalar:
  - 20 kullanıcı
  - 12 post
  - 8 story
  - 3 private profile
  - 2 community invite
  - 2 business application state

Backend gelince sadece repository implementation değişmeli; ekranlar tekrar yazılmamalı.

### 3) İlk Ekran Önceliği

| Sıra | Ekran/Parça | Neden |
|---|---|---|
| 1 | `AppAvatar` + `PresenceDot` | Her yerde kullanılacak temel parça |
| 2 | Profil ayarları: avatar/privacy/presence | V2.1'in kapısı |
| 3 | Diğer kullanıcı profili + follow button | Sosyal ağın ana davranışı |
| 4 | Followers/following/follow requests | Follow sistemini tamamlar |
| 5 | Post card + post detail | Keşfet ve profil grid'i için temel |
| 6 | Post composer | İçerik üretimi |
| 7 | Story ring + story viewer | Feed üstü sosyal ritim |
| 8 | Keşfet tab | Post/story parçalarını birleştirir |

---

## V2 UI Kabul Kriterleri

### Profil + Presence

- [ ] Avatar yoksa initials fallback gösterilir
- [ ] Avatar yüklenirken eski avatar kaybolmaz
- [ ] `presence_visible = false` ise hiçbir ekranda dot görünmez
- [ ] DND seçilince push sessize alma mesajı kullanıcıya net gösterilir
- [ ] Private profil toggle'ı değişince profil ekranı anında yeni state'i gösterir

### Follow

- [ ] Public profil: Follow'a basınca buton anında `Following` olur
- [ ] Private profil: Follow'a basınca `Requested` olur
- [ ] Unfollow aksiyonunda confirm sheet gösterilir
- [ ] Engellenen kullanıcı profili minimum bilgiyle gösterilir, follow aksiyonu kapalıdır
- [ ] Follow request accept/reject aksiyonları optimistic çalışır

### Post

- [ ] Composer medya seçmeden publish butonunu açmaz
- [ ] Caption limit UI'da görünür; backend limitini aşmaz
- [ ] Like optimistic çalışır, hata halinde geri döner
- [ ] Comment pagination düzgün çalışır
- [ ] Post silinince profile/feed cache invalidate edilir

### Story

- [ ] Story viewer tek elle kullanılabilir: tap sağ/sol, swipe down kapat
- [ ] Video story başlamadan loading state gösterir
- [ ] Sonraki ve önceki story preload edilir
- [ ] Story owner kendi story'sinde viewers listesini görebilir
- [ ] Mute edilen kullanıcının story ring'i feed üstünde görünmez

### Keşfet

- [ ] Pull-to-refresh feed'i yeniler
- [ ] Infinite scroll cursor tekrarını engeller
- [ ] İlk yükleme shimmer, boş feed empty state gösterir
- [ ] Post/story görünürlük kuralları client'ta da saygıyla render edilir

### Topluluk V2

- [ ] Davet preview login değilken de okunabilir, aksiyon için auth ister
- [ ] Davet kodu yanlışsa hata mesajı net ve kısa olur
- [ ] Rol izinleri checkbox/toggle gruplarıyla düzenlenir
- [ ] Yetkisiz kullanıcı rol/etkinlik ekranında aksiyon butonlarını görmez veya disabled görür

### İşletme Başvurusu

- [ ] Wizard her adımda validation yapar
- [ ] Belge yükleme yarıda kalırsa tekrar denenebilir
- [ ] Başvuru gönderildikten sonra kullanıcı durum ekranına yönlenir
- [ ] Rejected state'te red nedeni ve yeniden başvuru aksiyonu görünür

---

## API Kontrat Beklentileri (Furkan'ın İhtiyacı)

Backend kontratları netleşirken UI'nın ihtiyacı olan minimum response şekilleri:

### User Summary

```json
{
  "id": "uuid",
  "username": "furkan",
  "display_name": "Furkan",
  "avatar_url": "https://...",
  "is_private": false,
  "presence_status": "online",
  "presence_visible": true,
  "is_following": true,
  "follow_request_status": null
}
```

### Post Card

```json
{
  "id": "uuid",
  "author": {},
  "media": {
    "type": "image",
    "url": "https://...",
    "thumbnail_url": "https://..."
  },
  "caption": "Bugün rota güzel.",
  "like_count": 42,
  "comment_count": 7,
  "liked_by_me": false,
  "created_at": "2026-06-26T12:00:00Z"
}
```

### Story Feed Item

```json
{
  "author": {},
  "stories": [
    {
      "id": "uuid",
      "media_type": "image",
      "media_url": "https://...",
      "thumbnail_url": "https://...",
      "viewed_by_me": false,
      "expires_at": "2026-06-27T12:00:00Z"
    }
  ]
}
```

### Cursor Page

```json
{
  "items": [],
  "next_cursor": "opaque-cursor-or-null"
}
```

**UI notu:** Cursor string opaque kabul edilecek; client cursor parse etmeyecek.

---

## Tasarım Sistemi Eklemeleri

`15_TASARIM_SISTEMI.md` içine V2 için ayrıca eklenmeli:

- [ ] Avatar ölçüleri: 24 / 32 / 40 / 56 / 88
- [ ] Presence dot ölçüleri: avatar boyutuna göre 6 / 8 / 10 / 12
- [ ] Story ring renkleri: unseen / seen / muted / own
- [ ] Post card spacing ve media aspect ratio kuralları
- [ ] Action icon set: like, comment, share, bookmark, mute, report
- [ ] Role badge renkleri: owner/admin/mod/member/custom
- [ ] Urgency renkleri: critical/urgent/request
- [ ] Upload progress pattern: inline, sheet, fullscreen

---

## Test Planı (Furkan)

### Widget Test

- [ ] `PresenceDot` status renkleri ve hidden state
- [ ] `FollowButton` state machine: none/requested/following/blocked
- [ ] `PostCard` liked/unliked ve count değişimi
- [ ] `StoryRing` seen/unseen/muted görünümleri
- [ ] `BusinessApplicationStatus` pending/approved/rejected state'leri

### Integration Test

- [ ] Profil foto seç → crop → upload progress → avatar değişir
- [ ] Private profile follow request → request listesinde accept → following olur
- [ ] Post oluştur → feed'de görünür → like → comment
- [ ] Story oluştur → viewer'da aç → view kaydı gider
- [ ] İşletme başvurusu 4 adım tamamlanır

### E2E Kritik Akış

- [ ] Yeni kullanıcı V2 profilini tamamlar
- [ ] Başka kullanıcıyı takip eder
- [ ] Post paylaşır
- [ ] Keşfet feed'inde kendi ve takip edilen içerikleri görür
- [ ] Topluluk davet linkinden katılır

---

## Günlük Çalışma Ritmi

- Sabah: bağımlı backend endpoint'lerinden hangisi hazır kontrol et
- Önce mock repository ile ekranı bitir
- Sonra gerçek repository'ye bağla
- Her ekran için loading/error/empty/success state'i aynı gün kapat
- Sprint sonunda sadece "ekran çizildi" değil, "state + hata + boş veri + pagination + optimistic" tamamlanmış olmalı

---

## V2.1 İçin İlk Net Yapılacaklar

Furkan'ın ilk sprintte kilit açan işleri:

1. `AppAvatar` + `PresenceDot` ortak komponentlerini tamamla
2. Profil ayarlarına avatar, private toggle, presence toggle ekle
3. `SocialRepository` interface + mock implementation kur
4. Başka kullanıcı profil ekranını mock data ile ayağa kaldır
5. Follow button state machine'i bitir
6. Followers/following listelerini cursor pagination ile hazırla
7. Tasarım sistemi dokümanına avatar/story/follow component kurallarını ekle

Bu 7 madde bitince V2 sosyal UI'nın omurgası kurulmuş olur.
