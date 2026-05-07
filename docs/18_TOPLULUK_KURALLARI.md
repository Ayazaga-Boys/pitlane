# 18 — Topluluk Kuralları & Moderasyon

> Apple App Store Guideline 1.2 ve Google Play User Generated Content politikası gereği zorunlu.
> Bu dosya iki bölüm içerir:
> 1. **Kullanıcıya gösterilecek topluluk kuralları metni** (TR + EN) — uygulama içinde + web'de.
> 2. **Moderatör runbook'u** — admin paneldeki ekiplerin takip edeceği aksiyonlar.

> Yayın URL: `https://pitlane.app/community-guidelines`

---

## 1. Türkçe Kullanıcı Metni — Pitlane Topluluk Kuralları

```
PİTLANE TOPLULUK KURALLARI

Pitlane, otomobil ve motosiklet tutkunlarının birbirini tanıdığı, etkinlik
düzenlediği ve yolda yardımlaştığı bir platformdur. Bu topluluk hepimizin.
Aşağıdaki kuralların hepsi zorunludur.

1. SAYGI
   - Hakaret, ayrımcılık, taciz, tehdit yasaktır.
   - Cinsiyet, ırk, din, milliyet, cinsel yönelim üzerinden ayrımcılık yapılamaz.
   - Aile, din, futbol takımı tartışmaları otomotiv platformunun konusu değildir.

2. GÜVENLİK
   - Sürerken uygulama kullanmak yasaktır. Pitlane araç hareketliyken
     bazı özellikleri kısıtlar.
   - Ehliyetsiz veya emniyet kemersiz/kasksız sürüş özendirilemez.
   - Yarış yapma çağrısı (drag, sokak yarışı) içerikleri silinir.

3. DOĞRULUK
   - Sahte yardım çağrısı yapmak (oyun olsun diye SOS basmak) hesabın
     kalıcı olarak banlanmasına yol açar.
   - Olmayan etkinlik (flare) açmak yasaktır.
   - İşletme hesabı için sahte vergi belgesi sunmak yasaktır.

4. MAHREMİYET
   - Başkasının izni olmadan fotoğrafını, plakasını veya kişisel bilgisini
     paylaşamazsın.
   - Konum sızıntısı: birinin canlı konumunu ifşa edecek içerik yasaktır.

5. UYGUNSUZ İÇERİK
   - Cinsel içerik (NSFW) yasaktır.
   - Şiddet, kaza fotoğrafı/videosu yasaktır.
   - Yasadışı (uyuşturucu, silah ticareti) içerik yasaktır.
   - Telif hakkı ihlali: izinsiz başkasının görseli yasaktır.

6. SPAM VE TICARI KULLANIM
   - İşletmesi olmayan kullanıcıların reklam paylaşımı yasaktır.
   - İşletme hesapları sadece doğrulanmış pin üzerinden tanıtım yapabilir.
   - Aynı içeriği birden fazla yerde tekrar paylaşmak yasaktır.

7. SAHTE HESAP VE KİMLİK
   - Bir kişiye ait birden fazla hesap yasaktır (aile bireyleri hariç).
   - Başkasının kimliğine bürünmek yasaktır.
   - Bot ve otomatik script kullanımı yasaktır.

8. ŞİKAYET ETMEK
   - Bir içeriği uygunsuz buluyorsan: kart üzerindeki "..." > Şikayet et.
   - 24 saat içinde ekibimiz inceler, gerekli aksiyonu alırız.
   - Bir kullanıcıyı engellemek için: profil > "..." > Engelle.

9. SONUÇLAR
   İhlal seviyesine göre:
   - Uyarı (uygulama içi mesaj)
   - İçerik silme
   - Geçici askıya alma (1-30 gün)
   - Kalıcı ban
   - Yasal yollara başvuru (yasadışı içerik için)

10. İTİRAZ
   Banlandığını düşünüyorsan: privacy@pitlane.app
   30 gün içinde yanıt veririz.

Bu kurallar değişebilir. Önemli değişiklikler 30 gün önceden duyurulur.
Son güncelleme: [TARİH]
```

---

## 2. English User-Facing Text — Pitlane Community Guidelines

```
PITLANE COMMUNITY GUIDELINES

1. RESPECT
   No insults, discrimination, harassment, or threats.

2. SAFETY
   No app use while driving. We restrict certain features when the vehicle is moving.
   Don't promote unlicensed riding/driving or unsafe practices.
   Calls for street racing are removed.

3. AUTHENTICITY
   Fake help signals (SOS pranks) result in permanent ban.
   Fake events ("flares") are not allowed.
   False business documents are not allowed.

4. PRIVACY
   No sharing of someone else's photo, license plate, or personal info without consent.
   No leaking another user's live location.

5. INAPPROPRIATE CONTENT
   No NSFW, no violence/accident gore, no illegal content (drugs, weapons), no copyright infringement.

6. SPAM AND COMMERCIAL USE
   Non-business users may not advertise.
   Business accounts must use the verified pin feature only.
   No cross-posting the same content.

7. FAKE ACCOUNTS
   One person, one account.
   No impersonation.
   No bots or automation.

8. REPORTING
   Tap "..." > Report on any content. We review within 24 hours.

9. CONSEQUENCES
   Warning → Content removal → Temporary suspension (1–30 days) → Permanent ban → Legal action (for illegal content).

10. APPEALS
    Email privacy@pitlane.app — we respond within 30 days.
```

---

## 3. Moderasyon Politikası (Severity Matrix)

| İhlal | İlk Sefer | Tekrar |
|---|---|---|
| Spam (tekrar paylaşım) | İçerik sil | 7 gün suspend |
| Hakaret | Uyarı + içerik sil | 7 gün suspend |
| Taciz / tehdit | 30 gün suspend | Kalıcı ban |
| Sahte SOS | Kalıcı ban (ilk seferde) | — |
| NSFW | Kalıcı ban + içerik sil | — |
| Yasadışı içerik | Kalıcı ban + yetkili merci bildirimi | — |
| Telif ihlali (DMCA) | İçerik sil + uyarı | Kalıcı ban |
| İmposter (kimlik taklidi) | 30 gün suspend + içerik sil | Kalıcı ban |

---

## 4. Moderatör Runbook (Admin Panel İçin)

### 4.1. Şikayet Triajı

1. `/reports` sayfası → status=pending listesini aç.
2. Her şikayeti şu kriterlere göre değerlendir:
   - **Açık ihlal mi?** → Aksiyon al, status=reviewed, action_taken set.
   - **Belirsiz mi?** → 2. moderatöre eskalasyon (ekip Slack kanalı).
   - **Geçersiz mi?** (örn. yanlış anlaşılma) → status=dismissed, action_taken=none.
3. Şikayet edilen kullanıcının geçmişine bak: `/users/[id]` → daha önce kaç şikayet.
4. Aksiyon → `audit_logs`'a otomatik kayıt.

### 4.2. Aksiyon Akışları

#### A) İçerik Silme (mesaj, flare, vs.)

```typescript
// apps/admin/app/(dashboard)/reports/[id]/actions.ts
'use server';

export async function deleteReportedContent(reportId: string) {
  const sb = createAdminSupabaseClient();
  const { data: report } = await sb.from('reports').select('*').eq('id', reportId).single();
  if (!report) return;

  // İçerik tipine göre soft-delete
  if (report.content_type === 'message') {
    await sb.from('messages').update({ is_deleted: true }).eq('id', report.content_id);
  } else if (report.content_type === 'flare') {
    await sb.from('flares').update({ status: 'cancelled' }).eq('id', report.content_id);
  }

  await sb.from('reports').update({
    status: 'reviewed',
    reviewed_by: (await sb.auth.getUser()).data.user!.id,
    reviewed_at: new Date().toISOString(),
    action_taken: 'content_deleted',
  }).eq('id', reportId);

  await sb.from('audit_logs').insert({
    actor_id: (await sb.auth.getUser()).data.user!.id,
    action: 'content_deleted',
    target_type: report.content_type,
    target_id: report.content_id,
    metadata: { report_id: reportId, reason: report.reason },
  });

  revalidatePath('/reports');
}
```

#### B) Kullanıcı Uyarma

- Uygulama içi sistem bildirimi gönderilir (`notifications.type = 'system'`).
- Mesaj şablonu: `notification_templates` (Supabase Storage'da JSON).

#### C) Geçici Askıya Alma

```typescript
await sb.auth.admin.updateUserById(userId, {
  ban_duration: '7d', // 7 gün
});
await sb.from('profiles').update({ role: 'banned' }).eq('id', userId);
// Kullanıcı bilgilendirilir
```

#### D) Kalıcı Ban

- `ban_duration: 'none'` (Supabase: 'none' = sınırsız ban)
- Tüm cihaz token'ları `push_devices`'tan silinir.
- Aktif WebSocket bağlantısı kapatılır.

### 4.3. Eskalasyon Yolu

| Seviye | Kim | Süre |
|---|---|---|
| L1 | Moderatör | 24 saat içinde triaj |
| L2 | Senior moderatör | Belirsiz / hassas (yasal) içerik |
| L3 | Ürün ekibi + Hukuk | Yasal süreç gerektiren ihlaller |
| L4 | CEO / VP | Medya ilgisi çeken vakalar |

### 4.4. Pazartesi Triaj Toplantısı

- Haftalık: bekleyen şikayet sayısı, ortalama yanıt süresi, action breakdown.
- Pattern arama: belirli bir kullanıcı veya konudan tekrar şikayet.
- Otomasyon önerileri (örn. yeni keyword filtresi).

---

## 5. Otomatik Moderasyon (V1.0 + Faz 2)

### V1.0 — Kural Bazlı

- **Mesaj uzunluğu:** 2000 karakter üstü reddedilir (zaten Zod ile).
- **Spam keyword listesi:** `messages_blocked_keywords` tablosu (admin yönetir).
- **Saatlik post limiti:** Bir kullanıcı 1 saatte > 50 mesaj atarsa otomatik 1 saat suspend.
- **NSFW link tespiti:** İçinde `*.xxx, *.porn, ...` geçen URL otomatik silinir.

### Faz 2 — ML Bazlı

- Cloudflare Workers AI ile NSFW görsel tespiti (medya yüklenince).
- Toxicity model (Perspective API alternatifi) ile mesaj skorlaması.
- 0.85 üstü skor → otomatik gizleme + insan review kuyruğuna ekle.

---

## 6. Çocuk Güvenliği (CSAM)

- Asla pasif olamayız. Apple ve Google bunu zorunlu tutar.
- Şüpheli içerik tespit edilirse:
  1. İçerik anında erişilemez yapılır.
  2. NCMEC (ABD) veya yerel makamlara raporlanır (yasal sorumluluk).
  3. Cihaz hash'leri NCMEC database'ine eklenir.

> İlk sürümde manuel moderatör bağımlılığı vardır; Faz 2'de PhotoDNA entegrasyonu hedeflenir.

---

## 7. Karar Şeffaflığı

- Yıllık şeffaflık raporu (Mayıs):
  - Toplam şikayet sayısı
  - Aksiyon dağılımı (silme, suspend, ban)
  - Ortalama yanıt süresi
  - Yasal taleplere yanıt sayısı
- Rapor `pitlane.app/transparency` adresinde yayınlanır.

---

## 8. Apple App Store Guideline 1.2 Checklist

| Madde | Durum |
|---|---|
| Kullanıcı oluşturulan içerik için filtreleme mekanizması | ✅ keyword + manuel review |
| Şikayet/engelleme uygulama içi | ✅ her kart "..." menüsünde |
| Topluluk kuralları görünür | ✅ Onboarding + Ayarlar > Yasal |
| Moderatör için backend araçları | ✅ Admin panel `/reports` |
| 24 saat içinde aksiyon | ✅ runbook ile garanti |

---

## 9. Google Play User Generated Content Policy Checklist

| Madde | Durum |
|---|---|
| Kullanıcı içerik politikası mevcut | ✅ Bu dosya + web URL |
| Şikayet mekanizması | ✅ |
| İhlali sürdüren kullanıcı banı | ✅ |
| Cinsel içerik sıfır toleransı | ✅ |
| CSAM raporlaması | ✅ NCMEC süreci |

---

## 10. İç Eğitim — Moderatör Rehberi

Yeni katılan moderatörler için:
1. Bu dosyayı baştan sona oku.
2. 10 örnek şikayet incele (eski reviewed olanlar) → kararlarını mevcut moderatörle karşılaştır.
3. İlk 1 hafta: kararlar L2 onayından geçer.
4. Aylık eğitim toplantısı: yeni vakalar, politika güncellemeleri.
