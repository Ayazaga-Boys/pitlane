# 20 — Bildirim Stratejisi

> Push bildirim taksonomisi, payload formatı, tetikleyici mantığı ve A/B test çerçevesi.
> Hedef: Kullanıcıya değer katan, spam olmayan, opt-out kolay bildirim sistemi.

---

## 1. İlkeler

1. **Bildirim ≤ değer.** Her bildirim kullanıcı için somut değer üretmeli.
2. **Sessizlik haktır.** Tüm kategoriler ayrı toggle'lı, varsayılan açık ama opt-out kolay.
3. **Yerel saat farkı.** Bildirimler kullanıcı saat dilimine göre planlanır.
4. **Sessiz saat.** 23:00 – 08:00 arası yalnızca acil yardım bildirimi geçer.
5. **Tek seferde 1 mesaj.** Aynı kullanıcıya 5 dk içinde aynı tür birden fazla bildirim gönderilmez (debounce).

---

## 2. Bildirim Kategorileri

| ID | Kategori | Öncelik | Kanal | Sessiz saat? |
|---|---|---|---|---|
| `help_nearby`     | Yakındaki acil yardım | 🔴 Kritik | Push + in-app | Geçer (acil) |
| `help_helper_arrived` | Helper geldi | 🟠 Önemli | Push + in-app | Geçer |
| `flare_invite`    | Flare daveti | 🟡 Normal | Push | Sessizleşir |
| `flare_starting`  | Flare 1 saat sonra | 🟡 Normal | Push | Sessizleşir |
| `rsvp_update`     | Yeni RSVP geldi | 🟢 Düşük | In-app | Off |
| `dm_new`          | Yeni DM | 🟡 Normal | Push (kullanıcı toggle) | Sessizleşir |
| `community_message` | Topluluk mesajı | 🟢 Düşük | In-app (push opsiyonel) | Off |
| `community_invite` | Topluluk daveti | 🟡 Normal | Push | Sessizleşir |
| `business_pin_verified` | İşletme onaylandı | 🟢 Düşük | Push + e-posta | Off |
| `system`          | Sistem bildirimi | 🟢 Düşük | In-app | Off |
| `app_update_available` | Yumuşak güncelleme | 🟢 Düşük | In-app | Off |

> "Sessizleşir" = sessiz saatte gönderilir ama ses ve titreşim olmaz; badge artar.

---

## 3. Payload Formatı

### FCM (Android)

```json
{
  "to": "<device_token>",
  "notification": {
    "title": "🚨 Yakında yardım gerekiyor",
    "body":  "100 m mesafede bir motosiklet sürücüsü acil yardım istiyor."
  },
  "data": {
    "type":     "help_nearby",
    "help_id":  "01HXYZ...",
    "h3_cell":  "89283082803ffff",
    "deep_link":"/help/01HXYZ..."
  },
  "android": {
    "priority": "high",
    "notification": {
      "channel_id": "help_critical",
      "color":      "#E63946",
      "icon":       "ic_notif_sos",
      "sound":      "sos.aiff"
    }
  }
}
```

### APNs (iOS)

```json
{
  "aps": {
    "alert": {
      "title": "🚨 Yakında yardım gerekiyor",
      "body":  "100 m mesafede bir motosiklet sürücüsü acil yardım istiyor."
    },
    "sound": {
      "critical": 1,
      "name":     "sos.aiff",
      "volume":   1.0
    },
    "badge": 1,
    "interruption-level": "time-sensitive",
    "thread-id": "help_nearby"
  },
  "type":      "help_nearby",
  "help_id":   "01HXYZ...",
  "h3_cell":   "89283082803ffff",
  "deep_link": "/help/01HXYZ..."
}
```

> `critical: 1` Apple'dan onay gerektirir (Critical Alert entitlement). Acil yardım için başvuru yapılır; reddedilirse normal sound kullanılır.

---

## 4. Android Notification Channels

```kotlin
// android/app/src/main/kotlin/.../MainActivity.kt
val channels = listOf(
    NotificationChannel("help_critical",     "Acil Yardım Çağrıları",  NotificationManager.IMPORTANCE_HIGH),
    NotificationChannel("flare",             "Etkinlik Bildirimleri",   NotificationManager.IMPORTANCE_DEFAULT),
    NotificationChannel("messages",          "Mesajlar",                NotificationManager.IMPORTANCE_DEFAULT),
    NotificationChannel("community",         "Topluluk Bildirimleri",   NotificationManager.IMPORTANCE_LOW),
    NotificationChannel("system",            "Sistem",                  NotificationManager.IMPORTANCE_LOW)
)
```

Kullanıcı sistem ayarlarından channel bazında devre dışı bırakabilir.

---

## 5. iOS Notification Categories (Action Buttons)

```swift
// ios/Runner/AppDelegate.swift
let helpCategory = UNNotificationCategory(
    identifier: "HELP_NEARBY",
    actions: [
        UNNotificationAction(identifier: "RESPOND",  title: "Yardım Edeceğim", options: [.foreground]),
        UNNotificationAction(identifier: "DISMISS",  title: "Kapat",            options: [.destructive])
    ],
    intentIdentifiers: [],
    options: []
)
UNUserNotificationCenter.current().setNotificationCategories([helpCategory])
```

---

## 6. Tetikleyici Mantığı

### `help_nearby`

```typescript
// src/jobs/notifications.ts
export const sendHelpNotification = task({
  id: 'send-help-notification',
  run: async (payload: { helpRequestId: string; h3Cell: string }) => {
    // 1. k-ring 2 hücreleri al
    const { gridDisk } = await import('h3-js');
    const cells = gridDisk(payload.h3Cell, 2);

    // 2. Valkey'den o hücrelerdeki aktif kullanıcıları al
    const userIds = await fetchActiveUsersInCells(cells);

    // 3. Talepin sahibi kendi push'unu almasın
    const { data: req } = await sb.from('help_requests').select('requester_id').eq('id', payload.helpRequestId).single();
    const targets = userIds.filter(id => id !== req.requester_id);

    // 4. Block olanları çıkar
    const blockedFiltered = await filterByBlocks(targets, req.requester_id);

    // 5. Push gönder (firebase-admin)
    for (const userId of blockedFiltered) {
      await sendPushToUser(userId, buildHelpPushPayload(payload));
    }

    // 6. notifications tablosuna yaz (in-app feed)
    await sb.from('notifications').insert(
      blockedFiltered.map(uid => ({
        user_id: uid,
        type:    'help_nearby',
        title:   '🚨 Yakında yardım gerekiyor',
        body:    'Yardımcı olabilir misin?',
        data:    { help_id: payload.helpRequestId, h3_cell: payload.h3Cell },
      }))
    );
  },
});
```

### `flare_starting` (Cron)

```typescript
// 5 dk'da bir çalışan job
export const flareStartingReminder = schedules.task({
  id: 'flare-starting-reminder',
  cron: '*/5 * * * *',
  run: async () => {
    const sb = getSupabaseAdmin();

    // 60 dk içinde başlayan ve henüz bildirim gönderilmemiş flares
    const { data: flares } = await sb
      .from('flares')
      .select('id, title, starts_at')
      .eq('status', 'active')
      .gte('starts_at', new Date(Date.now() + 55 * 60_000).toISOString())
      .lte('starts_at', new Date(Date.now() + 65 * 60_000).toISOString());

    for (const flare of flares ?? []) {
      const { data: rsvps } = await sb
        .from('flare_rsvps')
        .select('user_id')
        .eq('flare_id', flare.id)
        .eq('status', 'going');

      for (const rsvp of rsvps ?? []) {
        await sendPushToUser(rsvp.user_id, {
          title: `⏰ ${flare.title} 1 saat sonra başlıyor`,
          body:  'Hazır mısın? Detaylar için tıkla.',
          data:  { type: 'flare_starting', flare_id: flare.id },
        });
      }
    }
  },
});
```

### `dm_new`

- Kullanıcı sohbet ekranındaysa push GÖNDERİLMEZ (Realtime presence ile tespit edilir).
- Sadece app kapalı veya farklı ekrandaysa.

```typescript
// Mesaj insert sonrası
await triggerClient.sendEvent({
  name: 'dm.new',
  payload: { messageId, recipientId, senderId },
});
```

```typescript
export const dmNewNotification = task({
  id: 'dm-new-notification',
  run: async (payload) => {
    // Recipient'ın presence durumunu kontrol et
    const isActive = await isUserActiveInChat(payload.recipientId, payload.senderId);
    if (isActive) return; // Skip — kullanıcı zaten görüyor

    // Recipient bildirim toggle'ını kontrol et
    const prefs = await getUserNotificationPrefs(payload.recipientId);
    if (!prefs.dm_new_enabled) return;

    // Quiet hours kontrolü
    if (isQuietHourForUser(payload.recipientId)) {
      // Yine de gönder ama silent (badge only)
      await sendSilentPush(payload.recipientId, /* ... */);
      return;
    }

    await sendPushToUser(payload.recipientId, buildDmPushPayload(payload));
  },
});
```

---

## 7. Cihaz Token Yaşam Döngüsü

### Kayıt

```dart
// Flutter — login sonrası
final token = await FirebaseMessaging.instance.getToken();
await dio.post('/v1/notifications/devices', data: {
  'platform': Platform.isIOS ? 'ios' : 'android',
  'token':    token,
  'app_build': await packageInfo.buildNumber,
});

// Token yenileme listener
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
  await dio.post('/v1/notifications/devices', data: { /* ... */ });
});
```

### Logout

```dart
final token = await FirebaseMessaging.instance.getToken();
await dio.delete('/v1/notifications/devices/$token');
await Supabase.instance.client.auth.signOut();
```

### Geçersiz Token Temizliği

FCM/APNs `NOT_REGISTERED` veya `INVALID_TOKEN` döndürdüğünde:

```typescript
// firebase-admin response handling
if (errorCode === 'messaging/registration-token-not-registered') {
  await sb.from('push_devices').delete().eq('token', token);
}
```

---

## 8. Kullanıcı Tercihleri

`profiles.notification_prefs` JSONB sütunu (Sprint 4'te eklenir):

```json
{
  "help_nearby":       true,
  "help_helper_arrived": true,
  "flare_invite":      true,
  "flare_starting":    true,
  "dm_new":            true,
  "community_message": false,
  "community_invite":  true,
  "system":            true,
  "quiet_hours_start": "23:00",
  "quiet_hours_end":   "08:00"
}
```

UI: Ayarlar → Bildirimler → Toggle her kategori için.

---

## 9. A/B Test Çerçevesi

PostHog feature flag ile bildirim metni varyantları:

```typescript
const variant = posthog.getFeatureFlag('help_push_copy_v2');
const title = variant === 'urgent'
  ? '🚨 Acil yardım gerekiyor!'
  : '🚨 Yakında yardım gerekiyor';
```

Metrikler:
- **Açılma oranı (CTR):** `notification_opened` event / gönderilen sayı
- **Aksiyon oranı:** Bildirimi açıp ardından "yardım edeceğim" basanlar / açanlar
- **Unsubscribe oranı:** Kategori toggle off / gönderilen sayı

> Test süresi: minimum 7 gün, p < 0.05.

---

## 10. Spam Koruması & Rate Limit

| Kategori | Kullanıcı başına |
|---|---|
| `help_nearby` | Saatte max 5 (kötüye kullanım engeli) |
| `flare_invite` | Saatte max 3 |
| `dm_new` | Saatte max 30 |
| `community_message` | Günde max 5 |

Aşıldığında: bildirim atlanır, in-app feed'e düşer (badge artar).

---

## 11. Monitoring & Metrikler

| Metrik | Aletleme | Hedef |
|---|---|---|
| Push gönderim başarı oranı | Trigger.dev metrics + Sentry | > %99 |
| FCM/APNs latency P95 | Custom metric (Axiom) | < 3 sn |
| Bildirim açılma oranı (CTR) | PostHog | > %25 (yardım), > %10 (genel) |
| Opt-out oranı | DB query | < %5/ay |
| Token geçersizleşme oranı | DB query | < %2/ay |

---

## 12. E-posta Bildirimi (Yardımcı Kanal)

Push'a alternatif veya destekleyici. Şimdilik 4 senaryo:

| Senaryo | Tetik | Şablon |
|---|---|---|
| Hoş geldin | İlk login | `welcome.html` |
| İşletme onayı | Pin verified | `business_verified.html` |
| Veri dışa aktarım hazır | Job tamamlandı | `data_export.html` |
| Hesap silme onayı | Silme talebi | `account_deletion.html` |

> E-posta sağlayıcı: **Resend** (TR'ye yakın AB sunucu, geliştirici dostu).

```typescript
// src/services/email.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, template: string, data: Record<string, unknown>) {
  await resend.emails.send({
    from: 'Rollpit <hello@rollpit.com>',
    to,
    subject: getSubject(template, data),
    react: await loadTemplate(template, data),
  });
}
```

---

## 13. SMS (Faz 2)

Yardım çağrılarında push düşmediğinde fallback olarak SMS düşünülüyor (yüksek maliyet, V1.0'da yok). Sağlayıcı tercih: **Twilio** veya **Netgsm** (TR yerel).

---

## 14. Test Stratejisi

### Lokal Geliştirme

```bash
# FCM test
firebase-tools messaging:send --token=<TOKEN> --notification.title=Test
```

### Staging E2E

- Test cihazı havuzu (1 iOS, 1 Android, 1 Android < 13).
- Her sprint sonu push çalıştığı doğrulanır (E2E checklist).

### Yük Testi

- 10k kullanıcı simülasyonu, 1 dk içinde help_nearby push'u tetiklenir.
- Hedef: %99'u 5 sn içinde teslim.

---

## 15. Hata Yönetimi

```typescript
try {
  await admin.messaging().send(message);
} catch (e: any) {
  switch (e.code) {
    case 'messaging/registration-token-not-registered':
      await deletePushToken(token);
      break;
    case 'messaging/invalid-registration-token':
      await deletePushToken(token);
      break;
    case 'messaging/quota-exceeded':
      Sentry.captureException(e, { tags: { critical: 'push-quota' } });
      // Trigger.dev retry with backoff
      throw e;
    case 'messaging/server-unavailable':
      throw e; // Trigger.dev retry
    default:
      Sentry.captureException(e);
  }
}
```
