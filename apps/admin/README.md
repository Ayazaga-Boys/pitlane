# Rollpit Admin

Next.js 14 admin paneli `apps/admin` altında çalışır.

## Local

```bash
cp .env.example .env.local
pnpm install
pnpm --filter @rollpit/admin dev
```

Gerekli env'ler:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN_ADMIN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT_ADMIN`
- `RESEND_API_KEY` (opsiyonel, pin red e-postası için)
- `ADMIN_FROM_EMAIL` (opsiyonel, pin red e-postası için)
- `REALTIME_ADMIN_HOOK_URL` (opsiyonel, kalıcı ban sonrası aktif WS bağlantılarını kapatmak için)
- `REALTIME_ADMIN_HOOK_SECRET` (opsiyonel, realtime hook koruması)

Not:

- `SUPABASE_SERVICE_ROLE_KEY` yalnızca server-side kullanılır.
- `.env.local` commitlenmez.
- Admin panel varsayılan olarak `http://localhost:3001` üzerinde çalışır.

## Vercel

Admin panel için hedef proje adı: `rollpit-admin`

1. Vercel'de yeni proje oluştur.
2. Root dizin olarak `apps/admin` seç.
3. Framework preset `Next.js` olsun.
4. Aşağıdaki env'leri Vercel'e ekle:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_DSN_ADMIN`
   - `SENTRY_AUTH_TOKEN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT_ADMIN`
   - `RESEND_API_KEY`
   - `ADMIN_FROM_EMAIL`
   - `REALTIME_ADMIN_HOOK_URL`
   - `REALTIME_ADMIN_HOOK_SECRET`
5. Production deploy öncesi local doğrulama çalıştır:

```bash
pnpm --filter @rollpit/admin exec tsc --noEmit
pnpm --filter @rollpit/admin exec eslint app components lib
pnpm --filter @rollpit/admin build
```

## CI / Production

- Vercel deploy için `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secret'ları gerekir.
- CI örneği `docs/13_TEST_KALITE.md` içinde `deploy-admin` job'ında tanımlı.
- Production deploy sonrası kontrol listesi:
  - Login ekranı açılıyor mu
  - Admin role guard çalışıyor mu
  - Dashboard sayaçları gerçek veriyle geliyor mu
  - `users`, `pins`, `reports` sayfaları hata vermeden açılıyor mu
