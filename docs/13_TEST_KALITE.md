# 13 — Test & Kalite

> Her track için test standartları, CI/CD pipeline detayı, lint kuralları ve performans bütçesi.
> "Bitti" tanımı `07_SPRINT_YOL_HARITASI.md`'de belirtilmiştir; bu dosya o tanımın teknik detaylarını içerir.

---

## 1. Test Piramidi

```
         /\
        /  \
       / E2E \        ← Az, yavaş, pahalı (kritik kullanıcı akışları)
      /--------\
     / Entegrasyon \  ← API + DB + WS entegrasyonu
    /--------------\
   /    Unit Tests   \ ← Çok, hızlı, ucuz (iş mantığı)
  /------------------\
```

| Katman | Hedef Kapsam | Araç (Flutter) | Araç (Backend) | Araç (Go) |
|---|---|---|---|---|
| Unit | %80+ kritik iş mantığı | `flutter_test` + `mocktail` | `vitest` | `testify` |
| Entegrasyon | Tüm API endpoint'leri | `integration_test` | `vitest` + Supabase local | `testify` + testcontainers |
| E2E | 5 kritik akış | `patrol` | — | — |

---

## 2. Flutter Test Standartları

### Unit Test — Provider / Notifier

```dart
// test/unit/features/map/heatmap_provider_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pitlane/features/map/providers/heatmap_provider.dart';
import 'package:pitlane/features/map/data/map_repository.dart';

class MockMapRepository extends Mock implements MapRepository {}

void main() {
  group('HeatmapNotifier', () {
    late MockMapRepository mockRepo;
    late ProviderContainer container;

    setUp(() {
      mockRepo = MockMapRepository();
      container = ProviderContainer(
        overrides: [
          mapRepositoryProvider.overrideWithValue(mockRepo),
        ],
      );
    });

    tearDown(() => container.dispose());

    test('başarılı yüklemede hücreleri döndürür', () async {
      final fakeCells = [H3CellCount(h3Cell: '89283082803ffff', count: 5)];
      when(() => mockRepo.getCells()).thenAnswer((_) async => fakeCells);

      final notifier = container.read(heatmapNotifierProvider.notifier);
      final state = await container.read(heatmapNotifierProvider.future);

      expect(state, equals(fakeCells));
    });

    test('hata durumunda AsyncError döner', () async {
      when(() => mockRepo.getCells()).thenThrow(Exception('Network hatası'));

      // Build tamamlanana kadar bekle
      await container.read(heatmapNotifierProvider.future).catchError((_) => []);
      final state = container.read(heatmapNotifierProvider);

      expect(state, isA<AsyncError>());
    });
  });
}
```

### Widget Test

```dart
// test/widget/shared/pitlane_button_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pitlane/shared/widgets/pitlane_button.dart';

void main() {
  group('PitlaneButton', () {
    testWidgets('onPressed çağrıldığında callback tetiklenir', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PitlaneButton(
              label: 'Test',
              onPressed: () => tapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Test'));
      expect(tapped, isTrue);
    });

    testWidgets('loading durumunda buton devre dışı', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PitlaneButton(label: 'Test', onPressed: null, isLoading: true),
          ),
        ),
      );

      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNull);
    });
  });
}
```

### E2E — Kritik Akışlar (Patrol)

Aşağıdaki 5 akış her release öncesi `patrol` ile çalıştırılır:

| # | Akış | Adımlar |
|---|---|---|
| E2E-01 | Kayıt & Giriş | E-posta gir → OTP al → OTP gir → Ana haritayı gör |
| E2E-02 | Flare Oluşturma | Haritadan konum seç → Form doldur → Kaydet → Haritada pini gör |
| E2E-03 | Acil Yardım | Yardım butonu → Sorun tipi seç → Gönder → Bekleme ekranı |
| E2E-04 | DM Mesajlaşma | Profil aç → Mesaj gönder → Realtime yanıt gör |
| E2E-05 | Hayalet Mod | Toggle aç → Haritadan kaybolur → Toggle kapat → Haritada görünür |

```dart
// integration_test/e2e/auth_flow_test.dart
import 'package:patrol/patrol.dart';

void main() {
  patrolTest('E2E-01: Kayıt & Giriş akışı', ($) async {
    await $.pumpWidgetAndSettle(const App());

    await $(#emailField).enterText('test@pitlane.app');
    await $(#sendOtpButton).tap();
    await $.pumpAndSettle();

    await $(#otpField).enterText('123456'); // Test OTP
    await $(#verifyButton).tap();
    await $.pumpAndSettle();

    expect($(#mapScreen), findsOneWidget);
  });
}
```

### Flutter Test Konfigürasyonu

```yaml
# pubspec.yaml — test section
dev_dependencies:
  patrol: ^3.0.0
  mocktail: ^1.0.0
  flutter_test:
    sdk: flutter

# patrol.yaml
app_id: app.pitlane.mobile
```

---

## 3. Backend (Node/TS) Test Standartları

### Unit Test — Service Katmanı

```typescript
// test/unit/services/r2.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateUploadUrl } from '../../src/services/r2.js';

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://r2.example.com/presigned'),
}));

describe('generateUploadUrl', () => {
  it('geçerli parametrelerle presigned URL döndürür', async () => {
    const result = await generateUploadUrl({
      userId:      'user-123',
      assetType:   'photo',
      contentType: 'image/jpeg',
      extension:   'jpg',
    });

    expect(result.uploadUrl).toContain('https://r2.example.com');
    expect(result.storageKey).toContain('photos/user-123');
    expect(result.assetId).toBeDefined();
  });
});
```

### Entegrasyon Test — API Endpoint

```typescript
// test/integration/flares.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/app.js';

describe('POST /v1/flares', () => {
  const app = createApp();
  let authToken: string;

  beforeAll(async () => {
    // Test kullanıcısı token'ı (Supabase local'den)
    authToken = process.env.TEST_USER_JWT!;
  });

  it('geçerli veriyle flare oluşturur', async () => {
    const res = await app.request('/v1/flares', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title:     'Test Cruise',
        h3_cell:   '89283082803ffff',
        starts_at: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.title).toBe('Test Cruise');
  });

  it('JWT olmadan 401 döner', async () => {
    const res = await app.request('/v1/flares', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('geçersiz h3_cell ile 422 döner', async () => {
    const res = await app.request('/v1/flares', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title:     'Test',
        h3_cell:   'GECERSIZ',
        starts_at: new Date().toISOString(),
      }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});
```

### Vitest Konfigürasyonu

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
      thresholds: {
        lines:     75,
        functions: 75,
        branches:  70,
      },
    },
    setupFiles: ['./test/setup.ts'],
  },
});
```

```typescript
// test/setup.ts
import { config } from 'dotenv';
config({ path: '.env.test' });
```

---

## 4. Go Realtime Servis Test Standartları

### Unit Test — Location Store

```go
// internal/location/store_test.go
package location_test

import (
    "context"
    "testing"

    "github.com/alicebob/miniredis/v2"
    "github.com/redis/go-redis/v9"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"

    "github.com/pitlane/realtime/internal/location"
)

func newTestStore(t *testing.T) (*location.Store, *miniredis.Miniredis) {
    t.Helper()
    mr, err := miniredis.Run()
    require.NoError(t, err)
    rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
    return location.NewStore(rdb), mr
}

func TestSetAndGetUserCell(t *testing.T) {
    store, _ := newTestStore(t)
    ctx := context.Background()

    err := store.SetUserCell(ctx, "user-123", "89283082803ffff")
    assert.NoError(t, err)

    cell, err := store.GetUserCell(ctx, "user-123")
    assert.NoError(t, err)
    assert.Equal(t, "89283082803ffff", cell)
}

func TestDeleteUserCell(t *testing.T) {
    store, _ := newTestStore(t)
    ctx := context.Background()

    _ = store.SetUserCell(ctx, "user-123", "89283082803ffff")
    err := store.DeleteUserCell(ctx, "user-123")
    assert.NoError(t, err)

    _, err = store.GetUserCell(ctx, "user-123")
    assert.Error(t, err) // redis: nil
}

func TestLocationTTL(t *testing.T) {
    store, mr := newTestStore(t)
    ctx := context.Background()

    _ = store.SetUserCell(ctx, "user-ttl", "89283082803ffff")
    mr.FastForward(6 * time.Minute) // TTL = 5 dakika

    _, err := store.GetUserCell(ctx, "user-ttl")
    assert.Error(t, err) // TTL doldu
}
```

### Unit Test — JWT Doğrulama

```go
// internal/auth/jwt_test.go
package auth_test

import (
    "testing"
    "time"

    "github.com/golang-jwt/jwt/v5"
    "github.com/stretchr/testify/assert"

    "github.com/pitlane/realtime/internal/auth"
)

const testSecret = "test-secret-32-chars-minimum-len"

func makeTestToken(sub string, secret string, exp time.Time) string {
    claims := jwt.MapClaims{"sub": sub, "exp": exp.Unix(), "role": "authenticated"}
    token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
    return token
}

func TestVerifySupabaseJWT_Valid(t *testing.T) {
    token := makeTestToken("user-123", testSecret, time.Now().Add(time.Hour))
    userID, err := auth.VerifySupabaseJWT(token, testSecret)

    assert.NoError(t, err)
    assert.Equal(t, "user-123", userID)
}

func TestVerifySupabaseJWT_Expired(t *testing.T) {
    token := makeTestToken("user-123", testSecret, time.Now().Add(-time.Hour))
    _, err := auth.VerifySupabaseJWT(token, testSecret)

    assert.Error(t, err)
}

func TestVerifySupabaseJWT_WrongSecret(t *testing.T) {
    token := makeTestToken("user-123", "wrong-secret", time.Now().Add(time.Hour))
    _, err := auth.VerifySupabaseJWT(token, testSecret)

    assert.Error(t, err)
}
```

### Go Test Komutu

```bash
# Tüm testler
go test ./... -race -coverprofile=coverage.out

# Coverage raporu
go tool cover -html=coverage.out -o coverage.html

# Yük testi (k6)
k6 run --vus 1000 --duration 30s scripts/load-test.js
```

---

## 5. CI/CD Pipeline (GitHub Actions)

### Ana Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # ─────────────────────────────────────────
  backend-test:
    name: Backend — Lint + Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/backend

    services:
      supabase:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }

      - run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm exec eslint src --max-warnings 0

      - name: Type Check
        run: pnpm exec tsc --noEmit

      - name: Test
        run: pnpm exec vitest run --coverage
        env:
          SUPABASE_URL:              http://localhost:54321
          SUPABASE_ANON_KEY:         ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}
          R2_ENDPOINT:               ${{ secrets.TEST_R2_ENDPOINT }}
          R2_ACCESS_KEY_ID:          ${{ secrets.TEST_R2_KEY }}
          R2_SECRET_ACCESS_KEY:      ${{ secrets.TEST_R2_SECRET }}
          R2_BUCKET:                 pitlane-test
          TEST_USER_JWT:             ${{ secrets.TEST_USER_JWT }}

      - name: Coverage Yükleme
        uses: codecov/codecov-action@v4
        with: { files: ./coverage/lcov.info }

  # ─────────────────────────────────────────
  go-test:
    name: Go — Lint + Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/realtime

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.22' }

      - name: golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          working-directory: apps/realtime

      - name: Test
        run: go test ./... -race -coverprofile=coverage.out

      - name: Coverage
        run: go tool cover -func=coverage.out

  # ─────────────────────────────────────────
  flutter-test:
    name: Flutter — Analyze + Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/mobile

    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.0'
          cache: true

      - run: flutter pub get
      - run: dart run build_runner build --delete-conflicting-outputs

      - name: Analyze
        run: flutter analyze --no-fatal-infos

      - name: Unit + Widget Tests
        run: flutter test --coverage

      - name: Coverage
        uses: codecov/codecov-action@v4
        with: { files: ./coverage/lcov.info }

  # ─────────────────────────────────────────
  security-scan:
    name: Güvenlik Taraması
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Gizli değer taraması
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: npm audit (backend)
        working-directory: apps/backend
        run: pnpm audit --audit-level=high

      - name: Go vulnerability check
        working-directory: apps/realtime
        run: |
          go install golang.org/x/vuln/cmd/govulncheck@latest
          govulncheck ./...
```

### Deploy Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    name: Backend → Fly.io
    runs-on: ubuntu-latest
    needs: [backend-test]
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --app pitlane-api --remote-only
        working-directory: apps/backend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-realtime:
    name: Go → Fly.io
    runs-on: ubuntu-latest
    needs: [go-test]
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --app pitlane-realtime --remote-only
        working-directory: apps/realtime
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-admin:
    name: Admin → Vercel
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token:   ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id:  ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/admin
          vercel-args: '--prod'
```

---

## 6. Pre-commit (Lefthook)

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    backend-lint:
      glob: "apps/backend/src/**/*.{ts,tsx}"
      run: cd apps/backend && pnpm exec eslint {staged_files} --fix

    backend-type:
      glob: "apps/backend/src/**/*.ts"
      run: cd apps/backend && pnpm exec tsc --noEmit

    go-fmt:
      glob: "apps/realtime/**/*.go"
      run: gofmt -l -w {staged_files}

    go-vet:
      glob: "apps/realtime/**/*.go"
      run: cd apps/realtime && go vet ./...

    flutter-analyze:
      glob: "apps/mobile/lib/**/*.dart"
      run: cd apps/mobile && flutter analyze {staged_files}

    secret-check:
      run: gitleaks detect --source . --no-git

pre-push:
  commands:
    backend-test:
      run: cd apps/backend && pnpm exec vitest run
    go-test:
      run: cd apps/realtime && go test ./... -race
    flutter-test:
      run: cd apps/mobile && flutter test
```

---

## 7. Lint Konfigürasyonları

### ESLint (Backend / TypeScript)

```json
// apps/backend/.eslintrc.json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked"
  ],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "no-console": ["warn", { "allow": ["error"] }]
  }
}
```

### golangci-lint (Go)

```yaml
# apps/realtime/.golangci.yml
linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - unused
    - gofmt
    - goimports
    - revive
    - gosec
    - exhaustive

linters-settings:
  revive:
    rules:
      - name: exported
        severity: warning

run:
  timeout: 5m
```

### Flutter Analyze

```yaml
# apps/mobile/analysis_options.yaml — (08_TRACK2_FLUTTER.md'den)
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    avoid_print: true
    prefer_const_constructors: true
    prefer_const_declarations: true
    avoid_unnecessary_containers: true
    use_key_in_widget_constructors: true
    always_use_package_imports: true
    prefer_relative_imports: false

analyzer:
  errors:
    missing_required_param: error
    missing_return: error
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
```

---

## 8. Performans Bütçesi & İzleme

### Flutter Performans Metrikleri

| Metrik | Hedef | Ölçüm Aracı |
|---|---|---|
| İlk harita frame | < 1.2 sn | Flutter DevTools |
| Harita polygon render (200 hücre) | < 16 ms | Flutter DevTools |
| App cold start | < 2.5 sn | Firebase Performance |
| Bellek (normal kullanım) | < 180 MB | Flutter DevTools |
| Medya yükleme (5 MB foto) | < 4 sn | Custom Stopwatch |
| Frame drop oranı | < %1 (60 fps) | Flutter DevTools |

### Backend Performans Metrikleri

| Metrik | Hedef | Ölçüm Aracı |
|---|---|---|
| API P50 yanıt süresi | < 80 ms | Fly.io metrics |
| API P95 yanıt süresi | < 300 ms | Fly.io metrics |
| API P99 yanıt süresi | < 800 ms | Fly.io metrics |
| Heatmap endpoint | < 150 ms | Vitest + benchmark |

### Go Realtime Performans Metrikleri

| Metrik | Hedef | Ölçüm Aracı |
|---|---|---|
| WS mesaj işleme | < 5 ms | zerolog + Prometheus |
| 10k eşzamanlı bağlantı RAM | < 1 GB | k6 load test |
| Heatmap yayın gecikmesi | < 200 ms | k6 |

### k6 Yük Testi

```javascript
// scripts/load-test.js
import ws from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 1000  },  // Ramping up
    { duration: '5m', target: 5000  },  // Peak load
    { duration: '2m', target: 10000 },  // Stress
    { duration: '2m', target: 0     },  // Cooldown
  ],
  thresholds: {
    ws_session_duration: ['p(95)<5000'],
    ws_msgs_received:    ['count>100'],
  },
};

export default function () {
  const token = __ENV.TEST_JWT;
  const url   = `wss://realtime.pitlane.app/ws/location?token=${token}`;

  ws.connect(url, {}, (socket) => {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        type:    'location',
        h3_cell: '89283082803ffff',
      }));
    });

    socket.on('message', (data) => {
      check(data, { 'mesaj alındı': (d) => d.length > 0 });
    });

    socket.setTimeout(() => socket.close(), 10000);
  });

  sleep(1);
}
```

---

## 9. Kapsam (Coverage) Eşikleri

| Track | Satır | Fonksiyon | Dal |
|---|---|---|---|
| Backend (TS) | %75 | %75 | %70 |
| Go Realtime | %70 | %70 | %65 |
| Flutter Unit | %70 | %70 | %65 |

> Eşiğin altında kalan PR CI'da **otomatik reddedilir**.
> Yeni özellik = yeni test. Test yoksa PR merge edilmez.

---

## 10. Hata İzleme (Sentry)

### Flutter — Sentry Kurulumu

```dart
// lib/main.dart
import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> main() async {
  await SentryFlutter.init(
    (options) {
      options.dsn = const String.fromEnvironment('SENTRY_DSN');
      options.environment = const String.fromEnvironment('APP_ENV');
      options.tracesSampleRate = 0.2; // %20 performans izleme
      options.profilesSampleRate = 0.1;
    },
    appRunner: () => runApp(const ProviderScope(child: App())),
  );
}
```

### Backend — Sentry Kurulumu

```typescript
// src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn:              process.env.SENTRY_DSN,
  environment:      process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    Sentry.httpIntegration(),
    Sentry.postgresIntegration(),
  ],
});
```

### Sentry Kuralları

- Her yeni `unhandled exception` → aynı sprint içinde triaj ve çözüm.
- `crash-free users` hedefi: **%99.5** (App Store için şart).
- Haftalık Sentry raporu sprint retrospektif toplantısında gözden geçirilir.

---

## 11. PR Kontrol Listesi (Checklist)

Her PR açılmadan önce geliştirici şunları doğrular:

```markdown
## PR Kontrol Listesi

### Genel
- [ ] Commit mesajları Conventional Commits formatında (`feat:`, `fix:`, `docs:`, `refactor:`)
- [ ] Magic number yok; sabitler `constants/` altında
- [ ] `any` tipi kullanılmamış (TypeScript)
- [ ] `print` / `console.log` üretim kodunda yok

### Test
- [ ] Yeni iş mantığı için unit test yazıldı
- [ ] Yeni endpoint için entegrasyon testi yazıldı
- [ ] `flutter test` / `vitest run` / `go test ./...` yeşil
- [ ] Coverage eşiği sağlandı

### Güvenlik
- [ ] JWT doğrulama middleware eklenmiş
- [ ] Zod şeması tüm input'ları kapsıyor
- [ ] Ham GPS koordinatı hiçbir yerde persist edilmiyor
- [ ] `SUPABASE_SERVICE_ROLE_KEY` istemciye gönderilmiyor

### Performans
- [ ] N+1 query yok (Supabase select optimize edilmiş)
- [ ] Medya backend üzerinden proxy edilmiyor
- [ ] Büyük liste için pagination eklendi

### Dokümantasyon
- [ ] API kontratı değiştiyse `05_API_KONTRATI.md` güncellendi
- [ ] Mimari kural değiştiyse `03_MIMARI_KURALLAR.md` güncellendi
```

---

## 12. Tanım: "Bitti" (Definition of Done) — Detay

`07_SPRINT_YOL_HARITASI.md`'deki 5 maddeye ek olarak:

| Kriter | Detay |
|---|---|
| **Lint pass** | ESLint / golangci-lint / flutter analyze — 0 hata, 0 uyarı |
| **Test yeşil** | Tüm unit + entegrasyon testleri geçiyor |
| **Coverage** | İlgili track'in eşiği karşılanıyor |
| **CI yeşil** | GitHub Actions tüm job'lar başarılı |
| **Sentry temiz** | Yeni unhandled error yok |
| **PR review** | En az 1 reviewer onayı |
| **Performans** | Belirlenen bütçe aşılmıyor |
| **Dokümantasyon** | İlgili `.md` dosyaları güncellendi |
