# 15 — Tasarım Sistemi

> Rollpit görsel kimliğinin kuralları. Figma kütüphanesi `rollpit-design-system` ile birebir senkron.
> Tasarımcı ve geliştirici için tek doğruluk kaynağı.

---

## 1. Marka Kimliği

### Logo

| Versiyon | Kullanım | Dosya |
|---|---|---|
| Primary (yatay) | Web, sunum | `assets/brand/logo-horizontal.svg` |
| Mark (kare) | Uygulama ikonu, avatar | `assets/brand/logo-mark.svg` |
| Mono (siyah) | Faturalar, baskı | `assets/brand/logo-mono.svg` |
| White-out | Koyu zemin | `assets/brand/logo-white.svg` |

**Logo etrafında minimum boşluk:** Logo yüksekliğinin yarısı kadar.
**Min. boyut (dijital):** 24 px yükseklik (mark), 80 px genişlik (yatay).

### İsimlendirme

- Marka adı: **Rollpit** (P büyük, gerisi küçük). "PitLane", "ROLLPIT" yazılışları yanlıştır.
- Slogan (TR): "Asfaltta yalnız değilsin."
- Slogan (EN): "Never ride alone."

---

## 2. Renk Paleti

### Birincil (Brand)

| Token | Hex | RGB | Kullanım |
|---|---|---|---|
| `pit-red`        | `#E63946` | 230, 57, 70   | Birincil aksiyon, vurgu |
| `pit-red-deep`   | `#B72836` | 183, 40, 54   | Hover/pressed |
| `pit-red-soft`   | `#FFD9DC` | 255, 217, 220 | Bilgi rozetleri |

### Yüzey (Dark Theme — Varsayılan)

| Token | Hex | Kullanım |
|---|---|---|
| `surface-0`        | `#0F0F1A` | App arka planı (en derin) |
| `surface-1`        | `#1A1A2E` | Scaffold |
| `surface-2`        | `#16213E` | Kart, sheet |
| `surface-3`        | `#1F2A4A` | Yükseltilmiş kart |
| `surface-overlay`  | `rgba(15,15,26,0.65)` | Modal arka plan |

### Yüzey (Light Theme — Faz 2)

| Token | Hex | Kullanım |
|---|---|---|
| `light-surface-0` | `#FFFFFF` | App arka planı |
| `light-surface-1` | `#F5F5F8` | Scaffold |
| `light-surface-2` | `#FFFFFF` | Kart |

> Light theme V1.0'da yok; Faz 2'de eklenir. Şimdilik Material `useMaterial3 + brightness: dark` zorunludur.

### Metin

| Token | Hex | Kullanım |
|---|---|---|
| `text-primary`   | `#FFFFFF` | Başlık, body |
| `text-secondary` | `#B0B0B0` | Yardımcı, meta |
| `text-tertiary`  | `#6B6B7B` | Disabled, hint |
| `text-on-brand`  | `#FFFFFF` | Pit-red üstü metin |

### Sistem Renkleri

| Token | Hex | Anlam |
|---|---|---|
| `success` | `#06D6A0` | Başarılı RSVP, doğrulama |
| `warning` | `#FFB703` | Düşük pil, kapsam dışı |
| `error`   | `#EF476F` | Hata, ban, silme |
| `info`    | `#4CC9F0` | Bilgi banner |

### Yardım Sinyali (Özel)

Acil yardım pini benzersiz olmalı, normal pinlerden ayrılmalı:

```dart
// Pulse animasyonu ile çevrilen yardım pini
const helpRingColor = Color(0xFFEF476F);   // error
const helpRingOpacity = 0.30;
const helpRingPulseDurationMs = 1400;
```

### H3 Heatmap Gradient

| Yoğunluk | Renk |
|---|---|
| Düşük (1-2 kullanıcı) | `#0096C7` (cool blue) |
| Orta (3-7 kullanıcı)  | `#FFB703` (warm yellow) |
| Yüksek (8+ kullanıcı) | `#E63946` (pit-red) |

Aralık fonksiyonu: `lerp(blue → yellow → red, intensity)`.

---

## 3. Tipografi

### Yazı Tipi Ailesi

- **Birincil:** Inter (Google Fonts, OFL lisans)
- **Sayısal/Mono:** JetBrains Mono (sadece hız/zaman göstergeleri)

```yaml
# pubspec.yaml
flutter:
  fonts:
    - family: Inter
      fonts:
        - asset: assets/fonts/Inter-Regular.ttf
          weight: 400
        - asset: assets/fonts/Inter-Medium.ttf
          weight: 500
        - asset: assets/fonts/Inter-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/Inter-Bold.ttf
          weight: 700
    - family: JetBrainsMono
      fonts:
        - asset: assets/fonts/JetBrainsMono-Regular.ttf
          weight: 400
```

### Tip Ölçeği

| Token | Boyut | Satır Yüks. | Ağırlık | Kullanım |
|---|---|---|---|---|
| `display-xl` | 32 | 40 | 700 | Onboarding başlık |
| `display-lg` | 28 | 36 | 700 | Ekran başlık (büyük) |
| `display-md` | 24 | 32 | 600 | Ekran başlık |
| `title-lg`   | 20 | 28 | 600 | Bölüm başlığı |
| `title-md`   | 18 | 26 | 600 | Kart başlığı |
| `title-sm`   | 16 | 22 | 600 | Liste öğesi |
| `body-lg`    | 16 | 24 | 400 | Sohbet mesajı, paragraf |
| `body-md`    | 14 | 20 | 400 | Genel body |
| `body-sm`    | 13 | 18 | 400 | Meta, alt yazı |
| `label-md`   | 14 | 18 | 500 | Buton, etiket |
| `label-sm`   | 12 | 16 | 500 | Mikro etiket, rozet |
| `caption`    | 11 | 14 | 400 | İmza, zaman damgası |

### Dynamic Type (iOS) / Font Scale (Android)

- Tüm metinler `MediaQuery.textScaler` ile ölçeklenir.
- Maksimum scale `2.0` (üzerine taşma testi yapılır).
- Minimum scale `0.85`.

---

## 4. Boşluk (Spacing)

8 px tabanlı sistem. Sabitler `core/theme/app_spacing.dart` altında.

| Token | px | Tipik kullanım |
|---|---|---|
| `space-2xs` | 2 | Rozet iç dolgu |
| `space-xs`  | 4 | İkon-metin arası |
| `space-sm`  | 8 | Liste öğeleri arası |
| `space-md`  | 12 | Kart iç dolgu |
| `space-lg`  | 16 | Bölüm dolgusu |
| `space-xl`  | 24 | Ekran kenar dolgusu |
| `space-2xl` | 32 | Bölüm aralığı |
| `space-3xl` | 48 | Büyük başlık üstü |

**Kural:** UI'da kullanılan her boşluk bu skalayla hizalı olmalı. Magic number yasak (`Mimari Kural #3`).

---

## 5. Radius (Köşe Yuvarlama)

| Token | px | Kullanım |
|---|---|---|
| `radius-xs` | 4  | Rozet, küçük chip |
| `radius-sm` | 8  | Buton, input |
| `radius-md` | 12 | Kart, sheet üst |
| `radius-lg` | 16 | Modal sheet, büyük kart |
| `radius-xl` | 24 | Hero kart |
| `radius-pill` | 999 | Avatar, pill chip |

---

## 6. Gölge (Shadow / Elevation)

| Token | Spread | Color | Kullanım |
|---|---|---|---|
| `elev-1` | `0 1px 2px` | `rgba(0,0,0,0.20)` | Liste öğesi |
| `elev-2` | `0 4px 8px` | `rgba(0,0,0,0.25)` | Kart |
| `elev-3` | `0 8px 16px` | `rgba(0,0,0,0.30)` | Modal, sheet |
| `elev-pin` | `0 2px 6px` | `rgba(230,57,70,0.40)` | Aktif harita pini |

> Dark theme'de gölgenin görünmesi için arka plan `surface-0` veya `surface-1` olmalı.

---

## 7. İkonografi

- **Set:** Lucide Icons (1.0 stroke, 24×24 base)
- **Paket:** `lucide_icons_flutter` veya manuel SVG asset
- **Stroke width:** 1.5 (Rollpit'in özelleştirilmiş varyantı)
- **Renk:** Bağlama göre `text-primary` veya `text-secondary`
- **Boyutlar:** 16, 20, 24, 32, 48 (sabit basamaklar)

### Özel İkon Listesi (Rollpit'e Özgü)

| İsim | Anlam |
|---|---|
| `helmet` | Motosiklet kullanıcı |
| `steering-wheel` | Otomobil kullanıcı |
| `flare` | Etkinlik (alev) |
| `sos` | Acil yardım |
| `pit-pin` | İşletme pini |
| `ghost` | Hayalet mod |

---

## 8. Komponent Kataloğu

### Buton

| Variant | Background | Text | Border | Kullanım |
|---|---|---|---|---|
| `primary`     | `pit-red` | `white` | none | Birincil aksiyon |
| `secondary`   | `surface-3` | `text-primary` | none | İkincil |
| `ghost`       | transparent | `pit-red` | `1px pit-red` | Üçüncül |
| `destructive` | `error` | `white` | none | Sil, ban |
| `text`        | transparent | `pit-red` | none | İptal, vazgeç |

Boyutlar: `sm` (32 h), `md` (44 h, varsayılan, dokunma hedefi 44+), `lg` (52 h).
Loading: `CircularProgressIndicator` (16) ile metin yer değiştirir.

### Avatar

- Boyutlar: 24, 32, 40, 48, 64, 96
- Yuvarlak (radius-pill), 1px `surface-3` border.
- Doğrulanmış kullanıcı: sağ alt 14×14 mavi tik rozet.

### Input

```
┌────────────────────────────────────┐
│  Label                             │
│  ┌──────────────────────────────┐  │
│  │  Placeholder veya değer      │  │
│  └──────────────────────────────┘  │
│  Yardımcı / hata metni             │
└────────────────────────────────────┘
```

- Yükseklik: 48 px
- Dolgu: 12 px yatay, 14 px dikey
- Border (idle): `surface-3` 1px
- Border (focus): `pit-red` 2px
- Border (error): `error` 2px + alt metin `error` rengi

### Snackbar

- Konum: alt ortada, `space-xl` alt boşluk
- Genişlik: ekran - 32
- Süre: 3 sn (default), 6 sn (uzun)
- Variant: success / error / info

### Modal Sheet (Bottom Sheet)

- Üstte 32×4 grab handle (`text-tertiary` rengi)
- Üst köşeler `radius-lg`
- Drag-to-dismiss aktif
- Maksimum yükseklik: ekran - 64

### V2 Sosyal Komponent Kuralları

#### Avatar + Presence

| Kullanım | Avatar çapı | `AppAvatar.radius` | Presence dot |
|---|---:|---:|---:|
| Mini meta / reaction | 24 | 12 | 6 |
| Liste kompakt | 32 | 16 | 8 |
| Liste varsayılan | 40 | 20 | 8 |
| Profil header | 56 | 28 | 10 |
| Profil hero | 88 | 44 | 12 |

- Avatar her zaman `AppAvatar` ile render edilir; boş görselde initials fallback zorunludur.
- Presence sadece kullanıcı izin verdiyse görünür; `presence_visible = false` ise dot tamamen saklanır.
- Presence renkleri: `online = success`, `dnd = warning`, `offline = text-tertiary`.
- Presence dot avatarın sağ altına taşar, arka planla ayrışması için 2 px yüzey border kullanır.

#### Follow Button

| State | Label | Variant | Aksiyon |
|---|---|---|---|
| `none` public | Takip et | primary | Follow |
| `none` private | İstek gönder | primary | Follow request |
| `requested` | İstek gönderildi | secondary | İsteği geri al |
| `following` | Takiptesin | secondary | Unfollow |
| `blocked` | Engellendi | secondary disabled | Yok |

- Follow aksiyonları optimistic çalışır; hata halinde provider eski state'e döner.
- Public profil istatistikleri tıklanabilir olmalı: takipçi ve takip edilen listeleri aynı liste yüzeyini paylaşır.

#### Story Ring

| State | Ring |
|---|---|
| `unseen` | `pit-red -> warning` sweep gradient |
| `seen` | `surface-3` 2 px stroke |
| `muted` | `text-tertiary` 1 px stroke + opacity 0.55 |
| `own` | `pit-red` 2 px stroke + küçük plus rozeti |

- Ring avatar dışına 3 px boşlukla çizilir.
- Feed üstü story ring boyutu 64, profil hero ring boyutu 96 olmalı.

#### Post Card

- Kart yüzeyi `surface-2`, border `surface-3`, radius `md`.
- Medya oranı feed'de 4:5 veya 1:1; detay ekranında 16:9 kabul edilebilir.
- Medya render'ı `MediaTile` ile yapılır; image/video placeholder, loading, error ve retry state'i zorunludur.
- İç padding `space-lg`; yazar satırı ile medya arasında `space-md`, caption ile aksiyon satırı arasında `space-sm`.
- Caption maksimum 3 satır gösterilir; detay ekranında tam metin açılır.

#### Action Icon Set

| Aksiyon | İkon |
|---|---|
| Like | `favorite_border` / aktif `favorite` |
| Comment | `chat_bubble_outline` |
| Share | `ios_share` |
| Bookmark | `bookmark_border` / aktif `bookmark` |
| Mute | `volume_off_outlined` |
| Report | `flag_outlined` |

- İkon butonları en az 44×44 dokunma hedefiyle çizilir.
- Aktif sosyal aksiyon rengi `pit-red`, pasif renk `text-secondary`.

#### Role Badge

| Rol | Renk |
|---|---|
| owner | `pit-red` |
| admin | `warning` |
| mod | `info` |
| member | `surface-3` |
| custom | Community'nin seçtiği renk; yoksa `pit-red-soft` |

- Rozet yüksekliği 24, radius `pill`, yatay padding `space-sm`.
- Üye listelerinde rozetler kullanıcı adının altında tek satırda akar; taşarsa `+N` özeti kullanılır.

#### Urgency Badge

| Seviye | Renk | Kullanım |
|---|---|---|
| critical | `error` | Acil yardım |
| urgent | `warning` | Yakında destek gerekli |
| request | `info` | İhtiyaç / rica |

- Aciliyet rozeti formda seçili state olarak, listelerde küçük chip olarak kullanılır.

#### Upload Progress

| Pattern | Kullanım |
|---|---|
| inline | Küçük medya kartı veya belge satırı içinde |
| sheet | Avatar, post, story, belge yükleme ana akışı |
| fullscreen | Kamera/story upload sırasında ekran kilitleyen kritik akış |

- Varsayılan upload pattern'ı `UploadProgressSheet` olmalı.
- Progress 0.0–1.0 aralığında clamp edilir, yüzde metni ve screen reader value birlikte verilir.

---

## 9. Hareket (Motion)

### Süreler

| Token | ms | Kullanım |
|---|---|---|
| `motion-instant` | 100 | Hover, küçük tap geri bildirimi |
| `motion-quick` | 200 | Buton tap, basit fade |
| `motion-default` | 300 | Sheet açılış, sayfa geçişi |
| `motion-slow` | 500 | Onboarding hero, harita zoom |

### Curve

```dart
// lib/core/theme/app_motion.dart
class AppMotion {
  static const Duration instant = Duration(milliseconds: 100);
  static const Duration quick   = Duration(milliseconds: 200);
  static const Duration normal  = Duration(milliseconds: 300);
  static const Duration slow    = Duration(milliseconds: 500);

  static const Curve standard      = Curves.easeOutCubic;
  static const Curve emphasized    = Curves.easeOutQuart;
  static const Curve decelerated   = Curves.easeOutCirc;
}
```

### Mikro-etkileşimler

- **Buton tap:** scale 0.98 → 1.0, 100 ms
- **Pin ekleme:** scale 0 → 1.2 → 1.0 (overshoot), 400 ms
- **Yardım sinyali pulse:** opacity 0.6 → 0 + scale 1 → 2, 1400 ms loop
- **Heatmap güncelleme:** opacity fade 200 ms
- **Mesaj geliyor:** alttan slide-in 12 px, 200 ms

---

## 10. Erişilebilirlik (A11y) Bütçesi

| Kontrol | Hedef |
|---|---|
| WCAG 2.1 AA kontrast oranı | Metin 4.5:1, büyük metin 3:1 |
| Dokunma hedefi | min 44×44 (iOS HIG) |
| Hit slop | 8 px (küçük ikon butonları için) |
| Screen reader etiketi | Tüm interaktif öğeler |
| Reduce Motion | `MediaQuery.disableAnimations` ise süreler 0 |
| Klavye odak halkası | Web (admin) için `outline: 2px pit-red` |

> Detaylar `26_LOKALIZASYON_ERISILEBILIRLIK.md` içindedir.

---

## 11. Karanlık Mod & Sistem Tema

V1.0 sadece koyu tema. Light theme tasarım jetonları yukarıda hazır; ancak `app.dart` içinde `themeMode: ThemeMode.dark` sabittir.

```dart
// lib/app.dart
return MaterialApp.router(
  themeMode: ThemeMode.dark,
  darkTheme: AppTheme.dark,
  // ...
);
```

---

## 12. Asset Adlandırma Kuralı

```
assets/
├── brand/                  # Logo, marka varlıkları
├── icons/                  # Özel SVG ikonlar (lucide harici)
├── images/                 # Onboarding, boş durum görselleri
├── fonts/                  # Inter, JetBrainsMono
└── overlays/               # Snap kamera filtreleri
    ├── speedometer.png
    ├── gear-shift.png
    └── compass.png
```

Dosya adı: `kebab-case.png`. 1x, 2x, 3x klasörleri ya da SVG.

---

## 13. Figma → Kod Akışı

1. Tasarımcı Figma'da `rollpit-design-system` kütüphanesindeki bileşenleri kullanarak ekran tasarlar.
2. Yeni token ihtiyacı varsa **önce bu dosya güncellenir**, sonra Figma'ya eklenir.
3. Geliştirici `Figma Inspect` ile değer alır; ancak değerleri `app_colors.dart`, `app_spacing.dart` gibi sabit dosyalardan kullanır.
4. Pixel-perfect uyum: ekran başına maksimum 2 px sapma kabul edilebilir; sapma bilinçliyse PR açıklamasında not düşülür.

---

## 14. Sürüm Ekran Görüntüsü Şablonu (App Store / Play Store)

Aşağıdaki düzen 6.9" iPhone (1320×2868) için referans:

```
┌─────────────────────────────────┐
│      Status bar (görünmez)      │
├─────────────────────────────────┤
│                                 │
│   "Asfaltta yalnız değilsin."   │  ← display-xl, white
│                                 │
│   ┌─────────────────────────┐   │
│   │                         │   │
│   │    Uygulama ekranı      │   │  ← gerçek ekran görüntüsü
│   │    (mock cihaz frame    │   │
│   │     içinde)             │   │
│   │                         │   │
│   └─────────────────────────┘   │
│                                 │
│   [Rollpit logo + slogan TR]    │
└─────────────────────────────────┘
```

5 ekran görüntüsü çekilir:
1. Harita (canlı yoğunluk + flare pinleri)
2. Topluluk listesi
3. Acil yardım akışı
4. Snap kamera (overlay açık)
5. Profil + araç galerisi

---

## 15. Tasarım Sistemi Sürüm Yönetimi

- Figma dosyası: `Rollpit Design System v1.x`
- Kod (Flutter): `lib/core/theme/` altındaki sabitler
- **Senkronizasyon:** Her sprint sonu Figma + Flutter eşleştirme review'ı zorunlu.
- **Breaking change** (örn. `pit-red` ton değişimi): tüm ekranlarda görsel regresyon testi (Patrol screenshot diff).
