# 03 — Mimari Kurallar

> Bu dosyadaki 4 kural **ihlal edilemez**. PR'da bu kurallara aykırı kod reviewer tarafından reddedilir.
> Kural değişikliği yalnızca tüm track lead'lerin onayı + bu dosyada PR ile mümkündür.

---

## Kural 1 — Konum Mahremiyeti: Ham GPS Asla Persist Edilmez

### Neden?
KVKK Madde 6 ve GDPR Madde 9 kapsamında hassas kişisel veri olan konum bilgisi,
kullanıcı rızası olmaksızın saklanamaz. Rollpit'in değer önerisi "mahremiyet varsayılan açık"tır.

### Kurallar

- Flutter, cihazdan aldığı `latitude/longitude` değerini **hiçbir zaman** backend API'ye ham olarak göndermez.
- Konum, cihazda `h3_dart` ile **H3 hücresine** dönüştürülür ve bu hücre gönderilir.
- Go WebSocket servisi gelen H3 hücresini **Valkey'e TTL ile** yazar (varsayılan TTL: 5 dakika).
- Postgres'te hiçbir tabloda `latitude FLOAT`, `longitude FLOAT` alanı bulunmaz.
- Flare (etkinlik) ve yardım sinyali konumları da H3 hücre ID'si olarak saklanır.

### H3 Çözünürlük Tablosu

| Kullanım | Çözünürlük | Yaklaşık Alan |
|---|---|---|
| Isı haritası | 8 | ~460 m² ortalama |
| Yakınlık (kullanıcı eşleştirme) | 9 | ~105 m² ortalama |
| Acil yardım yayın yarıçapı | 9 | k-ring 2 = ~500 m |
| İşletme pini | 9 | Sabit nokta yerine hücre |

### Hayalet Mod

- Hayalet moddaki kullanıcı Go servisine **hiç konum göndermez**.
- Valkey'deki kaydı (varsa) silinir.
- Backend API hayalet mod durumunu `profiles.ghost_mode BOOLEAN` olarak saklar.
- Hayalet moddayken kullanıcı **başkalarını görebilir** ama kendisi görünmez.

### Kod Örneği (Flutter — H3 Dönüşümü)

```dart
// lib/core/utils/location_utils.dart
import 'package:h3_dart/h3_dart.dart';

const int kH3ResHeatmap    = 8;
const int kH3ResProximity  = 9;

String toH3Cell(double lat, double lng, {int resolution = kH3ResProximity}) {
  final h3 = H3();
  return h3.geoToH3(GeoCoord(lat: lat, lng: lng), resolution);
}
```

### Kod Örneği (Go — Valkey'e Yazma)

```go
// internal/location/store.go
const locationTTL = 5 * time.Minute

func (s *Store) SetUserCell(ctx context.Context, userID, h3Cell string) error {
    key := fmt.Sprintf("loc:user:%s", userID)
    return s.rdb.Set(ctx, key, h3Cell, locationTTL).Err()
}

func (s *Store) DeleteUserCell(ctx context.Context, userID string) error {
    key := fmt.Sprintf("loc:user:%s", userID)
    return s.rdb.Del(ctx, key).Err()
}
```

---

## Kural 2 — Medya: Backend Proxy Yasağı

### Neden?
Backend üzerinden medya aktarımı hem bant genişliği maliyetini artırır hem de P95 yükleme
süresini bozar. Cloudflare CDN'in önbelleğini devre dışı bırakır.

### Akış (Zorunlu)

```
Flutter  →  POST /v1/media/upload-url  →  Backend
Backend  →  Presigned URL (R2 / CF Images / CF Stream)  →  Flutter
Flutter  →  PUT <presigned-url> (direkt Cloudflare)
Flutter  →  POST /v1/media/finalize { assetId }  →  Backend
Backend  →  Cloudflare webhook teyit  →  DB'ye metadata yaz
```

### Yasaklar

- Backend'de `multer`, `busboy`, `formidable` gibi multipart body parser **kullanılmaz**.
- Backend route'larında `req.pipe(...)` veya `res.pipe(...)` ile medya akışı **yapılmaz**.
- Flutter'da `MultipartFile` doğrudan backend API URL'sine **gönderilmez**.

### Kod Örneği (Backend — Presigned URL Üretimi)

```typescript
// src/routes/media.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, cmd, { expiresIn: 300 }); // 5 dakika
}
```

---

## Kural 3 — State Yönetimi: Sadece Riverpod Notifier

### Neden?
Dağıtık `setState` çağrıları hata ayıklamayı imkânsız kılar. Tek doğruluk kaynağı
(single source of truth) olmadan UI tutarsızlığı kaçınılmazdır.

### Kurallar

- **Widget içinde `setState`** yalnızca **widget-lokal** ve **sunucu durumunu etkilemeyen** UI durumu için kullanılabilir (ör: bir dropdown'ın açık/kapalı olması).
- Tüm iş mantığı, API çağrıları ve global durum: `AsyncNotifier` veya `Notifier` sınıfında.
- Widget'lar `ref.watch(...)` ile okur; **asla provider'a doğrudan yazar**.
- Magic number yok: `8`, `9`, `300` gibi literal sayılar kod içinde bulunmaz; `core/constants/` altında sabit olarak tanımlanır.
- Provider dosyaları: `lib/features/<feature>/providers/` altında.

### Magic Number Örneği

```dart
// ❌ Yanlış
final cell = h3.geoToH3(coord, 9);

// ✅ Doğru — lib/core/constants/h3_constants.dart
const int kH3ResProximity = 9;
final cell = h3.geoToH3(coord, kH3ResProximity);
```

### AsyncNotifier Şablonu

```dart
// lib/features/map/providers/heatmap_provider.dart
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'heatmap_provider.g.dart';

@riverpod
class HeatmapNotifier extends _$HeatmapNotifier {
  @override
  Future<List<H3Cell>> build() async {
    return _fetchCells();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetchCells);
  }

  Future<List<H3Cell>> _fetchCells() async {
    final repo = ref.read(heatmapRepositoryProvider);
    return repo.getCells();
  }
}
```

---

## Kural 4 — API Güvenliği: JWT + Zod + RLS Üçlüsü

### Neden?
Her katmanda bağımsız doğrulama, derinlemesine savunma (defense in depth) sağlar.
Bir katman atlanırsa diğerleri hâlâ korur.

### Katmanlar

| Katman | Araç | Sorumluluk |
|---|---|---|
| Transport | HTTPS / WSS (TLS 1.3) | Dinleme saldırısı önleme |
| Authentication | Supabase JWT (`HS256`) | Kimlik doğrulama |
| Authorization (API) | Middleware + rol kontrolü | Yetki kontrolü |
| Input Validation | Zod | Injection, tip saldırısı önleme |
| Authorization (DB) | Supabase RLS | Satır seviyesi erişim |

### Zorunlu Middleware (Her Route)

```typescript
// src/middleware/auth.ts
import { createClient } from '@supabase/supabase-js';
import type { Context, Next } from 'hono';

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('userId', user.id);
  await next();
}
```

### Zorunlu Input Validation (Her Route)

```typescript
// src/routes/flares.ts
import { z } from 'zod';

const CreateFlareSchema = z.object({
  title:       z.string().min(3).max(80),
  h3Cell:      z.string().regex(/^[0-9a-f]{15}$/i),
  startsAt:    z.string().datetime(),
  communityId: z.string().uuid().optional(),
});

app.post('/v1/flares', requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = CreateFlareSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 422);
  }
  // İş mantığı...
});
```

### RLS Politikası (Her Tablo İçin Zorunlu)

```sql
-- Varsayılan: hiçbir şeye erişim yok
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Kendi mesajlarını okuyabilir
CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id);

-- Topluluk üyesi mesajları okuyabilir
CREATE POLICY "messages_select_community"
  ON public.messages FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_members
      WHERE user_id = auth.uid()
    )
  );
```

### Yasaklar

- `SUPABASE_SERVICE_ROLE_KEY` Flutter veya admin-dışı bir istemciye **asla** gönderilmez.
- Backend route'larında `RLS bypass` (`supabase.from(...).select()` service role ile) yalnızca admin panel ve Trigger.dev job'larında kullanılabilir, açıkça belgelenmeli.
- `any` tipi TypeScript kodunda **yasak**; `@ts-ignore` yorum + gerekçe olmadan yasak.
