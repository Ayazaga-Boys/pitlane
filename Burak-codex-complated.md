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
- `go test ./...` geçti.
