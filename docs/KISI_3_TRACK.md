# 👤 KİŞİ 3 — Track Paketi
> Full-stack · Mid/Senior · Rollpit Projesi

## Senin Sorumluluk Alanın

**Admin Panel (Next.js 14 — App Router) + Supabase Migration Desteği**

Moderasyon, analitik ve işletme doğrulama arayüzü senin elinde. Kişi 2'nin yazdığı backend ve Supabase şemasını okuyarak çalışırsın; direkt DB erişimin var ama service role key'i dikkatli kullanırsın.

---

## Önce Oku (Sırayla)

| Sıra | Dosya | Neden |
|---|---|---|
| 1 | `00_README.md` | Projeye genel bakış, çalışma yöntemi |
| 2 | `01_PROJE_GENEL_BAKIS.md` | Vizyon, kullanıcı, MVP kapsamı |
| 3 | `02_TEKNOLOJI_YIGINI.md` | Next.js 14, shadcn/ui, Tanstack Query, Recharts |
| 4 | `03_MIMARI_KURALLAR.md` | **Kural 4 (JWT+Zod+RLS) senin için kritik — özellikle service role kullanım sınırı** |
| 5 | `04_VERITABANI_SEMA.md` | Tüm tablolar; sen de bu şemayı doğrudan okursun |
| 6 | `06_GUVENLIK_MAHREMIYET.md` | RLS detayı, service role kısıtlamaları, secret yönetimi |
| 7 | `12_ADMIN_PANEL.md` | **Senin yazdığın ekranların detayı — önce buradan başla** |
| 8 | `05_API_KONTRATI.md` | Bazı endpoint'leri admin panelden çağırırsın |
| 9 | `13_TEST_KALITE.md` | Admin için test standartları |
| 10 | `14_DAGITIM_YAYIN.md` | Vercel deploy süreci |
| 11 | `18_TOPLULUK_KURALLARI.md` | **Moderatör runbook'u — `/reports` sayfasını yöneten süreç** |
| 12 | `16_URUN_GEREKSINIMLERI.md` | İşletme onboarding (F6), hesap silme (F10.2), kabul kriterleri |
| 13 | `15_TASARIM_SISTEMI.md` | Renk + tipografi jetonları → Tailwind config'i hizala |
| 14 | `26_LOKALIZASYON_ERISILEBILIRLIK.md` | WCAG AA, klavye navigasyonu, kontrast oranları (admin için zorunlu) |
| 15 | `22_OBSERVABILITY_RUNBOOK.md` | Admin panel Sentry kuralları, audit_logs okuma |
| 16 | `24_MUSTERI_DESTEK.md` | Destek kanalları + admin paneline yansıyan akışlar |
| — | `19_KULLANICI_AKISLARI.md` | UF-08 (işletme onboarding), UF-09 (şikayet/engelleme) admin tarafı |
| — | `25_GELIR_MODELI.md` | Faz 2 abonelik dashboard (V1.0'da bilgi amaçlı) |
| — | `23_INCIDENT_RUNBOOK.md` | Status sayfası güncellemeleri, on-call rotation |

---

## Senin Sorumluluk Alanın — Detay

### Ne Yapıyorsun?

Admin paneli, uygulamanın "arka kapısı"dır. Şunları yaparsın:

1. **İşletme Pin Doğrulama:** İşletme başvurularını inceler, onay/red verirsin.
2. **Kullanıcı Yönetimi:** Kullanıcıları arayabilir, ban koyabilir, profil notları ekleyebilirsin.
3. **Topluluk Yönetimi:** Toplulukları listeleyebilir, gerektiğinde kaldırabilirsin.
4. **Şikayet (Report) Yönetimi:** Kullanıcıların şikayet ettiği içerikleri inceler, aksiyon alırsın.
5. **Analitik Dashboard:** MAU, flare, yardım talebi metriklerini görürsün.
6. **Sistem Ayarları:** Feature flag'leri (Supabase remote config) açıp kapatırsın.

### Ne Yapmıyorsun?

- API endpoint'leri yazmıyorsun (bu Kişi 2'nin sorumluluğu).
- Flutter kodu yazmıyorsun.
- Supabase migration'larını tek başına karar verip uygulamıyorsun; migration Kişi 2 ile koordineli yapılır.

---

## Sprint Görevlerin

### Faz 0 — Hazırlık (1 Hafta)
- [ ] Admin monorepo kurulumu (`apps/admin/`)
- [ ] `pnpm install` + Next.js 14 boş proje ayağa kaldır
- [ ] Vercel projesi oluştur (`rollpit-admin`)
- [ ] Supabase bağlantısı (admin service role ile — sadece bu panelde kullanılır)
- [ ] shadcn/ui kurulumu (`npx shadcn-ui@latest init`)
- [ ] **Tailwind tokens'ı `15_TASARIM_SISTEMI.md` ile hizala** (renk, spacing, radius)
- [ ] Sentry admin projesi oluştur (PII filter — 17. doküman Bölüm 7)
- [ ] Temel middleware (auth kontrol + rol kontrol) yaz
- [ ] Klavye odak halkaları (focus-ring utility, 26. doküman Bölüm 10)

### Sprint 1 — Auth & Temel İskelet (Hafta 1-2)
- [ ] Login sayfası (`/login`) — Supabase e-posta + şifre (admin hesabı, OTP değil)
- [ ] `middleware.ts` — oturum yoksa `/login`'e yönlendir, `role !== 'admin'` ise erişimi engelle
- [ ] Ana layout: Sidebar + Header bileşenleri
- [ ] Dashboard sayfası — 4 temel sayaç kartı (kullanıcı, flare, yardım, bekleyen pin)
- [ ] Temel navigasyon rotaları

> **Bağımlılık:** Kişi 2'nin `profiles` migration'ı Sprint 1'de tamamlanmalı. Ondan önce mock data ile çalış.

### Sprint 2 — Kullanıcı & Topluluk Yönetimi (Hafta 3-4)
- [ ] Kullanıcı listesi sayfası (`/users`) — arama, filtre (rol, tarih)
- [ ] Kullanıcı detay sayfası (`/users/[id]`) — araçlar, topluluklar, şikayet geçmişi
- [ ] Kullanıcı ban/unban aksiyonu (DB'de `profiles.role` güncelleme + Supabase Auth ban)
- [ ] Topluluk listesi sayfası (`/communities`)
- [ ] Topluluk detay sayfası (`/communities/[id]`) — üyeler, flare'ler
- [ ] Topluluk silme aksiyonu

### Sprint 3 — Pin Doğrulama & Şikayetler (Hafta 5-6)

> **Not:** Bu sprint Kişi 2'nin Sprint 3'üne bağlı — `business_pins` ve `communities` tabloları hazır olmalı.
> `reports` tablosu için 04_VERITABANI_SEMA.md Bölüm 13 referans alınır (Kişi 2 yazar).

- [ ] İşletme pin listesi sayfası (`/pins`) — doğrulanmamış pinler önce sıralanır
- [ ] Pin detay + doğrulama sayfası (`/pins/[id]/verify`) — vergi belgesi görüntüleme
- [ ] **Pin verify aksiyonları → `audit_logs`'a yazılır** (`pin_verified` / `pin_rejected`)
- [ ] Pin reddi durumunda standart e-posta şablonu (24. doküman T6)
- [ ] Şikayet listesi sayfası (`/reports`) — pending şikayetler
- [ ] Şikayet detay — içeriği görüntüle (mesaj, flare, vs.)
- [ ] **Moderasyon aksiyonları (18. doküman Bölüm 4)**:
  - [ ] İçerik silme server action → `audit_logs`'a `content_deleted`
  - [ ] Kullanıcı uyarma → `notifications.type='system'`
  - [ ] Geçici suspend (7 gün) — Supabase auth `ban_duration: '7d'`
  - [ ] Kalıcı ban + push token temizliği + WS bağlantı kapatma
- [ ] Severity matrix UI (18. doküman Bölüm 3 referans)

### Sprint 4 — Analitik & Bildirimler (Hafta 7-8)

> **Bağımlılık:** Kişi 2'nin `notifications` endpoint'leri bu sprint hazır olmalı.

- [ ] Analitik sayfası (`/analytics`) — `22_OBSERVABILITY_RUNBOOK.md` D2 dashboard referansı
  - MAU/DAU grafiği (Recharts `LineChart`)
  - Günlük flare oluşturma grafiği
  - Yardım talebi yanıt süresi grafiği (D3 dashboard)
  - Topluluk büyüme grafiği
  - Bekleme listesi büyümesi (`waiting_list` tablosu)
- [ ] Metrikleri Supabase'den aggregate sorgu ile çek (server component)
- [ ] Bildirim yönetim sayfası — sistem bildirimi gönder (tüm kullanıcılara — 20. doküman `system` kategorisi)
- [ ] **Audit log görüntüleme sayfası (`/audit`)** — moderatör/admin aksiyon geçmişi (filtreli)

### Sprint 5 — Sistem Ayarları & Feature Flag (Hafta 9-10)

> **Bağımlılık:** Kişi 2'nin Sprint 5 sonunda `help_requests` ve `business_pins` endpoint'leri hazır.
> `remote_configs` tablosu artık `04_VERITABANI_SEMA.md` Bölüm 14'te merkezi tanımlı.

- [ ] Ayarlar sayfası (`/settings`) — feature flag toggle'ları + min app version yönetimi
- [ ] Topluluk kuralları metni yönetimi (18. doküman v1.0 metni — versiyonlanır)
- [ ] Yardım talebi izleme sayfası — açık yardım taleplerini haritasız, liste olarak göster
- [ ] Kullanıcı veri dışa aktarma isteklerini takip et (GDPR — `/profiles/me/export` job takibi)
- [ ] **Davet kodu yönetimi sayfası (`/invites`)** — toplu kod oluştur, kullanım istatistiği (21. doküman Bölüm 3)
- [ ] **Bekleme listesi sayfası (`/waiting-list`)** — wave invite (haftalık 100-500 davet)
- [ ] Status sayfası entegrasyonu (23. doküman Bölüm 5) — manuel "investigating/resolved" güncelleme

### Sprint 6 — Cilalama & Deploy (Hafta 11-12)

> **Bağımlılık:** Kişi 2'nin tüm endpoint'leri hazır olmalı.

- [ ] Tüm tabloların admin panel üzerinden doğru göründüğünü uçtan uca test et
- [ ] Recharts grafiklerini gerçek verilerle test et
- [ ] Moderatör yetki seviyesini ekle (şikayet + içerik silme — admin paneli Faz 2 için hazırla)
- [ ] **Erişilebilirlik audit (26. doküman)**: kontrast, klavye nav, ARIA etiketleri, focus halkası
- [ ] Destek ekibi için "kullanıcı arama" sayfası (e-posta/username/telefon ile)
- [ ] **Kullanıcı detay sayfasında "destek notu" alanı** (CM tarafından eklenir, audit_logs'a yazılır)
- [ ] Vercel production deploy
- [ ] Sentry entegrasyonu (admin panel için, PII filter)
- [ ] PR kontrol listesi tamamlandı, tüm sayfalar review'dan geçti

---

## Teknik Kılavuz

### Supabase Bağlantısı (Admin — 2 Farklı İstemci)

Admin panelinde **hem browser hem server** istemcisi kullanırsın. Kural: service role key **asla browser'a gitmez**, yalnızca server component'larda ve server action'larda kullanılır.

```typescript
// apps/admin/lib/supabase/server.ts
// Server component ve server action'larda kullan
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
}

// Sadece service role gerektiren admin aksiyonları için (ban, zorla silme vb.)
export function createAdminSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,   // ❌ browser'a gitmiyor
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

```typescript
// apps/admin/lib/supabase/client.ts
// Browser'da (Client Component) kullan — anon key, RLS aktif
'use client';
import { createBrowserClient } from '@supabase/ssr';

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

---

### Middleware — Auth + Rol Kontrolü

```typescript
// apps/admin/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value; },
        set(name, value, options) { response.cookies.set({ name, value, ...options }); },
        remove(name, options) { response.cookies.set({ name, value: '', ...options }); },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Oturum yok → login'e yönlendir
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Login sayfasındayken oturum varsa dashboard'a yönlendir
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rol kontrolü — sadece admin geçebilir
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

### Kullanıcı Ban Aksiyonu (Server Action)

```typescript
// apps/admin/app/(dashboard)/users/[id]/actions.ts
'use server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function banUser(userId: string) {
  const sb = createAdminSupabaseClient(); // service role — sadece burada

  // 1. Supabase Auth'da engelle (yeni token üretemez)
  await sb.auth.admin.updateUserById(userId, { ban_duration: 'none' }); // 'none' = kalıcı ban

  // 2. profiles tablosunda rolü güncelle
  await sb.from('profiles').update({ role: 'banned' as const }).eq('id', userId);

  revalidatePath(`/users/${userId}`);
  revalidatePath('/users');
}

export async function unbanUser(userId: string) {
  const sb = createAdminSupabaseClient();

  await sb.auth.admin.updateUserById(userId, { ban_duration: '0' }); // ban kaldır
  await sb.from('profiles').update({ role: 'user' as const }).eq('id', userId);

  revalidatePath(`/users/${userId}`);
  revalidatePath('/users');
}
```

---

### Feature Flag Tablosu (Supabase Migration)

Sprint 5'te bu migration'ı Kişi 2 ile koordineli olarak yazarsın:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_remote_configs.sql
CREATE TABLE public.remote_configs (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.remote_configs ENABLE ROW LEVEL SECURITY;

-- Sadece admin okuyabilir (Flutter anon key ile okuyamaz)
CREATE POLICY "remote_configs_admin_only"
  ON public.remote_configs
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Başlangıç değerleri
INSERT INTO public.remote_configs (key, value, description) VALUES
  ('feature_camera_enabled',   'true',  'Kamera özelliği aktif mi?'),
  ('feature_help_enabled',     'true',  'Acil yardım özelliği aktif mi?'),
  ('feature_business_pins',    'true',  'İşletme pinleri görünür mü?'),
  ('max_flares_per_user_day',  '5',     'Kullanıcı başına günlük max flare');
```

---

### Reports Tablosu (Supabase Migration)

Sprint 3'te Kişi 2 ile koordineli olarak yazarsın:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_reports.sql
CREATE TABLE public.reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type  TEXT NOT NULL CHECK (content_type IN ('message','flare','community','profile','business_pin')),
  content_id    UUID NOT NULL,
  reason        TEXT NOT NULL CHECK (reason IN ('spam','harassment','inappropriate','fake','other')),
  description   TEXT CHECK (char_length(description) <= 500),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  reviewed_by   UUID REFERENCES public.profiles(id),
  reviewed_at   TIMESTAMPTZ,
  action_taken  TEXT CHECK (action_taken IN ('none','content_deleted','user_warned','user_banned')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON public.reports(status) WHERE status = 'pending';
CREATE INDEX idx_reports_reporter ON public.reports(reporter_id);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi şikayetini görebilir
CREATE POLICY "reports_select_own"
  ON public.reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Kullanıcı şikayet oluşturabilir
CREATE POLICY "reports_insert"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admin her şeyi görebilir ve güncelleyebilir (service role üzerinden)
```

---

### Analitik Veri Çekme (Server Component)

```typescript
// apps/admin/app/(dashboard)/analytics/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MauChart } from '@/components/charts/mau-chart';
import { ActivityChart } from '@/components/charts/activity-chart';

export default async function AnalyticsPage() {
  const sb = createServerSupabaseClient();

  // Son 30 günün günlük kayıt sayısı
  const { data: registrations } = await sb.rpc('daily_registrations_last_30_days');

  // Aktif flare sayısı (son 7 gün, günlük)
  const { data: flareActivity } = await sb.rpc('daily_flares_last_7_days');

  // Yardım talebi ortalama yanıt süresi
  const { data: helpStats } = await sb
    .from('help_requests')
    .select('created_at, resolved_at')
    .eq('status', 'resolved')
    .not('resolved_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100);

  const avgResponseMinutes = helpStats
    ? Math.round(
        helpStats.reduce((sum, r) => {
          const diff = new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime();
          return sum + diff / 60_000;
        }, 0) / (helpStats.length || 1)
      )
    : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analitik</h1>

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Ort. Yardım Yanıt Süresi" value={`${avgResponseMinutes} dk`} />
        {/* Diğer kartlar */}
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-2 gap-6">
        <MauChart data={registrations ?? []} />
        <ActivityChart data={flareActivity ?? []} />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-card rounded-xl p-4 border">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}
```

---

### Şikayet Yönetimi Sayfası

```typescript
// apps/admin/app/(dashboard)/reports/page.tsx
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { ReportsTable } from '@/components/data-tables/reports-table';

export default async function ReportsPage() {
  // Şikayetler için service role kullanıyoruz (reporter bilgisi join yapılıyor)
  const sb = createAdminSupabaseClient();

  const { data: reports } = await sb
    .from('reports')
    .select(`
      *,
      profiles!reporter_id (username, avatar_url),
      reviewed_profile:profiles!reviewed_by (username)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Şikayetler</h1>
        <span className="text-sm text-muted-foreground">
          {reports?.length ?? 0} bekleyen şikayet
        </span>
      </div>
      <ReportsTable data={reports ?? []} />
    </div>
  );
}
```

---

## Senin Sahip Olduğun Secret'lar

```bash
# apps/admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # Sadece server-side, asla browser'a gitmiyor

# Vercel
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...

# Sentry
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...

NODE_ENV=development
```

**Önemli:** `SUPABASE_SERVICE_ROLE_KEY` `NEXT_PUBLIC_` prefix'i **almaz**. Almaz çünkü prefix olursa browser bundle'a girer. Bu key sadece `createAdminSupabaseClient()` içinde ve server-side kod dosyalarında kullanılır.

---

## Diğer Track'lerle Bağımlılıkların

| Bağımlılık | Kimden | Ne Zaman |
|---|---|---|
| `profiles` tablosu (migration) | Kişi 2 | Sprint 1 |
| `communities`, `flares` tabloları | Kişi 2 | Sprint 2 |
| `business_pins` tablosu | Kişi 2 | Sprint 3 |
| `messages`, `notifications` tabloları | Kişi 2 | Sprint 4 |
| `help_requests` tablosu | Kişi 2 | Sprint 5 |
| `remote_configs` tablosu (birlikte yazılır) | Kişi 2 ile | Sprint 5 |
| `reports` tablosu (birlikte yazılır) | Kişi 2 ile | Sprint 3 |

> **Bağımlılık gelmeden önce Supabase local'deki `04_VERITABANI_SEMA.md`'den tabloları kendin manuel oluşturabilirsin.** Kişi 2'yi bekleme.

---

## Günlük Çalışma Akışı

```bash
# Admin paneli başlat
cd apps/admin && pnpm dev   # :3001 (backend :3000 ile çakışmasın)

# Supabase local (Kişi 2 başlatmışsa paylaşımlı kullanılır)
supabase start              # postgresql://postgres:postgres@localhost:54322/postgres

# Type check
pnpm exec tsc --noEmit

# Lint
pnpm exec eslint app/ components/ lib/

# Build test (Vercel'de hata çıkmasın)
pnpm build
```

---

## Kritik Hatırlatmalar (Mimariden)

```
❌ ASLA: SUPABASE_SERVICE_ROLE_KEY'i NEXT_PUBLIC_ prefix'i ile tanımla
✅ DOĞRU: Server-only; sadece server component, server action ve middleware'de kullan

❌ ASLA: RLS bypass gerektiren sorguyu browser (Client Component) içinde çalıştır
✅ DOĞRU: Bunları server component veya server action içine taşı

❌ ASLA: Admin aksiyonları için client-side fetch (güvenlik riski)
✅ DOĞRU: Server Action kullan, revalidatePath ile cache'i temizle

❌ ASLA: TypeScript'te any tipi
✅ DOĞRU: Supabase'in generate ettiği tipler veya explicit interface tanımları

❌ ASLA: Şikayet veya ban aksiyonunu RLS politikasına güvenerek browser'dan yap
✅ DOĞRU: createAdminSupabaseClient() ile server action içinde yap, logla
```

---

## Ekran Listesi (Tamamlanması Gereken)

| Ekran | Route | Sprint | Öncelik |
|---|---|---|---|
| Login | `/login` | S1 | 🔴 Zorunlu |
| Dashboard | `/` | S1 | 🔴 Zorunlu |
| Kullanıcı Listesi | `/users` | S2 | 🔴 Zorunlu |
| Kullanıcı Detay (+ destek notu) | `/users/[id]` | S2 + S6 | 🔴 Zorunlu |
| Topluluk Listesi | `/communities` | S2 | 🟡 Önemli |
| Topluluk Detay | `/communities/[id]` | S2 | 🟡 Önemli |
| Pin Listesi | `/pins` | S3 | 🔴 Zorunlu |
| Pin Doğrulama | `/pins/[id]/verify` | S3 | 🔴 Zorunlu |
| Şikayet Listesi | `/reports` | S3 | 🔴 Zorunlu |
| Şikayet Detay (aksiyon) | `/reports/[id]` | S3 | 🔴 Zorunlu |
| Analitik | `/analytics` | S4 | 🟡 Önemli |
| Audit Log | `/audit` | S4 | 🟡 Önemli |
| Bildirim Gönder (sistem) | `/notifications/send` | S4 | 🟢 Ekstra |
| Yardım Takip | `/help` | S5 | 🟡 Önemli |
| Ayarlar / Feature Flag | `/settings` | S5 | 🟡 Önemli |
| Davet Kodu Yönetimi | `/invites` | S5 | 🟡 Önemli |
| Bekleme Listesi (wave invite) | `/waiting-list` | S5 | 🟡 Önemli |
| Topluluk Kuralları Yönetimi | `/settings/community-rules` | S5 | 🟢 Ekstra |
| Status Sayfası Yönetimi | `/settings/status` | S5 | 🟢 Ekstra |
