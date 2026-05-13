# 09 — Track 3: Backend (Node.js / TypeScript)

---

## Klasör Yapısı

```
apps/backend/
├── src/
│   ├── index.ts                  # Giriş noktası
│   ├── app.ts                    # Hono app, middleware mount
│   ├── middleware/
│   │   ├── auth.ts               # JWT doğrulama
│   │   ├── rate-limit.ts         # Rate limiting
│   │   └── error-handler.ts      # Global hata yakalama
│   ├── routes/
│   │   ├── index.ts              # Router mount
│   │   ├── profiles.ts
│   │   ├── vehicles.ts
│   │   ├── map.ts
│   │   ├── communities.ts
│   │   ├── flares.ts
│   │   ├── pins.ts
│   │   ├── help.ts
│   │   ├── messages.ts
│   │   ├── media.ts
│   │   ├── notifications.ts
│   │   └── blocks.ts
│   ├── services/
│   │   ├── supabase.ts           # Supabase istemcileri (anon + service)
│   │   ├── r2.ts                 # R2 presigned URL
│   │   ├── cloudflare-images.ts  # CF Images API
│   │   ├── cloudflare-stream.ts  # CF Stream API
│   │   └── trigger.ts            # Trigger.dev client
│   ├── jobs/                     # Trigger.dev task tanımları
│   │   ├── notifications.ts
│   │   ├── media-cleanup.ts
│   │   └── user-delete.ts
│   ├── lib/
│   │   ├── h3.ts                 # H3 yardımcı fonksiyonlar
│   │   ├── ulid.ts               # ID üretimi
│   │   └── logger.ts             # Pino logger
│   ├── schemas/                  # Zod şemaları
│   │   ├── profile.schema.ts
│   │   ├── community.schema.ts
│   │   ├── flare.schema.ts
│   │   ├── help.schema.ts
│   │   ├── media.schema.ts
│   │   └── message.schema.ts
│   └── types/
│       ├── env.d.ts              # process.env tipler
│       └── context.d.ts          # Hono context tipler
├── supabase/
│   └── migrations/
├── test/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
└── .env.example
```

---

## app.ts — Hono Kurulumu

```typescript
// src/app.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';
import { requireAuth } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error-handler.js';
import { mountRoutes } from './routes/index.js';

export function createApp() {
  const app = new Hono();

  // Global middleware
  app.use('*', secureHeaders());
  app.use('*', cors({ origin: ['https://admin.rollpit.com'] }));
  app.use('*', logger());

  // Health check (auth yok)
  app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

  // API v1 (tüm route'lar auth gerektirir)
  const v1 = new Hono();
  v1.use('*', requireAuth);
  v1.use('*', rateLimitMiddleware);
  mountRoutes(v1);
  app.route('/v1', v1);

  // Global hata yakalama
  app.onError(errorHandler);

  return app;
}
```

---

## Middleware — Auth

```typescript
// src/middleware/auth.ts
import { createClient } from '@supabase/supabase-js';
import type { Context, Next } from 'hono';

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
  }

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return c.json({ error: 'Invalid token', code: 'UNAUTHORIZED' }, 401);
  }

  c.set('userId', user.id);
  c.set('userEmail', user.email ?? '');
  await next();
}
```

---

## Middleware — Error Handler

```typescript
// src/middleware/error-handler.ts
import type { Context } from 'hono';
import { logger } from '../lib/logger.js';

export function errorHandler(err: Error, c: Context): Response {
  logger.error({ err, path: c.req.path, method: c.req.method }, 'Unhandled error');

  if (err.name === 'ZodError') {
    return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err }, 422);
  }

  return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500);
}
```

---

## Route Örneği — Flares

```typescript
// src/routes/flares.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { getSupabaseClient } from '../services/supabase.js';
import { CreateFlareSchema, UpdateFlareSchema } from '../schemas/flare.schema.js';

const router = new Hono();

// Yakındaki flare'ler
router.get('/', async (c) => {
  const h3Cell = c.req.query('h3cell');
  const k = Number(c.req.query('k') ?? '2');

  if (!h3Cell) return c.json({ error: 'h3cell gerekli', code: 'BAD_REQUEST' }, 400);

  const nearbyK = Number.isInteger(k) && k > 0 && k <= 5 ? k : 2;
  // h3 k-ring hesaplaması
  const { gridDisk } = await import('h3-js');
  const cells = gridDisk(h3Cell, nearbyK);

  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('flares')
    .select('*, profiles(username, avatar_url)')
    .in('h3_cell', cells)
    .eq('status', 'active')
    .gte('starts_at', new Date(Date.now() - 3_600_000).toISOString())
    .order('starts_at', { ascending: true })
    .limit(50);

  if (error) return c.json({ error: error.message, code: 'INTERNAL_ERROR' }, 500);
  return c.json({ data });
});

// Flare oluştur
router.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = CreateFlareSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, 422);
  }

  const userId = c.get('userId');
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('flares')
    .insert({ ...parsed.data, creator_id: userId })
    .select()
    .single();

  if (error) return c.json({ error: error.message, code: 'INTERNAL_ERROR' }, 500);
  return c.json({ data }, 201);
});

// Flare detay
router.get('/:id', async (c) => {
  const { id } = c.req.param();
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('flares')
    .select('*, profiles(username, avatar_url), communities(name,slug)')
    .eq('id', id)
    .single();

  if (error || !data) return c.json({ error: 'Not found', code: 'NOT_FOUND' }, 404);
  return c.json({ data });
});

// RSVP
router.post('/:id/rsvp', async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');
  const body = await c.req.json();
  const status = z.enum(['going','maybe','not_going']).parse(body.status ?? 'going');

  const sb = getSupabaseClient();
  const { error } = await sb.from('flare_rsvps').upsert(
    { flare_id: id, user_id: userId, status },
    { onConflict: 'flare_id,user_id' },
  );

  if (error) return c.json({ error: error.message, code: 'INTERNAL_ERROR' }, 500);
  return c.json({ data: { ok: true } });
});

export default router;
```

---

## Medya Servisi — Presigned URL

```typescript
// src/services/r2.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ulid } from 'ulid';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const PRESIGNED_TTL_SECONDS = 300;

export async function generateUploadUrl(params: {
  userId:      string;
  assetType:   'photo' | 'video';
  contentType: string;
  extension:   string;
}): Promise<{ uploadUrl: string; storageKey: string; assetId: string }> {
  const id = ulid();
  const storageKey = `${params.assetType}s/${params.userId}/${id}.${params.extension}`;

  const cmd = new PutObjectCommand({
    Bucket:      process.env.R2_BUCKET!,
    Key:         storageKey,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: PRESIGNED_TTL_SECONDS });
  return { uploadUrl, storageKey, assetId: id };
}

export async function deleteObject(storageKey: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key:    storageKey,
  }));
}
```

---

## Trigger.dev — Bildirim Job'u

```typescript
// src/jobs/notifications.ts
import { task } from '@trigger.dev/sdk/v3';
import { getSupabaseAdmin } from '../services/supabase.js';

export const sendHelpNotification = task({
  id: 'send-help-notification',
  run: async (payload: { helpRequestId: string; h3Cell: string }) => {
    const sb = getSupabaseAdmin();

    // Yakındaki aktif kullanıcıları bul (Valkey'den)
    // Bu job Go servisinin publish ettiği bilgiye dayanarak tetiklenir
    const { data: nearbyUsers } = await sb
      .from('notifications')
      .select('user_id')
      .limit(0); // Placeholder: gerçek implementasyonda Valkey'den çekilir

    // FCM bildirimi gönder
    // firebase-admin ile push notification
    console.log('Help notification sent for', payload.helpRequestId);
  },
});

export const deleteUserMedia = task({
  id: 'delete-user-media',
  run: async (payload: { userId: string; deleteAfterDays: number }) => {
    await new Promise(r => setTimeout(r, payload.deleteAfterDays * 86_400_000));
    const sb = getSupabaseAdmin();
    const { data: assets } = await sb
      .from('media_assets')
      .select('storage_key')
      .eq('uploader_id', payload.userId);

    for (const asset of assets ?? []) {
      const { deleteObject } = await import('./r2.js');
      await deleteObject(asset.storage_key);
    }
  },
});
```

---

## Supabase İstemcileri

```typescript
// src/services/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _anonClient: SupabaseClient | null = null;
let _adminClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_anonClient) {
    _anonClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );
  }
  return _anonClient;
}

// Sadece Trigger.dev job'ları ve admin panel için
export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return _adminClient;
}
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "test"]
}
```

---

## .env.example

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudflare R2
R2_ENDPOINT=https://xxxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=rollpit-media

# Cloudflare Images
CF_ACCOUNT_ID=
CF_IMAGES_API_TOKEN=

# Cloudflare Stream
CF_STREAM_API_TOKEN=

# Trigger.dev
TRIGGER_SECRET_KEY=tr_dev_...

# Go Realtime Service (internal)
GO_WS_INTERNAL_SECRET=

# App
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```