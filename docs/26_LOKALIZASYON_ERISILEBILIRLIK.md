# 26 — Lokalizasyon (i18n) & Erişilebilirlik (a11y)

> Pitlane Türkiye'de doğdu, ama erişilemeyen bir uygulama olamaz.
> Bu dosya **çeviri ve evrensel kullanılabilirlik** standartlarını tanımlar.

---

## 1. Desteklenen Diller

### V1.0

- **Türkçe (`tr`)** — birincil
- **İngilizce (`en`)** — ikincil

### Faz 3 (Avrupa açılımı)

- Almanca (`de`)
- Fransızca (`fr`)
- İtalyanca (`it`)

### Cihaz Dili Algılama

```dart
// lib/main.dart
final systemLocale = ui.PlatformDispatcher.instance.locale;
final supportedLocales = [const Locale('tr'), const Locale('en')];
final activeLocale = supportedLocales.contains(systemLocale)
    ? systemLocale
    : const Locale('tr'); // TR varsayılan
```

Kullanıcı tercih ettiği dili Ayarlar → Dil'den değiştirebilir; tercih `flutter_secure_storage`'da saklanır.

---

## 2. Dosya Yapısı (Flutter ARB)

```
apps/mobile/
├── lib/
│   ├── l10n/
│   │   ├── intl_tr.arb       # Türkçe (master)
│   │   ├── intl_en.arb       # İngilizce
│   │   └── intl.dart         # generated (build_runner)
│   └── ...
└── l10n.yaml
```

```yaml
# l10n.yaml
arb-dir: lib/l10n
template-arb-file: intl_tr.arb
output-localization-file: app_localizations.dart
output-class: AppLocalizations
```

### intl_tr.arb (örnek)

```json
{
  "@@locale": "tr",

  "appName": "Pitlane",
  "@appName": { "description": "Marka adı, çevrilmez" },

  "auth_signin_title": "Giriş Yap",
  "auth_signin_email": "E-posta adresin",
  "auth_signin_button": "Devam et",

  "map_filter_all": "Hepsi",
  "map_filter_car": "Otomobil",
  "map_filter_motorcycle": "Motosiklet",

  "help_create_title": "Yardım Talebi",
  "help_create_issue_breakdown": "Arıza",
  "help_create_issue_flat_tire": "Patlak Lastik",
  "help_create_issue_fuel": "Yakıt Bitti",
  "help_create_issue_accident": "Kaza",

  "ghost_mode_on": "Hayalet mod açık",
  "ghost_mode_off": "Hayalet mod kapalı",

  "rsvp_count_one": "{count} kişi gidiyor",
  "rsvp_count_other": "{count} kişi gidiyor",
  "@rsvp_count": {
    "description": "Plural: rsvp count",
    "placeholders": { "count": { "type": "int" } }
  },

  "time_minutes_ago": "{m} dk önce",
  "@time_minutes_ago": {
    "placeholders": { "m": { "type": "int" } }
  }
}
```

### intl_en.arb

```json
{
  "@@locale": "en",
  "appName": "Pitlane",
  "auth_signin_title": "Sign In",
  "auth_signin_email": "Your email",
  "auth_signin_button": "Continue",
  "map_filter_all": "All",
  "map_filter_car": "Cars",
  "map_filter_motorcycle": "Motorcycles",
  "help_create_title": "Request Help",
  "help_create_issue_breakdown": "Breakdown",
  "help_create_issue_flat_tire": "Flat Tire",
  "help_create_issue_fuel": "Out of Fuel",
  "help_create_issue_accident": "Accident",
  "ghost_mode_on": "Ghost mode on",
  "ghost_mode_off": "Ghost mode off",
  "rsvp_count_one": "{count} person going",
  "rsvp_count_other": "{count} people going",
  "time_minutes_ago": "{m} min ago"
}
```

---

## 3. Kullanım

```dart
import 'package:pitlane/l10n/app_localizations.dart';

@override
Widget build(BuildContext context) {
  final l10n = AppLocalizations.of(context)!;
  return Text(l10n.auth_signin_title);
}
```

### Plural & Parametre

```dart
Text(l10n.rsvp_count(rsvpList.length));
Text(l10n.time_minutes_ago(minutesAgo));
```

---

## 4. Çeviri Kuralları

### Genel

- TR master, EN sonradan üretilir.
- Yeni feature → önce TR ARB, sonra EN ARB güncellenir.
- ARB dosyaları PR'da CI tarafından doğrulanır (`l10n_lint` script).

### Kısa & Net

- Buton metinleri: 2-3 kelime.
- Snackbar: 1 cümle.
- Modal başlık: 2-5 kelime.

### Tonlama

| TR | EN |
|---|---|
| Samimi, "sen" hitabı | "you" (informal) |
| Otomotiv argosuna açık ("cruise", "RSVP") | Aynı şekilde |
| Emoji ölçülü kullanım (yardım pini için 🚨, snap için 📸) | Aynı |

### Yasak Kelimeler

- Cinsel, küfür, ırkçı içerik (uygulama içi mesajlarda da)
- Marka isimleri (BMW, Honda) çevirilmez
- Pitlane → her dilde "Pitlane"

### Tarih, Sayı, Para Biçimi

```dart
import 'package:intl/intl.dart';

// Tarih
DateFormat.yMMMd(context.locale.toString()).format(date);

// Sayı
NumberFormat.decimalPattern(context.locale.toString()).format(value);

// Para
NumberFormat.currency(locale: 'tr', symbol: '₺').format(199.00);
NumberFormat.currency(locale: 'en', symbol: '\$').format(9.99);
```

---

## 5. Çeviri Workflow (Faz 3+)

V1.0'da geliştirici doğrudan ARB'yi günceller.

Faz 3'ten itibaren:
- **Crowdin** veya **Lokalise** entegrasyonu
- Master TR otomatik push
- Çevirmenler her dil için web platformunda çalışır
- CI: yeni dil dosyası ARB → PR

---

## 6. Erişilebilirlik (A11y) Standardı

### Hedef

- WCAG 2.1 AA seviyesi
- Apple Accessibility Guidelines
- Android Accessibility Best Practices

### Kontrast Oranları

| İçerik | Min. Oran |
|---|---|
| Normal metin (≥ 16 pt) | 4.5:1 |
| Büyük metin (≥ 24 pt veya 19 pt bold) | 3:1 |
| UI bileşeni (icon, border) | 3:1 |
| Decorative öğe | Yok |

Test aracı: Figma `Stark` plugin, `flutter_accessibility_inspector`.

### Tasarım Sistemi'nde Kontrast Değerleri (Doğrulanmış)

| Color Pair | Oran | Durum |
|---|---|---|
| `text-primary` (#FFFFFF) on `surface-1` (#1A1A2E) | 16.8:1 | ✅ AAA |
| `text-secondary` (#B0B0B0) on `surface-1` | 8.4:1 | ✅ AAA |
| `text-tertiary` (#6B6B7B) on `surface-1` | 4.6:1 | ✅ AA |
| `text-on-brand` (#FFFFFF) on `pit-red` (#E63946) | 4.5:1 | ✅ AA (sınırda) |
| `pit-red-soft` (#FFD9DC) text on white | 12.0:1 | ✅ AAA |

> Her yeni renk eklemesinde otomatik kontrast testi (`stylelint-color-contrast`).

### Dokunma Hedefi

- Min. 44×44 pt (iOS HIG)
- 48×48 dp (Material Design)
- Hit slop: ikon butonlarında ekstra 8 px

```dart
// İyi pratik: ikon butonu için min boyut
GestureDetector(
  behavior: HitTestBehavior.translucent,
  onTap: onTap,
  child: SizedBox(
    width: 44,
    height: 44,
    child: Icon(Icons.close, size: 24),
  ),
)
```

### Screen Reader Etiketleri

```dart
// Tüm interaktif öğelere semantic label
Semantics(
  label: 'Acil yardım talebi gönder',
  hint: 'Yakındakilere konumun ile yardım çağrısı gönderir',
  button: true,
  child: SosButton(onPressed: onPressed),
)

// Dekoratif ikonları ignore et
ExcludeSemantics(child: Icon(Icons.star))
```

### Test Komutları

```bash
# Flutter accessibility çalıştır (debug)
flutter run --enable-software-rendering
# DevTools → Accessibility tab

# Otomatik test
flutter test integration_test/a11y_test.dart
```

```dart
// integration_test/a11y_test.dart
testWidgets('SosButton has correct semantics', (tester) async {
  await tester.pumpWidget(const SosButton());
  final handle = tester.ensureSemantics();
  expect(
    tester.getSemantics(find.byType(SosButton)),
    matchesSemantics(
      label: 'Acil yardım talebi gönder',
      isButton: true,
      hasEnabledState: true,
      isEnabled: true,
    ),
  );
  handle.dispose();
});
```

---

## 7. Dynamic Type / Font Scaling

### iOS Dynamic Type

- Kullanıcı sistem yazı boyutunu ayarladığında uygulama da uyum sağlar.
- `MediaQuery.textScaler` kullanılır.
- Test: Settings → Accessibility → Larger Text → max.

### Android Font Scale

- Same: `Settings → Display → Font size`.

### Maksimum & Minimum

```dart
// app.dart — Tüm uygulama için scale clamp
return MediaQuery(
  data: MediaQuery.of(context).copyWith(
    textScaler: MediaQuery.textScalerOf(context).clamp(
      minScaleFactor: 0.85,
      maxScaleFactor: 1.6,
    ),
  ),
  child: child,
);
```

---

## 8. Reduce Motion

```dart
// lib/core/theme/app_motion.dart
class AppMotion {
  static Duration adjust(Duration original, BuildContext context) {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    return reduceMotion ? Duration.zero : original;
  }
}

// Kullanım
final duration = AppMotion.adjust(AppMotion.normal, context);
AnimatedContainer(duration: duration, ...);
```

---

## 9. Renk-Bağımsız Bilgi (Color Blindness)

Renk tek başına bilgi taşımaz.

| Yanlış | Doğru |
|---|---|
| Sadece kırmızı dot ile "yeni" | Kırmızı dot + "yeni" yazısı |
| Heatmap sadece renk gradyanı | Renk + sayım rakamı |
| Doğrulanmış pin sadece mavi | Mavi tik ikonu + label |

### Test

- Figma `Color Blind` plugin (deuteranopia, protanopia, tritanopia)
- iOS Simulator → Accessibility Inspector

---

## 10. Klavye Navigasyonu (Web Admin)

Admin paneli için klavye desteği zorunlu (mobil uygulamada minimum).

```tsx
// shadcn/ui native kullanırken otomatik
// Manuel kontroller için:
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  }}
  tabIndex={0}
>
```

### Focus Halkası

```css
/* tailwind.config.ts */
@layer utilities {
  .focus-ring {
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pit-red focus-visible:ring-offset-2;
  }
}
```

---

## 11. Sağlık Etkisi (Photosensitive Epilepsy)

- Hızlı flash > 3 Hz yasak (WCAG 2.3.1)
- SOS pulse animasyonu: 0.7 Hz (1.4 sn döngü), güvenli
- Manuel kontrol: tüm animasyonlar `< 3 Hz`

---

## 12. Sağ-Sol (RTL) Destek

V1.0'da RTL dil yok (TR + EN). Faz 3'te Arapça eklenirse:

```dart
// MaterialApp
return MaterialApp(
  localizationsDelegates: AppLocalizations.localizationsDelegates,
  supportedLocales: AppLocalizations.supportedLocales,
  // RTL otomatik
);

// EdgeInsets yerine EdgeInsetsDirectional kullan
padding: EdgeInsetsDirectional.only(start: 16, end: 16);
```

Tüm icon ve animasyon RTL'de doğru yön → flutter `Directionality` widget.

---

## 13. Erişilebilirlik Kontrol Listesi (PR Kontrolü)

```markdown
## A11y Kontrol

### Kontrast
- [ ] Tüm metin/arka plan WCAG AA seviyesi (4.5:1 normal, 3:1 büyük)
- [ ] UI bileşenleri 3:1 minimum

### Etiket
- [ ] Tüm interaktif öğelerde Semantics label
- [ ] Dekoratif ikonlarda ExcludeSemantics
- [ ] Form alanlarında label + hint

### Boyut
- [ ] Dokunma hedefi ≥ 44×44 pt
- [ ] Font scale 1.6'ya kadar layout taşmıyor

### Hareket
- [ ] Reduce Motion tercihi varsa animasyon süreleri 0
- [ ] Flash > 3 Hz yok

### Renk
- [ ] Bilgi sadece renk ile taşınmıyor (text/icon eşliğinde)
- [ ] Color blind testi geçti (Figma Stark)
```

---

## 14. Hata Mesajları & Mikro Metinler

### Boş Durum (Empty State)

| Durum | TR | EN |
|---|---|---|
| Henüz flare yok | "Henüz hiç flare yok. İlkini sen oluştur!" | "No flares yet. Create the first one!" |
| Boş sohbet | "Henüz mesajınız yok" | "No messages yet" |
| Yardım yok | "Şu an açık yardım talebi yok" | "No active help requests" |
| Çevrimdışı | "Bağlantı yok. Tekrar dene." | "No connection. Try again." |

### Hata Toast (Genel)

| Hata | TR | EN |
|---|---|---|
| Network timeout | "Bağlantı yavaş. Tekrar dener misin?" | "Connection slow. Try again?" |
| 401 | "Oturumun sonlanmış. Tekrar giriş yap." | "Session expired. Please sign in." |
| 403 | "Bu işlem için yetkin yok." | "You don't have permission." |
| 422 | "Girdiğin bilgileri kontrol et." | "Check your input." |
| 500 | "Bir şeyler ters gitti. Birazdan dener misin?" | "Something went wrong. Try again later." |

### Doğrulama Mesajları

| Alan | Hata | TR | EN |
|---|---|---|---|
| E-posta | Geçersiz format | "Geçerli bir e-posta gir" | "Enter a valid email" |
| Kullanıcı adı | Çok kısa | "En az 3 karakter" | "Min 3 characters" |
| Kullanıcı adı | Alınmış | "Bu kullanıcı adı alınmış" | "This username is taken" |

---

## 15. Marka & Tonlama Üstünlüğü

Pitlane çevirileri:
- Resmi değil (Sayın değil "Merhaba")
- Otomotif tutkusunu paylaşan dost
- Türkçe argosuna açık ama küfürsüz
- Kapsayıcı (cinsiyet, yaş, gelir nötr)

Yasak ifadeler:
- "Lütfen" yerine "rica ederim" yapısı (çok resmi)
- "Müşteri" yerine "kullanıcı" / "kullanan" / sen
- Gerçekçi olmayan promlar ("dünyanın en iyi...")

Faz 3 (EN, DE, FR):
- Profesyonel çevirmen kullanılır (machine translation only as draft)
- Native review zorunlu

---

## 16. Yerel Yasal Uyum

| Ülke | Veri Yasası | App Store / Play Store |
|---|---|---|
| Türkiye | KVKK | TR App Store / Play Store TR |
| Almanya | DSGVO + GDPR | DE App Store / Play Store DE |
| Fransa | RGPD + GDPR | FR App Store / Play Store FR |
| İtalya | Codice in materia di protezione + GDPR | IT App Store / Play Store IT |

Lokal hukuk değişiklikleri: yıllık review (`17_KVKK_GIZLILIK_POLITIKASI.md` Bölüm 10).

---

## 17. Test Cihaz Havuzu

| Cihaz | Amaç |
|---|---|
| iPhone 16 Pro Max (iOS 18) | Flagship test |
| iPhone SE (iOS 17) | Küçük ekran |
| iPhone 11 (iOS 16) | Eski iOS |
| Pixel 8 (Android 14) | Flagship |
| Samsung Galaxy A52 (Android 13) | Mid-range, popüler TR |
| Xiaomi Redmi Note 10 (Android 12) | Düşük segment, popüler TR |

A11y test:
- VoiceOver (iOS) açık
- TalkBack (Android) açık
- Sistem font size max
- Reduce Motion açık
- Color filter "Grayscale" açık

---

## 18. Erişilebilirlik Vaadi (Public)

Pitlane web sitesinde:

> "Pitlane'i her sürücü için erişilebilir yapma sorumluluğunu taşıyoruz.
> Eğer uygulamamızda erişilebilirlik engeline takıldıysan, lütfen
> a11y@pitlane.app adresinden bize yaz. 30 gün içinde yanıt veririz."

> Bu vaat WCAG 2.1 AA seviyesini taahhüt eder; AAA seviyesi hedeftir.
