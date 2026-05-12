# 23 — Incident Yönetimi & Acil Durum

> Major incident esnasında ekibin ne yapacağı, kim ne diyecek, kullanıcıya ne söyleneceği.
> Operasyonel runbook'lar `22_OBSERVABILITY_RUNBOOK.md` Bölüm 9'da.

---

## 1. Incident Severity Sınıflandırması

| Seviye | Tanım | Örnek | Yanıt Süresi |
|---|---|---|---|
| **SEV-0** | Veri ihlali, kullanıcı güvenliği tehdit | RLS bypass leak, CSAM tespiti | < 15 dk |
| **SEV-1** | Servis tamamen erişilmez | API down, login çalışmıyor | < 15 dk |
| **SEV-2** | Kritik özellik bozuk | Acil yardım gönderilmiyor, push down | < 30 dk |
| **SEV-3** | Kısmi degradasyon | Harita gecikmeli, bildirim yavaş | < 2 saat |
| **SEV-4** | Görsel/UX hata | Buton hizasız, çeviri eksik | Sıradaki sprint |

---

## 2. Incident Roller

### Incident Commander (IC)

- Genel koordinasyon, kararlar
- İletişim akışını yönetir
- Genelde on-call sorumlusu IC olur

### Communications Lead (CL)

- Kullanıcıya iletişim (status sayfası, app banner, sosyal medya)
- Iç ekibe güncel bilgi
- IC'den net mesaj alır

### Tech Lead (TL)

- Sorunu çözmek için pratik aksiyon
- Diagnostic yapan kişi
- IC'ye düzenli durum bildirir

### Scribe (S)

- Olayın zamanlamasını ve kararları kayda geçirir
- Post-mortem için ham veri sağlayıcı

> Küçük ekipte (3-4 kişi) bir kişi 2 rol üstlenebilir. Sadece IC ile TL aynı kişi olmasın.

---

## 3. Incident Yaşam Döngüsü

```
1. Tespit
   ↓
2. Triaj (severity belirle)
   ↓
3. War room aç (Slack #incident-<tarih>)
   ↓
4. Roller atan
   ↓
5. Diagnostic + iletişim paralel
   ↓
6. Hafifletme (mitigation)
   ↓
7. Çözüm (fix)
   ↓
8. Doğrulama
   ↓
9. War room kapat
   ↓
10. Post-mortem (24-72 saat içinde)
```

---

## 4. SEV-0 / SEV-1 Akış

### Tespit (0-2 dk)

- PagerDuty alarm → on-call telefon ile uyandırır
- Slack `#alerts-prod` mesajı

### Triaj (2-5 dk)

- On-call PagerDuty ack'lar
- Severity ön karar (sonradan değişebilir)
- IC olarak kendini ata

### War Room Açma (5-10 dk)

```
Slack: /incident open SEV-1 — API down
↓
Bot otomatik kanal açar: #incident-2026-05-07-1145
Bot diğer dev'leri "@channel" ile çağırır
```

War room kuralları:
- Sadece koordineli iletişim
- Şaka, yan konu yok
- Her karar Scribe tarafından kayda geçer

### Diagnostic + Mitigation (10-60 dk)

| Diagnostic Komutları (kopyala/yapıştır) |
|---|
| `fly status --app rollpit-api` |
| `fly logs --app rollpit-api -n 200` |
| `supabase status` (Supabase dashboard) |
| `fly releases --app rollpit-api` (son deploy) |

| Mitigation seçenekleri |
|---|
| `fly releases rollback --app rollpit-api` |
| `fly scale memory 4096 --app rollpit-api` |
| `fly machine restart --app rollpit-api` |
| Maintenance modu: `fly secrets set MAINTENANCE_MODE=true --app rollpit-api` |
| Feature flag: `feature_<x>_enabled = false` (admin panel) |

### İletişim Paralel (CL Sorumluluğu)

10 dakika içinde:
- **Status sayfası** güncellenir: `https://status.rollpit.com`
- **App içi banner** aktive edilir (remote_configs)
- **Twitter/X** bildirimi: "Rollpit'de kısa bir aksaklık yaşıyoruz, çözüm için çalışıyoruz."

30 dakika içinde:
- **Daha detaylı update** (etkilenen özellik, ETA varsa)

Çözüm sonrası:
- "Sorun çözüldü, ekibimiz post-mortem hazırlıyor" mesajı
- Status sayfası "operational" olarak güncellenir

---

## 5. Status Sayfası

`https://status.rollpit.com` — Statuspage.io veya açık kaynak (Atlassian Statuspage / Cachet).

### Bileşenler

- API
- Realtime (WebSocket)
- Push Notifications
- Media Pipeline
- Admin Panel

### Statü Tipleri

- Operational (yeşil)
- Degraded Performance (sarı)
- Partial Outage (turuncu)
- Major Outage (kırmızı)

### Otomatik Tetikleme

- Fly.io health check fail → otomatik "investigating" eklenir.
- Manuel olarak güncellenir (CL).

---

## 6. Veri İhlali Müdahale Planı (SEV-0)

### Tespit

- Sentry'de PII expose
- Pen test bulgusu
- Whistleblower / hata raporu (`security@rollpit.com`)
- Kötü amaçlı kullanım kanıtı

### İlk 24 Saat

1. **Sızıntıyı durdur:** açık endpointi, RLS'yi düzelt.
2. **Kapsamı belirle:** kaç kullanıcı etkilendi, hangi veriler?
3. **Hukuk + DPO bilgilendir:** privacy@rollpit.com
4. **Sızdırılan veriler iptal et:** token rotasyonu, parola sıfırlama.
5. **Sentry / PostHog → veri kaldırma:** etkilenen kayıtlar.
6. **War room:** SEV-0, IC senior dev/lead.

### 72 Saat İçinde

- **KVKK Kurumu bildirimi:** zorunlu (KVKK m.12/5).
- **GDPR Authority bildirimi:** AB kullanıcı varsa.
- **Etkilenen kullanıcı bildirimi:** e-posta + uygulama içi banner.

### Kullanıcıya Mesaj Şablonu

```
Konu: Rollpit Hesabını Etkileyen Güvenlik Olayı

Merhaba [Kullanıcı Adı],

[TARİH] tarihinde Rollpit platformunda bir güvenlik olayı tespit ettik.
Soruşturmamız sonucunda hesabına ilişkin şu bilgilerin yetkisiz erişim
riski altında olduğunu belirledik:

- E-posta adresi
- [Etkilenen veri türü]

Aşağıdaki bilgiler etkilenmemiştir:
- [Etkilenmeyen veri türü]

NE YAPTIK?
- Sızıntıyı [SÜRE] içinde durdurduk.
- Etkilenen sistemleri yeniden tasarladık.
- KVKK Kurumu'na bildirimde bulunduk.

NE YAPMALISIN?
- Rollpit parolanı değiştir.
- Aynı parolayı başka servislerde kullanıyorsan oraları da değiştir.
- Şüpheli e-postalara karşı dikkatli ol (oltalama riski).

Daha fazla bilgi: privacy@rollpit.com
Detaylı rapor: https://rollpit.com/security/incident-[ID]

Üzgünüz. Güveninizi geri kazanmak için elimizden geleni yapacağız.

Rollpit Ekibi
```

---

## 7. Post-mortem Şablonu

Her SEV-0/SEV-1 incident için zorunlu, SEV-2 için önerilir.
Notion sayfası: `Engineering > Post-Mortems`.

```markdown
# Post-Mortem: [Incident Başlığı]

**Tarih:** YYYY-MM-DD
**Süre:** XX saat YY dakika
**Severity:** SEV-X
**Etkilenen kullanıcı:** ~N (veya tahmin)
**IC:** [İsim]

## Özet

[2-3 cümlede ne oldu, ne yapıldı]

## Etki

- Etkilenen kullanıcı sayısı
- Etkilenen özellikler
- Toplam downtime
- Veri kaybı (varsa)

## Zaman Çizelgesi

| Zaman (UTC+3) | Olay |
|---|---|
| 11:45 | İlk alarm (PagerDuty) |
| 11:48 | On-call ack |
| 11:52 | War room açıldı |
| 12:05 | Kök sebep tespit |
| 12:18 | Mitigation uygulandı |
| 12:30 | Servis %100 stabil |

## Kök Sebep (Root Cause)

[Tek bir cümlede ne oldu — "5 Why" tekniğiyle]

## Tetikleyici (Trigger)

[Hata neden ortaya çıktı? Hangi değişiklik?]

## Çözüm

[Sorunu nasıl giderdik?]

## Önleyici Aksiyonlar

| Aksiyon | Sahip | Son Tarih | Durum |
|---|---|---|---|
| [Test ekle] | @ahmet | 2026-05-15 | Açık |
| [Alarm ekle] | @selin | 2026-05-10 | Açık |
| [Dokümantasyon güncelle] | @cem | 2026-05-12 | Açık |

## Ne İyi Gitti

- ...

## Ne Kötü Gitti

- ...

## Şanslı / Kötü Tesadüfler

- ...

## Öğrendiklerimiz

- ...
```

### Blameless Post-Mortem

- Kişi suçlama yok.
- "X yüzünden" değil, "süreç eksikliği yüzünden" çerçeveleme.
- Hatadan ders çıkarmak hedef.

---

## 8. Sıkı Bağlam: KVKK Bildirim Yükümlülüğü

KVKK m.12/5: "Veri sorumlusu, ihlali öğrendiği tarihten itibaren en geç 72 saat içinde Kurul'a bildirir."

Süreç:
1. Veri ihlali tespit → Hukuk birimine bilgi (max 12 saat)
2. Hukuk → KVKK Kurumu'na resmi bildirim (max 72 saat)
3. Kullanıcılara bildirim → Kurul'un takdirine bağlı, genelde paralel

Form: [KVKK Veri İhlali Bildirim Formu](https://kvkk.gov.tr) (online).

---

## 9. App Crisis (App Store / Play Store Sorunu)

### Senaryo: App Store Reddi

**Olay:** Apple submission rejected.

**Aksiyon:**
1. Reddedilme nedenini oku (App Store Connect mesaj).
2. Tipik sebepler:
   - Guideline 1.2: UGC moderasyon yetersiz → `18_TOPLULUK_KURALLARI.md` denetimi
   - Guideline 5.1.1(v): hesap silme eksik → akış check
   - Konum izni metni belirsiz → Info.plist düzelt
3. Hızlı düzeltme + resubmit (24-48 saat hedef).
4. Halka açık bir gecikme varsa: Twitter/X duyurusu.

### Senaryo: Play Store Suspension

**Aksiyon:**
1. Google Play Console > Issue tab.
2. Politika ihlali ise: app revize, appeal başvurusu.
3. Süre: 7-14 gün (Google'ın kontrolünde).
4. Kullanıcılara: "Geçici olarak Play Store'da yokuz, mevcut kullanıcılar etkilenmiyor."

---

## 10. Disaster Recovery (DR)

### Senaryolar

| Senaryo | RTO (Recovery Time) | RPO (Data Loss) |
|---|---|---|
| Fly.io region down (`fra`) | 30 dk | 0 (multi-region API) |
| Supabase Postgres corrupt | 2 saat | < 5 dk (PITR) |
| Cloudflare R2 region down | 1 saat | 0 (multi-region replication) |
| Tüm Cloudflare down | Beklemek | Belirsiz |
| Saldırı (DDoS) | < 1 saat (Cloudflare Pro) | 0 |

### Periyodik DR Drill (3 ayda bir)

- "Kasten" servis öldür (staging'de):
  - `fly machine kill --app rollpit-api`
  - Postgres failover trigger
  - R2 yanlış endpoint
- Süreyi ölç, runbook eksiklerini bul.

---

## 11. İletişim Şablonları

### A) Status Sayfası — "Investigating"

```
[Servis Adı] - [SEV Düzeyi]
Rollpit API'de gecikme yaşıyoruz. Ekibimiz inceliyor.
Tahmini düzeltme süresi henüz net değil. 15 dk içinde güncelleyeceğiz.
```

### B) Status Sayfası — "Identified"

```
[Servis Adı] - [SEV Düzeyi]
Sorunun kaynağını tespit ettik: [kısa açıklama].
Düzeltme uyguluyoruz. Tahmini ETA: [süre].
```

### C) Status Sayfası — "Resolved"

```
[Servis Adı] - Çözüldü
Servis [saat] itibarıyla normale döndü.
[Süre] boyunca etkilenen kullanıcılarımızdan özür dileriz.
Detaylı post-mortem 72 saat içinde paylaşılacak.
```

### D) Twitter/X — Aktif İncident

```
🛠️ Rollpit'de [servis adı] geçici olarak yavaş/erişilemez. Ekibimiz
çalışıyor. Güncel bilgi için: status.rollpit.com
```

### E) Twitter/X — Çözüm Sonrası

```
✅ Rollpit normale döndü. [Süre] boyunca yaşadığınız sorun için özür
dileriz. Daha güçlü dönüş için iyileştirmeler yapıyoruz. 🙏
```

### F) Uygulama İçi Banner

```
"Rollpit'de bazı özellikler geçici olarak sınırlı. Ekibimiz çalışıyor."
```

---

## 12. Eşik Değerleri Otomatik Aksiyonlar

### Otomatik Maintenance Modu

```typescript
// Eğer 5xx oranı %50'yi aşarsa otomatik maintenance modu
if (errorRate5xx > 0.5 && timeWindow === '5m') {
  await flyApi.setSecret('MAINTENANCE_MODE', 'true');
  Sentry.captureMessage('AUTO: Maintenance mode activated');
}
```

> Bu özellik V1.0'da yok; Faz 2'de eklenir. Manuel müdahale gerekecek.

### Otomatik Rollback

GitHub Actions deploy:
- Deploy sonrası 5 dk sağlık kontrol
- Hata oranı yükselirse otomatik rollback

```yaml
- name: Deploy + Auto-rollback
  run: |
    fly deploy --app rollpit-api
    sleep 300
    if ! curl -f https://api.rollpit.com/health; then
      fly releases rollback --app rollpit-api -y
      exit 1
    fi
```

---

## 13. Ekip İçi Rota

| Hafta | Kim |
|---|---|
| 1 | Kişi 1 |
| 2 | Kişi 2 |
| 3 | Kişi 3 |
| 4 | Kişi 1 |
| ... | döngü |

PagerDuty schedule: `rollpit-oncall-primary`.

### Yorgunluk Yönetimi

- Hafta içinde > 3 gece çağrı → ertesi gün izin (compensatory).
- 4 hafta üst üste P0 incident → rotation atla.
- Geri bildirim formu: aylık on-call deneyim anketi.

---

## 14. Müşteri Tarafı — Geri Bildirim Kanalı

- `support@rollpit.com` → Linear + Slack #support
- Uygulama içi "Geri bildirim gönder" → Linear ticket
- Twitter/X mention → CM yanıt verir
- App Store / Play Store yorum → CM + üst seviye dev haftalık review

Bu sürecin detayı: `24_MUSTERI_DESTEK.md`.
