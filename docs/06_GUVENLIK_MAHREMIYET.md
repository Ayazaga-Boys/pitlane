# 06 — Güvenlik & Mahremiyet

---

## 1. Kimlik Doğrulama Akışı

### JWT Yaşam Döngüsü

```
Flutter → Supabase Auth → access_token (1 saat) + refresh_token (30 gün)
Flutter → flutter_secure_storage → token sakla (Keychain / Keystore)
Flutter → Her API isteğinde → Authorization: Bearer <access_token>
Backend → supabase.auth.getUser(token) → doğrula
Backend → c.set('userId', user.id) → route handler'a ilet
```

- `access_token` süresi dolduğunda `supabase_flutter` otomatik yeniler.
- `refresh_token` rotasyonu aktif (Supabase dashboard).
- Token'lar asla `localStorage`, `SharedPreferences` gibi şifresiz depolarda tutulmaz.

### Apple / Google Sign-In

```dart
// lib/features/auth/providers/auth_provider.dart
Future<void> signInWithGoogle() async {
  await supabase.auth.signInWithIdToken(
    provider: OAuthProvider.google,
    idToken: googleIdToken,
    accessToken: googleAccessToken,
  );
}
```

---

## 2. Konum Mahremiyeti — Detay

### H3 Hücre Boyutu Referans

| Çözünürlük | Ortalama Alan | Kenar Uzunluğu | Kullanım |
|---|---|---|---|
| 7 | ~5 km² | ~1.2 km | İl/bölge gösterimi |
| 8 | ~460 m² | ~460 m | Isı haritası |
| 9 | ~105 m² | ~174 m | Yakınlık / flare / yardım |

### Veri Akışı (Konum)

```
[Cihaz GPS]
    │  (ham koordinat — asla iletilmez)
    ▼
[h3_dart: geoToH3(lat, lng, resolution: 9)]
    │  h3Cell: "89283082803ffff"
    ▼
[Go WebSocket] ──WS──▶ /ws/location
    │
    ├──▶ Valkey: SET loc:user:{id} {h3Cell} EX 300
    │
    └──▶ Pub/Sub: PUBLISH cell:89283082803ffff {userId}
                        │
                  [Aynı hücredeki aboneler bildirim alır]
```

### Hayalet Mod Uygulaması

```dart
// Flutter — hayalet mod açıkken konum gönderme
Future<void> sendLocation(Position pos) async {
  final isGhost = ref.read(profileProvider).valueOrNull?.ghostMode ?? false;
  if (isGhost) return; // erken çık, hiç göndermez

  final cell = toH3Cell(pos.latitude, pos.longitude);
  _wsChannel.sink.add(jsonEncode({'type': 'location', 'h3_cell': cell}));
}
```

```go
// Go — hayalet mod değişikliğinde Valkey kaydını sil
func (h *Hub) HandleGhostMode(userID string, enabled bool) {
    if enabled {
        h.store.DeleteUserCell(context.Background(), userID)
        h.removeFromAllCells(userID)
    }
}
```

---

## 3. Row Level Security — Detay

### Temel İlkeler

1. Her tablo için `ENABLE ROW LEVEL SECURITY` zorunlu.
2. Politika olmayan tablo tamamen erişilmez (varsayılan deny).
3. `SECURITY DEFINER` fonksiyonlar yalnızca trigger'larda ve `service_role` context'inde.
4. Flutter uygulaması `anon_key` kullanır; `service_role_key` asla istemciye gönderilmez.

### Çakışan Politikalar

Aynı tabloda birden fazla SELECT politikası varsa Supabase bunları `OR` ile birleştirir.
Bu nedenle politika isimleri açıklayıcı olmalıdır:

```sql
-- Doğru: her politika tek bir senaryoyu kapsar
CREATE POLICY "msg_select_dm"   ON public.messages FOR SELECT USING (...);
CREATE POLICY "msg_select_comm" ON public.messages FOR SELECT USING (...);

-- Yanlış: her şeyi tek politikada birleştirmek (okunaksız, hata yapar)
CREATE POLICY "msg_select_all"  ON public.messages FOR SELECT USING (... OR ... OR ...);
```

---

## 4. Gizli Değer (Secret) Yönetimi

### Ortam Değişkeni Sınıflandırması

| Değişken | Nerede | Flutter'a gider mi? |
|---|---|---|
| `SUPABASE_URL` | Backend + Flutter | ✅ (public) |
| `SUPABASE_ANON_KEY` | Backend + Flutter | ✅ (public, RLS ile korunur) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yalnızca Backend + Admin | ❌ |
| `R2_SECRET_ACCESS_KEY` | Yalnızca Backend | ❌ |
| `CF_STREAM_API_TOKEN` | Yalnızca Backend | ❌ |
| `TRIGGER_SECRET_KEY` | Yalnızca Backend | ❌ |
| `GO_WS_INTERNAL_SECRET` | Backend + Go Servisi | ❌ |

### CI/CD Secret Enjeksiyonu

```yaml
# .github/workflows/deploy.yml
- name: Deploy Backend
  env:
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    R2_SECRET_ACCESS_KEY:      ${{ secrets.R2_SECRET_ACCESS_KEY }}
  run: fly deploy --app pitlane-api
```

Flutter'da gizli değer: `--dart-define` ile build-time enjeksiyon:

```bash
flutter build ios \
  --dart-define=SUPABASE_URL=https://xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ...
```

---

## 5. İletişim Güvenliği

- Tüm HTTP trafiği: **TLS 1.3** (Cloudflare + Fly.io varsayılan).
- WebSocket: **WSS** (wss://realtime.pitlane.app).
- Certificate pinning: ilk sürümde opsiyonel; V2'de uygulanacak (Flutter `http_certificate_pinning`).
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`.

---

## 6. Input Güvenliği

### SQL Injection

Supabase JS SDK parametreli sorgular kullanır; raw SQL asla kullanıcı girdisi ile birleştirilmez.

```typescript
// Doğru
const { data } = await supabase
  .from('communities')
  .select('*')
  .eq('slug', userInput); // parametrik

// Yanlış (asla yapma)
const { data } = await supabase.rpc(`SELECT * FROM communities WHERE slug = '${userInput}'`);
```

### XSS (Admin Panel)

Next.js App Router varsayılan olarak dangerouslySetInnerHTML kullanmaz.
Kullanıcı girdisi `DOMPurify` ile sanitize edilir.

### Rate Limiting

Backend Hono middleware:

```typescript
import { rateLimiter } from 'hono-rate-limiter';

const limiter = rateLimiter({
  windowMs: 60_000,
  limit: 200,
  keyGenerator: (c) => c.get('userId') ?? c.req.header('CF-Connecting-IP') ?? 'anon',
});
app.use('/v1/*', limiter);
```

---

## 7. KVKK / GDPR Uyumu

### Veri Minimizasyonu

- Ham GPS koordinatı hiçbir zaman persist edilmez (Kural 1).
- Araç plakası backend'de `bcrypt` hash'lenir; tam plaka sadece kullanıcıya gösterilir.
- Silinen kullanıcı: profil anonim hale getirilir (`username = deleted_<uuid>`, kişisel veriler NULL).

### Hesap Silme Akışı

```typescript
// src/routes/profiles.ts — DELETE /v1/profiles/me
async function deleteAccount(userId: string) {
  // 1. Supabase Auth'dan sil (cascade: profiles, mesajlar anonim olur)
  await supabaseAdmin.auth.admin.deleteUser(userId);
  // 2. Valkey'den konum kaydını sil
  await redisClient.del(`loc:user:${userId}`);
  // 3. Trigger.dev job: 30 gün sonra medya dosyalarını R2'den sil
  await triggerClient.sendEvent({
    name: 'user.delete.media',
    payload: { userId, deleteAfterDays: 30 },
  });
}
```

### Veri Dışa Aktarma (GDPR Madde 20)

- `GET /v1/profiles/me/export` → arka planda Trigger.dev job başlatır.
- 24 saat içinde e-posta ile JSON arşiv linki gönderilir.
- Link 48 saat geçerli, R2 presigned URL.

---

## 8. İçerik Güvenliği

### Moderasyon Akışı

1. Kullanıcı içerik şikayet eder → `POST /v1/reports`.
2. Trigger.dev job admin paneline bildirim gönderir.
3. Admin panelinde moderatör içeriği inceler: sil / uyar / ban.
4. Tekrarlayan ihlaller: otomatik geçici ban (Trigger.dev).

### Medya Güvenliği

- Cloudflare Images: `NSFW detection` Cloudflare Workers ile (Faz 2).
- Vidyo: Cloudflare Stream watermark opsiyonel.
- R2 bucket'ı public değil; sadece presigned URL veya Cloudflare Images CDN üzerinden erişilir.

---

## 9. WebSocket Güvenliği (Go Servisi)

```go
// İlk bağlantıda JWT doğrulama
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
    token := r.URL.Query().Get("token")
    userID, err := h.verifySupabaseJWT(token)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil { return }
    client := &Client{hub: h, conn: conn, userID: userID, send: make(chan []byte, 256)}
    h.register <- client
    go client.writePump()
    go client.readPump()
}
```

- Token her WS bağlantısında doğrulanır.
- Bağlantı başına 1 kullanıcı (çoklu sekme → çoklu bağlantı).
- Flood koruması: 1 saniyede 10'dan fazla mesaj → bağlantı kesilir.