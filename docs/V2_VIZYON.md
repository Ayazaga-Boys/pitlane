# 🚀 Rollpit V2 — Vizyon & Yol Haritası

> V1: Topluluk + güvenlik (harita, SOS, flares)
> **V2: Sosyal ağ katmanı** — story, post, follow, keşfet, rütbe sistemi

---

## V2 Neden Var?

V1 ile motorcular ve sürücüler için **harita tabanlı bir güvenlik & topluluk** platformu kurduk. Kullanıcılar:
- Yakındaki sürücüleri görebiliyor (heatmap)
- SOS atabiliyor
- Flare'ler düzenleyebiliyor
- Topluluklara katılabiliyor

V2 ile uygulama **kalıcı kullanım haline** geçiyor. Kullanıcı sadece yola çıkınca değil, her gün açıyor: **post atıyor, story paylaşıyor, takip ediyor, yarışmalara katılıyor.**

---

## V2 Özet Tablosu

| Kategori | V1 | V2 |
|---|---|---|
| Profil | Username + araç | + Foto, public/private, takip sistemi, presence status dot |
| Topluluk | Açık katılım | + Davet linki/kodu, rütbeler, etkinlikler, poll'ler |
| Keşfet | — (yok) | Postlar, story'ler, yarışmalar, algoritma feed |
| Harita | Heatmap + pin | + Araç modeli ikonu, takip ettikleri konumu, foto-bubble lokasyonlar, filtreler |
| SOS | Yakındaki herkes | Takip ettikleri + gruplar + renk kodlu aciliyet |
| Bildirim | DM, flare, help | + Follow request, story view, like, comment, event |
| İşletme | Admin ekler | + Self-onboarding başvuru akışı |
| Medya | Profil + flare foto | + Post, story, yorum medyası |

---

## Yeni Özellikler (Burak'ın listesi + ekstra)

### A — Sosyal Ağ Katmanı

1. **Profil fotoğrafı** (kullanıcı yükler, Cloudflare Images)
1a. **Presence status göstergesi** — profil fotoğrafının köşesinde küçük renkli dot
   - 🟢 Yeşil: çevrimiçi
   - 🟡 Sarı: rahatsız etmeyin (DND)
   - ⚫ Gri: çevrimdışı
   - Kullanıcı isterse presence'ı tamamen gizleyebilir
2. **Public/Private profil** (story görme, post görme kontrolü)
3. **Follow/Following sistemi** — instagramdaki gibi
   - Public profilde anında takip
   - Private profilde takip isteği (kabul/red/sil bildirimi)
4. **Story** — 24 saatlik geçici içerik
   - Görüntüleyenler listesi
   - Takipçi/herkes seçenekleri
   - Cloudflare Stream (video) + Images (foto)
5. **Post** — kalıcı içerik
   - Açıklama (caption), beğeni, yorum
   - Yorumlara yanıt
   - Beğeni listesi
6. **Keşfet ekranı** — algoritma tabanlı feed
   - Takip edilenlerin postları (öncelik)
   - Trend olan postlar (sonra)
   - Kullanıcı eğilimine göre öneri

### B — Topluluk V2

7. **Davet sistemi**
   - Davet linki (custom slug)
   - Davet kodu (6 haneli alfanümerik)
   - Yönetici linke 2 davranış belirleyebilir: **anında katıl** veya **istek gönder**
   - Gruba foto + bilgi ile davet ön-izleme ekranı
8. **Katılım modları** (özel gruplarda)
   - Davet isteği gönderme
   - Davet kodu girme
   - Yönetici tarafından davet edilme → kullanıcıya bildirim (kabul/red)
9. **Rütbe sistemi (RBAC)**
   - Tip bazlı şablonlar (Chopper: "Chapter President", "Road Captain", "Sergeant at Arms" / Automobile: "Başkan", "Etkinlik Koordinatörü", "Üye")
   - Yönetici özelleştirebilir
   - Her rütbenin izinleri var (etkinlik düzenleme, üye atma, davet etme, vs.)
10. **Etkinlik + Poll**
    - Yönetici onayıyla etkinlik oluşturma
    - "Katılıyorum / Belki / Hayır" anketi
    - Etkinliğin tarih/yer bilgisi haritada görünebilir
11. **Tagged needs** (yedek parça ilanı vb.)
    - Grup sohbetinde renk kodlu ilan (sarı = parça arıyor, kırmızı = acil)
    - Sohbete karışmıyor, ayrı section'da listeleniyor

### C — Harita V2

12. **Onaylı lokasyonlar** (tamirci, galeri, satıcı) — pin yerine **foto-bubble**
13. **Takip ettiği kullanıcıların konumu** — opsiyonel (kullanıcı ghost mode'da değilse)
14. **Filtreler** — Motorcu yoğunluğu / Otomobil yoğunluğu / Sadece takip ettiğim / İşletmeler
15. **Map clustering** — zoom out edildiğinde marker'lar gruplanır
16. **Araç modeli harita ikonu** — kullanıcının haritadaki konumu generic pin değil araç silueti
   - Araç tipine göre (motosiklet / otomobil / diğer)
   - Marka/modele göre ikon (Golf → Golf silueti, Chopper → chopper silueti)
   - Kullanıcı birden fazla aracı varsa aktif aracını seçer
   - İkon basit SVG (performans için detaylı değil)
   - Haritada zoom seviyesine göre boyutlanır

### D — SOS V2

16. **Hedefleme**: Yakındaki herkes / Takip ettiklerim / Belirli grup(lar)
17. **Renk kodlu aciliyet**: kırmızı (kritik), turuncu (acil), sarı (rica)
18. **Tagged need** akışı (parça, yakıt, taksitle yardım vb.)

### E — İşletme V2

19. **Self-onboarding**: Tamirci/galeri/satıcı uygulama içinden başvuru
20. **Belge yükleme**: vergi levhası, ruhsat (admin onayına gider)
21. **Onay sonrası**: haritada foto-bubble olarak görünür

### F — Yarışma & Keşfet

22. **Foto yarışmaları** — gruplar düzenler
    - Filtreler: motor/otomobil tipi, custom/modifiye, marka
    - Katılım onayı (gruba özel veya açık)
    - Oylama sistemi
23. **Keşfet algoritması** — takip + trend + kişiselleştirme

---

## V2 Ek Teknik Konular (Claude eklemesi)

> Sosyal ağ özellikleri ciddi altyapı gerektirir. Bu maddeler V2 dokümantasyonuna eklenmeli:

### G — Feed Algoritması & Sıralama
- Score = (engagement_rate × 0.5) + (recency × 0.3) + (follow_signal × 0.2)
- Postgres ile başla, ihtiyaç olursa Meilisearch / Redis Sorted Set
- A/B test framework (LaunchDarkly veya GrowthBook)

### H — Story Altyapısı
- 24 saat sonra otomatik silme (Trigger.dev cron + Cloudflare Stream lifecycle)
- Görüntüleyen kaydı (`story_views` tablosu)
- Story mute, gizleme, raporlama

### I — Privacy & Block Genişletme
- "Story görme" izni (takipçi/herkes/seçili kişiler)
- "Konum paylaşımı" granular kontrol (takip eden hangi gruptan)
- Blocked user content invisibility (her yerde, sıkı)

### J — API Versioning
- V1 endpoint'leri korunur (`/v1/*`)
- Yeni endpoint'ler `/v2/*` altında
- Mobile uygulama V2 release'inde geçiş
- 6 ay V1+V2 paralel destek, sonra V1 deprecation

### K — WebSocket Yeni Event'leri
- `follow_request_received`, `follow_accepted`
- `story_posted` (takip ettiklerinin)
- `post_liked`, `post_commented`
- `event_invite`, `event_reminder`
- `help_targeted` (eski `help_nearby`'a ek)

### L — Performance
- Feed cache (Redis/Valkey) — kullanıcı bazlı 5 dk
- Story CDN (Cloudflare Stream zaten var)
- Map clustering (server-side h3 res-7 aggregation)
- Image lazy loading + progressive JPEG

### M — Search & Discovery
- Kullanıcı arama (username, display_name fuzzy)
- Hashtag/tag desteği (post + story)
- Postgres trigram (`pg_trgm`) ile başla

### N — Content Moderation
- Cloudflare Images otomatik moderation (NSFW, violence)
- Admin moderation queue (post, story, yorum)
- Otomatik flag (community reports threshold)

### O — Analytics & Metrikler (V2 KPI)
- Feed engagement rate (impression → like/comment)
- Story view rate (post → view)
- Follow conversion (profil ziyareti → follow)
- DAU, WAU, MAU
- Time spent in app

### P — Test Stratejisi
- Posts/stories için integration testler
- Feed algoritması için snapshot testler
- WebSocket event testleri
- E2E (Patrol): post oluştur → görüntüle → beğen → yorumla

---

## Sprint Yol Haritası (12 hafta)

| Hafta | Sprint | Ana Konu |
|---|---|---|
| 1–2 | V2.1 | Profil foto + public/private + Follow temeli |
| 3–4 | V2.2 | Post oluşturma + görüntüleme + beğeni + yorum |
| 5–6 | V2.3 | Story + Keşfet ekranı + feed algoritması |
| 7–8 | V2.4 | Topluluk: davet linki/kodu + rütbe + etkinlik |
| 9–10 | V2.5 | İşletme self-onboarding + harita foto-bubble + clustering |
| 11–12 | V2.6 | SOS hedefleme + tagged needs + yarışmalar + cilalama |

---

## Track Dağılımı (Özet)

| Kişi | Ana Sorumluluk V2'de |
|---|---|
| **Kişi 1 (Burak)** | Harita V2 (clustering, foto-bubble, takip ettikleri konum, filtreler), Go Realtime yeni WS event'leri, presence tracking |
| **Kişi 2 (Erol)** | Sosyal ağ backend (post/story/follow/feed), topluluk RBAC, etkinlik, business onboarding, content moderation pipeline |
| **Kişi 3 (Tufan)** | Admin: business application review, location approval, content moderation queue, yarışma yönetimi |
| **Kişi 4 (Furkan)** | Profile foto UI, story UI, post UI, keşfet, follow, topluluk davet/rütbe UI, etkinlik UI |

Detaylar için: `KISI_X_TRACK_V2.md`

---

## Bağımlılıklar

```
Kişi 4 (UI) ←─ Kişi 2 (API) ←─ Kişi 1 (WS events)
                    ↓
               Kişi 3 (Admin moderation)
```

- Erol'un yeni endpoint'leri (post, story, follow) → Furkan'ın UI'sının önkoşulu
- Erol'un yeni WS event tipleri → Burak'ın Go realtime'a eklemesi gerek
- Furkan + Erol'un yarışma endpoint'leri → Tufan'ın admin yarışma yönetimi sayfası

---

## Migration Stratejisi

1. **DB**: yeni tablolar ek (`posts`, `stories`, `follows`, `follow_requests`, `community_roles`, `community_invites`, `events`, vs.)
2. **API**: `/v2/*` paralel, `/v1/*` deprecate edilmez (mobile eski sürümler için)
3. **Mobile**: V2 build yeni feature flag'lerle gelir, `feature_v2_enabled` config ile rollout
4. **Veri**: V1 kullanıcıları otomatik V2'ye geçer, profile photo opsiyonel (initial state: ön tanımlı avatar)

---

## Rollout

- **Soft launch**: Wave invite kullanıcılarına önce (1000 kişi)
- **Beta**: Davet kodlu kullanıcılara (5000 kişi)
- **GA**: Genel erişim

Her aşamada Sentry + analytics izlenir, kritik hata olursa feature flag ile kapatılır.

---

## V2 Sonrası (V3 Düşünceleri)

> Burak'ın listesinde 11. madde yarım kalmış. V3'e bırakılan veya açık konular:

- Marketplace (yedek parça satış)
- Premium üyelik (gelir modeli)
- Sponsorlu içerikler / reklam
- Live streaming (sürüş yayını)
- Multi-language (TR + EN)
- Web uygulaması (post görüntüleme)
