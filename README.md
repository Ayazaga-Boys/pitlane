# Rollpit

Rollpit is a map-first social app for car and motorcycle communities.

## Monorepo

```text
apps/
  mobile/      Flutter app owned by Kisi 1
  realtime/    Go WebSocket service owned by Kisi 1
  backend/     Node/TypeScript API owned by Kisi 2
  admin/       Next.js admin panel owned by Kisi 3
docs/          Product, architecture, sprint, and track docs
```

## First Local Commands

```bash
pnpm install
pnpm --filter @rollpit/backend dev

cd apps/mobile
flutter pub get
flutter run
```

The Go realtime service requires Go 1.22+.
