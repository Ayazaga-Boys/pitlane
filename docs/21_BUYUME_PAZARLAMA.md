# 21 — Büyüme & Pazarlama Stratejisi

> Hedef: Türkiye'deki **tüm** otomobil ve motosiklet sahiplerini Rollpit'e taşımak.
> Mevcut: ~25M tescilli araç (otomobil 14.5M, motosiklet 5.5M, kamyonet/diğer 5M, TÜİK 2024).
> Rollpit V1.0 hedefi: 90 günde 25k MAU. 12 ayda 250k MAU. 36 ayda 2M MAU.

---

## 1. Pazar Segmentasyonu (TR)

### Birincil Segmentler

| # | Segment | Tahmini Büyüklük | Öncelik | Neden Rollpit? |
|---|---|---|---|---|
| 1 | Tutkulu motorcular (18-35) | ~800k aktif | 🔴 Çok yüksek | Cruise / yardımlaşma kültürü güçlü |
| 2 | Modifiye/performans araç sahipleri | ~600k | 🔴 Çok yüksek | Topluluk + showcase ihtiyacı |
| 3 | Klasik araba sahipleri | ~150k | 🟠 Yüksek | Niş, lokal etkinlikler |
| 4 | Şehir komütçü (genel) | ~10M | 🟡 Orta | Acil yardım + işletme keşfi değerli |
| 5 | Off-road / 4x4 | ~80k | 🟡 Orta | Tour planner Faz 2'de |
| 6 | Profesyonel (kurye, taksici) | ~500k | 🟢 İkincil | Yardımlaşma değeri var |

### Beta için Birincil Hedef

İlk 1000 kullanıcı: **İstanbul'daki tutkulu motorcular + modifiye araç sahipleri**.

Neden?
- Coğrafi yoğunluk → harita değeri ilk günden hissedilir.
- Davet kültürü güçlü (forum, WhatsApp grupları).
- Erken benimseyici (tech-savvy).

---

## 2. Faz Planı

### Faz 0 — Kapalı Beta (Hafta 1-4 sonrası)

**Hedef:** 100 davetli kullanıcı (İstanbul, motor + araç karışık).

**Kanal:**
- Tasarımcı + ürün ekibinin kişisel networkü
- 5 büyük TR motorcu Instagram hesabı (mikro-influencer, ücretsiz, "erken erişim" karşılığı)
- 3 araç forumu admin'i (TVT, Eksisozluk araba klüpleri, Motoroku)

**Ölçüm:**
- D7 retention > %50 (gerçek kullanıcı sinyali)
- Haftalık aktif WAU > %60
- En az 5 organik flare/gün

### Faz 1 — Açık Beta (Hafta 12-16)

**Hedef:** 5.000 kullanıcı, hâlâ sadece İstanbul.

**Kanal:**
- Kapalı beta kullanıcılarına 5 davet kodu (viral)
- Rollpit Instagram + TikTok hesapları
- 2 büyük YouTube otomotiv kanalı (sponsored long-form)

**Sürüm:** TestFlight + Internal Testing (Apple Public Beta opsiyonel).

### Faz 2 — Public Launch İstanbul (Hafta 17-22)

**Hedef:** 25.000 MAU, hâlâ İstanbul ağırlıklı.

**Kanal:**
- App Store + Play Store yayını
- TR otomotiv yayın grupları PR (Carmedya, Otokokpit, Donanımhaber otomotiv)
- "İstanbul Cars & Coffee" tarzı 2-3 büyük etkinliğe sponsorluk
- Influencer kampanyası: 10 kişi × 2 post

**KPI:**
- 90 günde 25k MAU
- 7-gün retention > %35
- App Store puanı ≥ 4.5

### Faz 3 — TR Geneli (Hafta 23-52)

**Hedef:** 250k MAU, ilk 5 büyük şehir (İstanbul, Ankara, İzmir, Bursa, Antalya).

**Kanal:**
- Şehir bazlı influencer ortaklıkları
- Yerel motor klüpleri ile resmi işbirlikleri
- İşletme satış ekibi: 50 doğrulanmış pin/ay (B2B)
- Google Search & UAC kampanyaları (App Install)

### Faz 4 — Türkiye Hâkim (Yıl 2-3)

**Hedef:** 2M MAU, "yola çıkan herkes Rollpit'i biliyor".

- TV reklam (TRT Spor + niş otomotiv kanalları)
- Akaryakıt zinciri ortaklığı (BP, Shell — pin entegrasyonu)
- Sigorta şirketi ortaklığı (yardım çağrısı entegrasyonu)
- Spotify / YouTube ses reklam

---

## 3. Davet & Viral Mekaniği

### Davet Kodu Sistemi (V1.0)

- Her aktif kullanıcıya 5 kod.
- Kod kullanılınca davet eden bilgilendirilir.
- 10 kişi davet eden → "Rollpit Pioneer" rozet.
- 50 kişi → 1 yıl ücretsiz Premium (Faz 2 premium varsa).

**Tablo:**

```sql
CREATE TABLE public.invite_codes (
  code        TEXT PRIMARY KEY,
  inviter_id  UUID REFERENCES public.profiles(id),
  uses_count  INTEGER NOT NULL DEFAULT 0,
  max_uses    INTEGER NOT NULL DEFAULT 5,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Bekleme Listesi (Wave Launch)

```sql
CREATE TABLE public.waiting_list (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  vehicle_type TEXT,
  city        TEXT,
  invited_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Akış:** Bekleme listesindeki kullanıcılara haftalık 100-500 davet gönderilir (kapasitenin elverdiği kadar).

---

## 4. İçerik Stratejisi (Rollpit Sosyal Medyaları)

### Instagram (`@rollpit.com`)

**Format:**
- Reels: kullanıcı flare anları, klasik araba showcase, motorcu cruise
- Carousel: "Bu hafta Rollpit'de" — etkinlik özetleri
- Story: günlük canlı yardım talepleri (anonim, izinli)

**Sıklık:** Haftada 5 reel + 3 carousel + günlük story.

### TikTok (`@rollpit`)

**Format:**
- "Rollpit'in en büyüleyici flare'leri" (haftalık)
- Acil yardım gerçek hikayeleri (kullanıcı izniyle)
- Snap kamera filtre demo'ları

### YouTube (`Rollpit`)

- Aylık long-form: kullanıcı röportajı, etkinlik aftermovie.
- Shorts: günde 1, snap içerikleri.

### X (eski Twitter)

- Topluluk yöneticileri ve etkinlik organizatörleriyle real-time iletişim.

---

## 5. PR & Basın Stratejisi

### Hedef Yayın Listesi (TR)

| Yayın | Tip | Erişim |
|---|---|---|
| Webrazzi | Tech haber | ~500k aylık ziyaretçi |
| Donanımhaber | Tech | ~3M |
| Carmedya | Otomotiv | ~800k |
| Otokokpit | Otomotiv | ~500k |
| Yeşil Adım Mobilite | Sektör | Niş |
| Habertürk Tech | Mainstream | ~5M |
| NTV Tech | Mainstream | ~3M |

**Pitch açısı:**
- "Türkiye'nin ilk reklamsız, mahremiyet odaklı otomotiv sosyal ağı"
- "Yolda kalan sürücüye 8 dakikada yardım"
- "Snapchat değil, otomotiv tutkunları için"

### Basın Kiti

`rollpit.com/press` adresinde:
- Logo varyantları (PNG, SVG, ZIP)
- Ekran görüntüleri (yüksek çözünürlük)
- Kurucu özgeçmiş + fotoğraf
- Şirket faktları (kuruluş, lokasyon, ekip)
- Basın bültenleri arşivi

---

## 6. Etkinlik Sponsorlukları

### V1.0 Hedef Etkinlikler (İstanbul)

| Etkinlik | Tahmini Katılım | Bütçe |
|---|---|---|
| Istanbul Cars & Coffee (aylık) | ~500-1000 | 5.000 TL/ay |
| Türkiye Motosiklet Festivali | ~10.000 | 30.000 TL (yıllık) |
| Bosphorus Classic Rally | ~300 araba | 15.000 TL |
| Hafta sonu cruise organizasyonları | ~50-200 | 1.000 TL/etkinlik |

**Sponsorluk paketi:**
- Rollpit stand
- "Rollpit'i indir" QR kod kartları
- Etkinlik kapakları + flare'i
- Aktif desteğe karşılık 100 davet kodu

---

## 7. Influencer Ortaklıkları

### Tier 1 — Mega (>500k takipçi)

- Sponsored long-form review (YouTube)
- 1-2 ortaklık/yıl
- Bütçe: 50.000-100.000 TL

### Tier 2 — Macro (100k-500k)

- Reels + story takeover
- 5-10/yıl
- Bütçe: 10.000-30.000 TL

### Tier 3 — Mikro (10k-100k)

- Authentic deneyim posts
- 30+/yıl (sürekli)
- Bütçe: 500-3.000 TL/post veya barter (Premium yıllık)

### Hedef Kişiler (Örnek)

> Bu liste taslaktır; bütçe ve uyum kontrolünden sonra sözleşme.

| İsim (örnek) | Platform | Niş |
|---|---|---|
| @motoresat | Instagram + YT | Motosiklet vlogger |
| @arabaadam | TikTok | Modifiye otomobil |
| @classicotokoleksiyoncusu | Instagram | Klasik araba |
| @4x4offroadtr | YouTube | Off-road |

---

## 8. Performance Marketing (Ücretli)

### Apple Search Ads (ASA)

- Keyword'ler: "motorcu sosyal", "araç topluluk", "araba etkinlik", "yol tarifi tamir"
- CPI hedefi: < 15 TL
- Aylık bütçe: 30.000-100.000 TL (ölçeğe göre)

### Google Universal App Campaigns (UAC)

- App install kampanyası
- Keyword + content + display
- CPI hedefi: < 12 TL
- Aylık bütçe: 50.000-150.000 TL

### Facebook / Instagram Ads

- Remarketing: bekleme listesindekiler
- Lookalike: aktif kullanıcı seed'i
- CPI hedefi: < 18 TL
- Aylık bütçe: 30.000-80.000 TL

### Bütçe Dağıtımı (Yıl 1)

| Aşama | Toplam Pazarlama | ASA | UAC | FB/IG | Influencer | PR/Etkinlik |
|---|---|---|---|---|---|---|
| Q1 (beta) | 50k TL | %0 | %0 | %20 | %30 | %50 |
| Q2 (launch) | 200k TL | %15 | %25 | %20 | %25 | %15 |
| Q3 | 350k TL | %20 | %30 | %20 | %20 | %10 |
| Q4 | 500k TL | %25 | %30 | %20 | %15 | %10 |

---

## 9. App Store Optimization (ASO)

### TR — App Store

```
Başlık (TR):
Rollpit — Araç & Moto Sosyal

Alt başlık:
Otomobil tutkunları için harita

Anahtar kelimeler:
araba, motosiklet, otomobil, cruise, buluşma, topluluk, harita, araç,
modifiye, klasik, tamirci, garaj, yardım, motorcu

Kategori:
Birincil: Sosyal Ağ
İkincil: Yaşam Tarzı
```

### EN — App Store (Faz 4, Avrupa açılımı)

```
Title: Rollpit — Car & Moto Social
Subtitle: Live map for motorheads
Keywords: car, motorcycle, biker, cruise, meetup, community, map, modified, classic, mechanic, garage, roadside
```

### Ekran Görüntüleri

5 görsel — sıralama önemli (App Store ilk 3'ü gösterir):

1. **Harita ekranı** (canlı yoğunluk, vibrant)
2. **Acil yardım** (3 dokunuş, belirgin değer)
3. **Topluluk listesi** (sosyal kanıt)
4. **Snap kamera** (otomotiv overlay)
5. **Profil + araç galerisi** (kişiselleştirme)

Tasarım `15_TASARIM_SISTEMI.md` Bölüm 14'te.

### App Preview Video

- 15-20 sn
- Müzik: enerji yüksek, telifsiz (Pixabay/AudioJungle)
- Hook: 3 sn içinde "Türkiye'nin yola çıkan herkesi"

---

## 10. Türkiye Yerel Stratejiler

### Şehir Stratejisi

| Şehir | Lansman önceliği | Coğrafi yoğunluk | Topluluk gücü |
|---|---|---|---|
| İstanbul | 🔴 İlk | Çok yüksek | Çok yüksek |
| Ankara | 🟠 Hafta 20 | Yüksek | Yüksek |
| İzmir | 🟠 Hafta 22 | Yüksek | Orta |
| Bursa | 🟡 Hafta 24 | Orta | Orta-yüksek (motor) |
| Antalya | 🟡 Hafta 26 | Mevsimlik | Orta |
| Eskişehir | 🟢 Hafta 30 | Düşük | Yüksek (üniversite) |
| Adana | 🟢 Hafta 32 | Orta | Orta |

### Yerel Topluluk Bağlantıları

- TVT (Türkiye Vintage Truck), Vosvosçu, Eski Okul vb. forumlarla resmi işbirlikleri.
- TSF (Türkiye Spor Federasyonu) Motosiklet Branşı: yarış izleme entegrasyonu.
- Türkiye Otomobil Sporları Federasyonu (TOSFED) ile ralli/yarış flare'leri.

### Akaryakıt & Servis Zinciri

- Faz 4'te BP Connect, Shell Mobile gibi mobil cüzdanlarla ortaklık.
- Tofaş, Ford OTOSAN servis ağı entegrasyonu (acil yardım yönlendirme).

---

## 11. Birim Ekonomisi (CAC vs LTV)

### Tahminler (V1.0 Yıl 1)

| Metrik | Hedef | Açıklama |
|---|---|---|
| CAC (organik) | 0 TL | Davet, organik sosyal medya |
| CAC (ücretli) | < 18 TL | UAC + ASA blended |
| ARPU (Yıl 1) | ~3 TL | Çoğu reklamsız + işletme pin gelir |
| LTV (12 ay) | ~12 TL (öngörü) | İşletme pin + premium (varsa) |
| LTV/CAC | < 1.0 (Yıl 1) | Negatif birim ekonomisi normal — büyüme aşaması |
| Break-even | Yıl 3 | İşletme pin + premium tabanı genişledikten sonra |

> Detay gelir modeli `25_GELIR_MODELI.md` dosyasındadır.

---

## 12. Topluluk Yöneticisi (Community Manager) Rolü

V1.0'da 1 tam zamanlı CM (TR konuşan, otomotiv tutkunu).

**Sorumluluklar:**
- Sosyal medya yönetimi (Instagram + TikTok)
- Topluluk ambassador'larıyla iletişim
- Şikayet ve geri bildirim ilk yanıt
- Etkinlik sponsorluk koordinasyonu
- Kullanıcı haber bülteni (aylık)

---

## 13. Anahtar Performans Göstergeleri (Dashboard)

PostHog'da public dashboard:

| Metrik | Sıklık | Hedef |
|---|---|---|
| MAU | Günlük | 25k → 250k → 2M |
| DAU | Günlük | MAU'nun %25'i |
| 7-gün retention | Haftalık | %35 |
| 30-gün retention | Aylık | %20 |
| Davet conversion | Aylık | %30+ |
| App Store puanı | Haftalık | ≥ 4.5 |
| Net Promoter Score | Çeyreklik | > 40 |
| Aktif şehir sayısı | Çeyreklik | 5 → 30 → 81 |
| Doğrulanmış işletme pin | Aylık | 50/ay büyüme |

---

## 14. Risk & Önleme

| Risk | Olasılık | Etki | Önleme |
|---|---|---|---|
| TR'de daha güçlü rakip çıkar | Orta | Yüksek | Hızlı PMF + topluluk lock-in |
| App Store reddi | Düşük | Yüksek | Pre-submission review (`14_DAGITIM`) |
| Sahte yardım talepleri | Yüksek | Orta | Saatlik limit + ban |
| Konum güvenliği endişesi | Orta | Yüksek | "H3 hücresi" anlatımı net olsun (UI + onboarding) |
| Düşük D7 retention | Orta | Yüksek | Bildirim çekiciliği + aktif topluluk |
| Hosting maliyeti patlaması | Düşük | Orta | Cloudflare R2 (egress yok) + Fly.io auto-stop |

---

## 15. Faz 2 Avrupa Açılımı (Yıl 3+)

**Hedef ülkeler:**
1. Almanya (TR diasporası + güçlü otomotiv kültürü)
2. İtalya (motorcu kültür)
3. UK (modifiye sahnesi)

**Lokal adaptasyon:**
- İngilizce + Almanca + İtalyanca lokalizasyon
- AB GDPR uyum (zaten temel mimari uyumlu)
- Lokal işletme satış ekibi

---

## 16. Marka Manifestosu

> "Asfaltta yalnız değilsin."

Rollpit bir uygulamadan fazlasıdır. Türkiye'nin yola çıkan her bireyini birbirine bağlayan dijital sokaktır. Yardım eli, etkinlik mekanı, hikaye paylaşım yeridir. Reklam yok, manipülasyon yok, sadece tutkunlar.

Bu manifesto her sosyal post'ta, her PR yazısında, her içerikte arka planda olmalı.
