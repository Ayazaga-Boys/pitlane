# Burak / Codex Completed Log

Bu dosya Kişi 1 (Burak) track'i için Codex ile yapılan işleri ve kararları kaydeder.

## 2026-05-12

### Repo ve Branch Kontrolü

- İlk inceleme yanlış klasörde yapıldı: `/Users/gemici/Desktop/Snap`.
- Doğru çalışma klasörü netleştirildi: `/Users/gemici/Developer/Snap`.
- Doğru repo remote'u doğrulandı:
  - `https://github.com/Ayazaga-Boys/pitlane.git`
- Doğru branch doğrulandı:
  - `kisi1/harita-go`
- `git fetch` sonrası local branch'in `origin/kisi1/harita-go` dalından 6 commit geride olduğu görüldü.
- `git pull --ff-only` ile local branch güvenli şekilde fast-forward güncellendi.
- Son durum:
  - Local `kisi1/harita-go`, `origin/kisi1/harita-go` ile eşit.
  - Kişi 1 branch'i `origin/main` ile güncel ve main'den 1 merge commit önde.
- Tek kalan untracked dosya:
  - `apps/mobile/run_dev.sh`
  - Bu dosyaya dokunulmadı.

### Kişi 1 Kapsamı Netleştirildi

Kişi 1 sorumluluk alanı:

- Flutter harita ekranı
- Go realtime servisi
- WebSocket bağlantısı
- Konum altyapısı
- H3 mahremiyet akışı

Dokunulmayacak alanlar:

- Kişi 2 / Erol: Backend API ve DB tarafı
- Kişi 3: Admin panel
- Kişi 4 / Furkan: Auth ve genel UI ekranları

Başka kişilerin alanında ihtiyaç çıkarsa doğrudan dosyalarına müdahale edilmeyecek; Burak'a mesaj taslağı verilecek.

### Okunan Ana Dokümanlar

- `docs/KISI_1_TRACK.md`
- `docs/03_MIMARI_KURALLAR.md`
- `docs/06_GUVENLIK_MAHREMIYET.md`
- `docs/05_API_KONTRATI.md`
- `docs/08_TRACK2_FLUTTER.md`
- `docs/10_TRACK4_GO_SERVISI.md`
- `docs/15_TASARIM_SISTEMI.md`

En kritik kural:

- Flutter ham `latitude/longitude` değerini backend'e veya Go servisine göndermeyecek.
- Cihazda H3 hücresine çevrilip sadece `h3_cell` gönderilecek.

### Mevcut Durum Analizi

Kişi 1 tarafında yapılmış görünen işler:

- Flutter harita ekranı var.
- Google Maps entegrasyonu var.
- Dark map style var.
- Konum izni ve konum tracking akışı var.
- GPS stream H3 hücresine çevriliyor.
- WebSocket servisi var.
- WebSocket ile `location`, `ghost_on`, `ghost_off` gönderiliyor.
- `heatmap_update` mesajları dinleniyor.
- Heatmap polygon overlay var.
- Hayalet mod toggle var.
- Harita filtreleri var.
- Flares, business pins ve help pins haritada gösteriliyor.
- SOS sheet ve yardım talebi oluşturma akışı var.
- Açık yardım pinleri için detay sheet'i var.
- Yardım edince mesaj ekranına yönlenme var.
- Go realtime servisinde JWT doğrulama, dev bypass, health endpoint ve graceful shutdown var.
- Go tarafında Valkey store ve in-memory fallback var.
- Go tarafında Prometheus metrics var.
- Heatmap broadcast throttle var.

Kalan veya netleştirilmesi gereken işler:

- Go realtime tarafında gerçek hücre bazlı Pub/Sub yok; mevcut heatmap update tüm client'lara broadcast ediliyor.
- WebSocket kontratındaki `subscribe_cell` ve `unsubscribe_cell` mesajları uygulanmamış.
- Go tarafında k-ring yakınlık yayın mantığı tamamlanmamış.
- Flutter map pin provider tarafında endpoint standardı net değil:
  - Genel `/v1/pins` ve `/v1/flares` kullanılıyor.
  - Help için `/v1/map/help` kullanılıyor.
  - Harita için canonical endpoint'in `/v1/map/*` mı yoksa genel liste endpointleri mi olduğu Kişi 2 ile netleşmeli.
- `docs/KISI_1_TRACK.md` checklist'i kodun güncel durumunu yansıtmıyor; birçok madde kodda yapılmış olmasına rağmen dokümanda boş görünüyor.

### Başka Kişiye Sorulacak Konu

Kişi 2 / Erol'a sorulacak önerilen mesaj:

```text
Erol, Kişi 1 harita tarafında pin/flare/help fetch standardını netleştireceğiz.
Harita ekranında `/v1/map/pins`, `/v1/map/flares`, `/v1/map/help` endpointlerini current `h3cell` + `k` ile mi kullanmamızı istiyorsun, yoksa genel `/v1/pins` ve `/v1/flares` liste endpointleri harita için de canonical mı?
Ona göre mobile provider'ı tek standarda çekeceğiz.
```

### Sıradaki Kişi 1 İş Önerisi

Backend kontratı netleşmeden Kişi 2 dosyalarına dokunulmayacak.

Bizim doğrudan yapabileceğimiz en uygun Kişi 1 işi:

1. Go realtime tarafında `subscribe_cell` / `unsubscribe_cell` mesajlarını tasarlamak.
2. Client subscription state'i eklemek.
3. H3 k-ring üyeliğine göre yalnızca ilgili client'lara broadcast yapmak.
4. Mevcut `SendToAll` heatmap davranışını daha kontrollü hale getirmek.
5. Bu davranışı Go unit testleriyle kapsamak.

### İş 1 — WS Cell Subscription ve Hedefli Heatmap Broadcast

Yapıldı:

- Go realtime `InboundMessage` içine `k` alanı eklendi.
- Go WS mesaj tiplerine `subscribe_cell` ve `unsubscribe_cell` eklendi.
- Her WS client için subscription state'i eklendi.
- `ghost_on` geldiğinde kullanıcının konumu silinirken subscription state'i de temizleniyor.
- Hub'a `SendToSubscribers(h3Cell, msg)` eklendi.
- Broadcaster artık heatmap update mesajını `SendToAll` yerine `SendToSubscribers` ile gönderiyor.
- İlk hedefli yayın mantığı aynı res-8 heatmap parent bölgesine abone olan client'lara gönderim yapıyor.
- Flutter `WsService` içine `subscribeCell` ve `unsubscribeCell` eklendi.
- Flutter `LocationNotifier`, her H3 konum güncellemesinde:
  - `location` mesajı gönderiyor.
  - aynı hücre için `subscribe_cell` mesajı gönderiyor.
- Flutter tracking durduğunda:
  - son hücre için `unsubscribe_cell` gönderiyor.
  - ardından `ghost_on` gönderiyor.

Not:

- Bu adım gerçek k-ring grid-disk genişletmesinin altyapısıdır.
- Şu an hedefleme aynı heatmap parent üzerinden çalışıyor; tam k-ring üyelik hesabı ayrı bir sonraki Go işi olarak ele alınmalı.

Doğrulama:

- `go test ./...` geçti.
- `flutter test` geçti.
- `flutter analyze` geçti.

### İş 2 — Flutter WS Bağlantı Idempotency ve Reconnect Düzeltmesi

Yapıldı:

- `WsService.connect` aynı token ile tekrar çağrılırsa ikinci bir WebSocket bağlantısı açmayacak hale getirildi.
- Token değişirse eski subscription/channel kapatılıp yeni token ile temiz bağlantı açılıyor.
- `WsService.disconnect` eklendi.
- Auth session token yoksa `wsConnectionProvider` artık bağlantıyı kapatıyor.
- Reconnect backoff'un her reconnect denemesinde sıfırlanması engellendi.
- Reconnect artık önce 3 sn, sonra 6 sn, 12 sn şeklinde ilerleyebiliyor.

Neden:

- `PitlaneApp` rebuild olduğunda veya auth stream tekrar data verdiğinde aynı token ile birden fazla WS açılma riski vardı.
- Çoklu WS bağlantısı, aynı kullanıcının Valkey/heatmap state'inde gereksiz gürültü oluşturabilirdi.

Doğrulama:

- `dart format` çalıştırıldı.
- `flutter analyze` geçti.
- `flutter test` geçti.

### İş 9 — V2.1 Realtime Follow Presence Çekirdeği

Sprint 1 / Kişi 1 V2 kapsamında yapıldı:

- WS inbound kontratına `subscribe_user` ve `unsubscribe_user` eklendi.
- WS outbound kontratına `presence_update` ve `location_share` eklendi.
- Go realtime client'ı takip edilen kullanıcı aboneliklerini tutacak hale getirildi.
- `location_share` fanout'u sadece ilgili kullanıcıya subscribe olan client'lara gönderiliyor.
- Gürültüyü azaltmak için aynı H3 cell'de 30 saniye cooldown eklendi; H3 cell değişirse event hemen gönderiliyor.
- Ghost mode aktifken konum store'a yazılmıyor ve `location_share` gönderilmiyor.
- Valkey follow cache desteği eklendi: `follows:<user_id>` set'i `subscribe_user` güvenlik kontrolünde okunuyor.
- Follow cache izin vermiyorsa `subscribe_user` `FORBIDDEN` döner; arbitrary kullanıcı takibi engellendi.
- `docs/KISI_1_TRACK_V2.md` içinde V2.1 Go realtime maddeleri tamamlandı olarak işaretlendi.

Doğrulama:

- `gofmt` çalıştırıldı.
- `go test ./... -race` geçti.
- `go run github.com/golangci/golangci-lint/cmd/golangci-lint@latest run` geçti.

### İş 10 — V2.1 Flutter Followed User Locations Provider

Sprint 1 / Kişi 1 V2 kapsamında yapıldı:

- Flutter WS service `presence_update` ve `location_share` eventlerini parse edecek hale getirildi.
- WS reconnect sonrası `subscribe_user` abonelikleri otomatik tekrar gönderiliyor.
- `/v2/follows/following` endpoint'inden takip edilen kullanıcı ID'lerini çeken repository eklendi.
- `followedUserLocationsProvider` eklendi; takip edilen kullanıcıların son H3 cell ve presence durumunu tutuyor.
- `followedUserPinsProvider` eklendi; H3 cell'i harita marker pozisyonuna çevirip takip edilen kullanıcı pinlerini üretiyor.
- Map screen normal pinlerle takip edilen kullanıcı pinlerini birlikte render ediyor.
- Offline kullanıcılar haritada gösterilmiyor.
- `docs/KISI_1_TRACK_V2.md` içinde Flutter `followed_users_locations_provider` maddesi tamamlandı olarak işaretlendi.

Doğrulama:

- `dart format --output=none --set-exit-if-changed lib/ test/` geçti.
- `flutter analyze` geçti.
- `flutter test` geçti.
- `go test ./... -race` geçti.

### İş 11 — V2 Sprint 1 Map Filtreleri, Konum Paylaşımı ve Araç İkon Altyapısı

Kişi 1 sınırında yapıldı:

- Map filter modeline `hideBusinesses` eklendi.
- Filter sheet'e "Takip" filtresi, "İşletmeleri gizle" ve "Konumumu takipçilerle paylaş" kontrolleri eklendi.
- "Sadece takip ettiklerim" filtresi `followedUserPinsProvider` ile bağlandı.
- "İşletmeleri gizle" filtresi business marker'larını haritadan düşürüyor.
- Araç tipi heatmap filtresi `/v2/map/heatmap?vehicle_type=any|car|motorcycle` kontratına bağlandı.
- Konum paylaşımı kapalıyken mobile tarafı WS `location` mesajı göndermiyor; yerel H3 takibi ve cell subscription devam ediyor.
- Araç ikonları için local `VehicleIconSlug` katalog modeli eklendi.
- Marker başına tekrar render yapmamak için `VehicleMarkerIconCache` / `BitmapDescriptor` cache altyapısı eklendi.
- `docs/KISI_1_TRACK_V2.md` içinde V2.1 konum paylaşımı ve V2.4 Flutter filtre maddeleri tamamlandı olarak işaretlendi.

Not:

- `GET /v2/vehicles/icons` ve `vehicles.icon_slug` backend kontratı bekleniyor; araç ikon cache'i şimdilik altyapı olarak hazır.

Doğrulama:

- `dart format --output=none --set-exit-if-changed lib/ test/` geçti.
- `flutter analyze` geçti.
- `flutter test` geçti.
- `go test ./... -race` geçti.

### İş 7 — V2 Vehicle Filtered Heatmap Snapshot Kontratı

Erol'dan gelen kontrat:

- Backend endpoint: `GET /v2/map/heatmap?vehicle_type=any|car|motorcycle`
- Realtime/Valkey snapshot key'leri:
  - `heatmap:snapshot`
  - `heatmap:snapshot:vehicle:car`
  - `heatmap:snapshot:vehicle:motorcycle`
- Beklenen value formatı: H3 cell -> user count JSON map.

Yapıldı:

- WebSocket `location` mesajına opsiyonel `vehicle_type` alanı eklendi.
- Go realtime store interface'i araç tipine göre cell count ve snapshot yazımı destekleyecek şekilde genişletildi.
- In-memory store'da `car` ve `motorcycle` filtreli heatmap sayımları eklendi.
- Valkey store'da `loc:<user>` raw H3 formatında bırakıldı; backend fallback kırılmasın diye araç tipi ayrı `locveh:<user>` key'inde tutuldu.
- Broadcaster her heatmap yayını sırasında üç snapshot key'ini Valkey'e yazacak hale getirildi.
- `docs/KISI_1_TRACK_V2.md` içinde V2.4 Go realtime/backend snapshot maddeleri tamamlandı olarak işaretlendi.

Doğrulama:

- `gofmt` çalıştırıldı.
- `go test ./... -race` geçti.
- `go run github.com/golangci/golangci-lint/cmd/golangci-lint@latest run` geçti.

### İş 8 — Flutter CI Format Hatası Düzeltmesi

Sebep:

- GitHub Actions Flutter job'ı `dart format --output=none --set-exit-if-changed lib/ test/` adımında kalıyordu.
- CI logunda formatlanması gereken dosya `apps/mobile/lib/src/features/profile/data/profile_repository.dart` olarak görünüyordu.

Yapıldı:

- `getCurrentProfile` içindeki tek satırlık null kontrolü blok forma çekildi.
- Satır sonu yorumunun formatter tarafından farklı biçimlenmesi engellendi.

Doğrulama:

- `dart format --output=none --set-exit-if-changed lib/ test/` geçti.
- `flutter analyze` geçti.
- `flutter test` geçti.

### İş 7 — Realtime Server-Side k-ring ve Valkey Pub/Sub

Yapıldı:

- Go realtime subscription ilgisi artık yalnızca aynı heatmap parent'a bakmıyor.
- `subscribe_cell` ile gelen `k` değeri server tarafında gerçek H3 `GridDisk` hesabıyla kullanılıyor.
- `github.com/uber/h3-go/v4` eklendi.
- Realtime Docker build cgo kullanan H3 dependency için static cgo build'e alındı.
- `location.CellWithinKRing(originCell, targetCell, k)` helper'ı eklendi.
- `Client.isInterestedIn` gerçek k-ring üyeliğine göre karar verecek şekilde güncellendi.
- Valkey varsa heatmap update mesajları `heatmap:updates` kanalına publish ediliyor.
- Her realtime instance aynı kanalı subscribe ediyor ve başka instance'lardan gelen heatmap update'leri kendi local subscriber'larına dağıtıyor.
- Aynı instance'ın kendi yayınını tekrar dağıtmaması için origin id kontrolü eklendi.
- Valkey Pub/Sub yoksa in-memory/local broadcast davranışı bozulmadan devam ediyor.
- `docs/KISI_1_TRACK.md` k-ring ve Pub/Sub durumuna göre güncellendi.

Doğrulama:

- `gofmt` çalıştırıldı.
- `go mod tidy` çalıştırıldı.
- `go test ./... -race` geçti.
- `go run github.com/golangci/golangci-lint/cmd/golangci-lint@latest run` geçti.
- `git diff --check` geçti.
- `docker build -t rollpit-realtime:test .` geçti.

### İş 8 — Backend Help Event → Go Realtime Internal Endpoint

Erol'dan gelen karar:

- Backend help request create/assign başarılı olduktan sonra Go realtime servisine internal HTTP event atacak.
- Endpoint: `POST /internal/realtime/help-event`
- Auth: `Authorization: Bearer <GO_WS_INTERNAL_SECRET>`
- Prod base URL: `https://realtime.rollpit.com`

Yapıldı:

- Go realtime config'e `GO_WS_INTERNAL_SECRET` eklendi.
- `.env.example` içine `GO_WS_INTERNAL_SECRET` eklendi.
- `POST /internal/realtime/help-event` endpoint'i eklendi.
- `help_created` payload'ı kabul ediliyor:
  - `help_request_id`
  - `h3_cell`
  - `requester_id`
  - `issue_type`
- `help_assigned` payload'ı kabul ediliyor:
  - `help_request_id`
  - `h3_cell`
  - `requester_id`
  - `helper_id`
- Endpoint yalnızca Bearer internal secret ile çalışıyor.
- Geçerli help event gelince `help_nearby` WS mesajı k-ring 2 içindeki subscriber'lara gönderiliyor.
- `docs/KISI_1_TRACK.md` Sprint 5 help k-ring maddesi tamamlandı olarak güncellendi.

Doğrulama:

- `gofmt` çalıştırıldı.
- `go test ./... -race` geçti.
- `go run github.com/golangci/golangci-lint/cmd/golangci-lint@latest run` geçti.

### İş 9 — Realtime `.env` Smoke Test

Yapıldı:

- `apps/realtime/.env` içinde `VALKEY_ADDR` ve `SUPABASE_JWT_SECRET` bulunduğu doğrulandı.
- `GO_WS_INTERNAL_SECRET` mevcut `.env` içinde yoktu; smoke test için geçici local secret kullanıldı.
- Mevcut 8080 portunda eski realtime süreci çalıştığı için yeni kod 18080 portunda ayağa kaldırıldı.
- Realtime servisinin Valkey store bağlantısı başarılı oldu.
- Realtime servisinin Valkey Pub/Sub bağlantısı başarılı oldu.
- `/health` endpoint'i test edildi.
- `/internal/realtime/help-event` auth ve payload davranışı test edildi.

Doğrulama:

- `GET /health` → `200`
- Auth header olmadan `POST /internal/realtime/help-event` → `401`
- Geçici internal secret ile valid `help_created` payload → `202`
- Geçici internal secret ile invalid `h3_cell` payload → `400`

Not:

- Kalıcı backend entegrasyonu için aynı `GO_WS_INTERNAL_SECRET` değeri backend ve realtime env'lerinde set edilmeli.
- Smoke test için açılan 18080 realtime süreci test sonunda kapatıldı.
- `go test ./...` geçti.

### İş 3 — WS Subscription Yaşam Döngüsü ve Reconnect Resubscribe

Yapıldı:

- `WsService` artık aktif cell subscription'larını local map içinde takip ediyor.
- `subscribeCell` subscription'ı kaydedip WS'e gönderiyor.
- `unsubscribeCell` subscription'ı local state'ten silip WS'e gönderiyor.
- Reconnect sonrası mevcut subscription'lar otomatik tekrar server'a gönderiliyor.
- Auth logout / token kaybı durumunda `disconnect(clearSubscriptions: true)` ile subscription state temizleniyor.
- `LocationNotifier` artık konum hücresi değiştiğinde eski hücre aboneliğini kaldırıp yeni hücreye abone oluyor.
- Tracking durduğunda son abone olunan hücre temizleniyor, ardından `ghost_on` gönderiliyor.

Neden:

- Önceki durumda konum değiştikçe eski hücre abonelikleri birikebilirdi.
- WS reconnect olduğunda Go tarafındaki client subscription state'i kaybolduğu için client tekrar abone olmuyordu.

Doğrulama:

- `dart format` çalıştırıldı.
- `flutter analyze` geçti.
- `flutter test` geçti.
- `go test ./...` geçti.

### İş 4 — Rollpit Realtime Fly.io Deploy Konfigürasyonu

Erol'dan gelen prod kararları:

- Provider: Fly.io
- Fly app adı: `rollpit-realtime`
- Public domain: `realtime.rollpit.com`
- Flutter prod `WS_BASE_URL`: `wss://realtime.rollpit.com`
- Final endpoint: `wss://realtime.rollpit.com/ws/location?token=<JWT>`
- Cloudflare CNAME hedefi: `rollpit-realtime.fly.dev`

Yapıldı:

- `apps/realtime/fly.toml` eklendi.
- Fly app adı `rollpit-realtime` olarak ayarlandı.
- Region `fra`, port `8080`, production env ve `/health` check tanımlandı.
- WebSocket için Fly auto-stop kapalı tutuldu.
- Connection concurrency limitleri eklendi.
- `apps/realtime/.env.example` prod secret kullanımını belgelemek için güncellendi.
- Production WebSocket origin kontrolünde native mobile client'ların boş `Origin` header ile bağlanabilmesi sağlandı.
- Web client'lar için unknown origin reddi korunuyor.

Secret notu:

- `VALKEY_ADDR` ve `SUPABASE_JWT_SECRET` gerçek değerleri dosyaya yazılmadı.
- Prod'da Fly secrets olarak set edilmeli.

Doğrulama:

- `gofmt` çalıştırıldı.
- `go test ./...` geçti.
- `fly config validate --config apps/realtime/fly.toml` denenemedi; local makinede Fly CLI bulunamadı.

### İş 5 — Main Merge Sonrası Realtime Go CI Düzeltmesi

Sebep:

- `main` branch'i Rollpit isimlendirmesine geçmişti.
- Kişi 1 branch'inde `apps/realtime/internal/hub/h3_interest.go` hâlâ eski `github.com/Ayazaga-Boys/pitlane/...` import path'ini kullanıyordu.
- `apps/realtime/go.mod` ise `github.com/Ayazaga-Boys/rollpit/apps/realtime` modülüne geçmişti.
- Bu mismatch GitHub Actions'ta `CI / go` ve `CI / lint-go` job'larını kırıyordu.

Yapıldı:

- `origin/main` Kişi 1 branch'ine merge edildi.
- Realtime internal import path'i `rollpit` modül adına göre düzeltildi.
- Go CI sürümü `1.24` ile eşlendi.
- `apps/realtime/.golangci.yml` içindeki `goimports.local-prefixes` Rollpit path'ine güncellendi.
- Realtime Docker build image'ı Go `1.24` ile eşlendi.
- `go mod tidy` çalıştırıldı; Redis dependency sınıflaması ve gerekli `go.sum` kayıtları güncellendi.
- `hub_test.go` içindeki test request'leri lint'in istediği şekilde `http.NewRequestWithContext` kullanacak hale getirildi.

Doğrulama:

- `go test ./... -race` geçti.
- `go run github.com/golangci/golangci-lint/cmd/golangci-lint@latest run` geçti.
- `git diff --check` geçti.

### İş 6 — Harita Endpoint Standardını `/v1/map/*` Kontratına Çekme

Erol'dan gelen karar:

- Harita ekranı için canonical endpoint standardı `/v1/map/*`.
- `/v1/pins` ve `/v1/flares` resource/list/CRUD ekranları için kalacak.
- Mobile map provider tarafı tüm harita verisini `h3cell` + `k` ile istemeli.

Yapıldı:

- Branch `origin/main` ile fast-forward eşlendi.
- Flutter map provider business pinleri artık `/v1/map/pins?h3cell=&k=` üzerinden çekiyor.
- Flutter map provider flare pinleri artık `/v1/map/flares?h3cell=&k=` üzerinden çekiyor.
- Help pinleri mevcut `/v1/map/help?h3cell=&k=` standardında tutuldu.
- `H3Constants` içine harita endpoint k-ring sabitleri eklendi:
  - `flareKRing = 2`
  - `businessPinKRing = 3`
  - `helpKRing = 2`
- Kullanıcı konumu yoksa map endpointleri için İstanbul fallback H3 hücresi kullanılmaya devam ediyor.
- `docs/KISI_1_TRACK.md` güncel kod durumuna göre işaretlendi.

Doğrulama:

- `dart format` çalıştırıldı.
- `flutter analyze` geçti.
- `flutter test` geçti.

### İş 7 — V2 Harita Araç İkonları, Foto-Bubble İşletmeler ve Load Test Hazırlığı

Yapıldı:

- Branch `origin/main` ile fast-forward eşlendi; Erol'un PR #60 backend V2 işleri alındı.
- `GET /v2/business/locations/nearby?h3cell=&k=&category=` mobile map pin kaynağına bağlandı.
- Business pin modeli `photo_url`, kategori, adres, telefon ve web alanlarıyla genişletildi.
- Haritada işletmeler için foto-bubble marker çizimi eklendi.
- Foto-bubble marker zoom seviyesine göre boyutlanır hale getirildi.
- Business marker tap ve info-window tap aksiyonu işletme detay bottom sheet açacak şekilde bağlandı.
- İşletme detay sheet içinde foto, ad, kategori, adres ve temel aksiyonlar gösterildi.
- Takip edilen kullanıcı marker'ları için aktif araç `icon_slug` okuma eklendi.
- `VehicleMarkerIconCache`, Erol'un `/v2/vehicles/icons` slug kontratındaki 11 araç ikonunu tanıyacak şekilde genişletildi.
- Zoom `< 12` iken takip edilen kullanıcılar generic marker, zoom `>= 12` iken `icon_slug` tabanlı araç marker kullanır hale getirildi.
- Kendi konum demo marker'ında cache'lenmiş araç ikonu ve mavi outline vurgusu fallback olarak bağlandı.
- 1000 marker için cluster item stress testi eklendi.
- Story fan-out için `apps/realtime/load-test/ws_v2_social_fanout.js` k6 senaryosu eklendi.
- `docs/KISI_1_TRACK_V2.md` tamamlanan Kişi 1 maddelerine göre güncellendi.

Doğrulama:

- `dart format` çalıştırıldı.
- `flutter analyze` geçti.
- `flutter test` geçti.
- `go test ./... -race` geçti.
- `golangci-lint run` denenemedi; local makinede `golangci-lint` komutu bulunamadı.

Not:

- `apps/mobile/run_dev.sh` beklenen untracked local dosya olarak bırakıldı, commit'e alınmadı.
- Gerçek cihaz FPS doğrulaması ve k6 p95 sonucu ortam/seed gerektirdiği için senaryo hazırlandı; koşum prod/dev Valkey follow cache seed'iyle yapılmalı.
