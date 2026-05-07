# 01 — Proje Genel Bakış

## Vizyon

> "Otomobil ve motosiklet tutkunlarının dünyasını gerçek zamanlı bir haritada birleştirmek."

Pitlane, bir kullanıcı uygulamayı açtığında **şehrindeki diğer araç/motor sahiplerini, anlık etkinlikleri (cruise, buluşma, yarış izleme), acil yardım çağrılarını ve güvenilir tamircileri tek bir harita üzerinde** görmesini sağlar. Reklamsızdır; gelir modeli **işletme pinleri (sponsorlu)** ve **isteğe bağlı premium üyelik** üzerine kuruludur.

## Hedef Kullanıcı

| Persona | Tanım | Birincil Değer |
|---|---|---|
| **Genç motor sahibi (18-30)** | İlk motoru, hafta sonu cruise'larına çıkıyor | Yakındaki cruise'ları görmek, grup mesajlaşma |
| **Tutkulu araç sahibi (25-45)** | Modifiye, klasik veya performans aracı | Topluluk, "Haftanın Aracı" görünürlük |
| **Yolda kalan sürücü** | Her segment | Acil yardım sinyali, en yakın tamirci |
| **Bağımsız tamirci/garaj** | İşletme | Sponsorlu pin, kampanya, müşteri akışı |
| **Etkinlik organizatörü** | Topluluk lideri | Flare oluşturma, RSVP yönetimi |

## Eşsiz Değer Önerisi

1. **Konum mahremiyeti varsayılan açık.** Kimse tam GPS'inizi göremez; H3 hücresine yuvarlanır.
2. **Reklamsız.** Sadece doğrulanmış işletme pinleri.
3. **2-tekerli + 4-tekerli birlikte**, ayrılmış değil. Filtreyle ayrılabilir.
4. **Acil yardım** birinci sınıf vatandaş. WhatsApp grupları üzerinden değil, sistemli.
5. **Snapchat-tarzı kamera**, ama otomotiv overlay'leri (vites, hız, etiket).

## MVP Kapsamı (V1.0 — App Store / Play Store yayını)

### Dahil Olanlar

1. **Kayıt / Giriş** — Apple, Google, e-posta + OTP. Profil: kullanıcı adı, avatar, araç(lar).
2. **Harita & Canlı Yoğunluk** — H3 res-8 ısı haritası, res-9 yakınlık. Hayalet mod toggle.
3. **Topluluklar** — Marka/model/şehir bazlı, public/private. Roller: kaptan, moderatör, üye.
4. **Flares (Etkinlikler)** — Anlık veya planlı, harita pini, RSVP, sohbet odası.
5. **İşletme Pinleri** — Doğrulanmış tamirci/garaj, kampanya kartı, "yol tarifi al".
6. **Acil Yardım Sinyali** — Tek dokunuş, ~500m hücreye yayın, yardım edenle 1-1 sohbet.
7. **Mesajlaşma** — DM (1-1), topluluk odası, flare sohbeti. Realtime via Supabase.
8. **Snap Kamera** — Foto + 15s video, otomotiv filtreleri, müzik, etiket. R2/Stream'e direkt yükleme.
9. **Bildirimler** — APNs + FCM. Yakındaki yardım çağrısı, flare daveti, mesaj.
10. **Ayarlar / Mahremiyet** — Hayalet mod, blok listesi, hesap silme (KVKK/GDPR).

### Hariç (Faz 2)

- Yarışmalar / "Haftanın Aracı" oylama
- AR overlay
- Premium abonelik (ek istatistik, özel rozetler)
- Pazaryeri (parça/araç ilanı)
- Tour planner (çoklu durak rota)
- Yarış pisti modu (lap timer)

## Başarı Metrikleri (V1.0)

| Metrik | 90 gün hedefi |
|---|---|
| MAU (Aylık Aktif Kullanıcı) | 25.000 |
| 7-gün retention | %35 |
| Günlük flare oluşturma | 200+ |
| Acil yardım yanıt süresi (ortalama) | < 8 dk |
| Crash-free users | %99.5 |
| App Store puanı | ≥ 4.5 |
| P95 harita ilk frame süresi | < 1.2 sn |

## Rakip Konumlandırma

| Rakip | Bizim Farkımız |
|---|---|
| **Strava** | Spor değil, otomotiv. Konum mahremiyeti varsayılan açık. |
| **Snapchat Map** | Genel değil, otomotiv niş. Topluluk + acil yardım var. |
| **WhatsApp grupları** | Yapılandırılmış (rol, RSVP, harita), aranabilir, kalıcı. |
| **Instagram** | Harita yok, gerçek zamanlı yok, mesajlaşma akışı zayıf. |
| **REVER / Calimoto** | Sadece moto, sadece rota. Sosyal layer eksik. |

## Yasal & Uyumluluk

- **KVKK + GDPR** uyumlu. Veri minimizasyonu (H3, ham GPS persist edilmez).
- **Konum izni** kullanıcıya neden istendiğini açıklayan onboarding ekranı zorunlu (Apple ATT + Android 13+ rationale).
- **18+** kayıt yaşı (App Store kategorisi 4+ tutmak için içerik moderasyonu).
- **Topluluk Kuralları** + **Şikayet & Engelleme** ürün-içi (Apple Guideline 1.2).
- **Hesap silme** ürün-içi (Apple Guideline 5.1.1(v)).

## Faz Planı (Yüksek Seviye)

| Faz | Süre | Çıktı |
|---|---|---|
| **F0 — Hazırlık** | 1 hafta | Repo, CI/CD, ortamlar, tasarım sistemi, Figma final |
| **F1 — MVP Sprintleri (S1-S6)** | 12 hafta | TestFlight + Internal Testing yayını |
| **F2 — Beta** | 4 hafta | 500 davetli kullanıcı, kapalı beta, geri bildirim |
| **F3 — Public Launch** | 2 hafta | App Store + Play Store yayını |
| **F4 — Faz 2 Özellikleri** | 8+ hafta | Yarışmalar, premium, AR |
