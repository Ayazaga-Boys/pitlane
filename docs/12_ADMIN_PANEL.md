# 12 — Admin Panel (Next.js 14)

---

## Klasör Yapısı

```
apps/admin/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Dashboard
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + header
│   │   ├── users/
│   │   │   ├── page.tsx            # Kullanıcı listesi
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Kullanıcı detay
│   │   ├── communities/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── pins/
│   │   │   ├── page.tsx            # İşletme pin listesi
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── verify/page.tsx # Doğrulama akışı
│   │   ├── reports/
│   │   │   └── page.tsx            # Şikayet listesi
│   │   ├── analytics/
│   │   │   └── page.tsx            # MAU, flare, yardım metrikleri
│   │   └── settings/
│   │       └── page.tsx
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── data-tables/
│   │   ├── users-table.tsx
│   │   ├── pins-table.tsx
│   │   └── reports-table.tsx
│   └── charts/
│       ├── mau-chart.tsx
│       └── activity-chart.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server component client
│   └── auth/
│       └── middleware.ts
├── middleware.ts                   # Route protection
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Kimlik Doğrulama (Admin Only)

Admin paneline yalnızca `profiles.role = 'admin'` kullanıcılar erişebilir.

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* ... */ } },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin rol kontrolü
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!login|_next|favicon).*)'],
};
```

---

## Dashboard Sayfası

```typescript
// app/(dashboard)/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MauChart } from '@/components/charts/mau-chart';

export default async function DashboardPage() {
  const sb = createServerSupabaseClient();

  const [
    { count: userCount },
    { count: flareCount },
    { count: openHelpCount },
    { count: pendingPinCount },
  ] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }),
    sb.from('flares').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    sb.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    sb.from('business_pins').select('*', { count: 'exact', head: true }).eq('is_verified', false),
  ]);

  const stats = [
    { title: 'Toplam Kullanıcı', value: userCount ?? 0 },
    { title: 'Aktif Flare',      value: flareCount ?? 0 },
    { title: 'Açık Yardım',     value: openHelpCount ?? 0 },
    { title: 'Bekleyen Pin',    value: pendingPinCount ?? 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <MauChart />
    </div>
  );
}
```

---

## İşletme Pin Doğrulama Ekranı

```typescript
// app/(dashboard)/pins/[id]/verify/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { VerifyPinForm } from './verify-form';
import { notFound } from 'next/navigation';

export default async function VerifyPinPage({ params }: { params: { id: string } }) {
  const sb = createServerSupabaseClient();
  const { data: pin } = await sb
    .from('business_pins')
    .select('*, profiles(username, display_name)')
    .eq('id', params.id)
    .single();

  if (!pin) notFound();

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Pin Doğrulama: {pin.name}</h1>
      <div className="space-y-2 mb-6 text-sm">
        <p><strong>Kategori:</strong> {pin.category}</p>
        <p><strong>Sahip:</strong> {pin.profiles?.username}</p>
        <p><strong>Adres:</strong> {pin.address ?? '—'}</p>
        <p><strong>Telefon:</strong> {pin.phone ?? '—'}</p>
        <p><strong>Web:</strong> {pin.website ?? '—'}</p>
      </div>
      <VerifyPinForm pinId={pin.id} currentStatus={pin.is_verified} />
    </div>
  );
}
```

```typescript
// app/(dashboard)/pins/[id]/verify/verify-form.tsx
'use client';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export function VerifyPinForm({ pinId, currentStatus }: { pinId: string; currentStatus: boolean }) {
  const router = useRouter();
  const sb = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleVerify(verified: boolean) {
    await sb.from('business_pins').update({ is_verified: verified }).eq('id', pinId);
    router.push('/pins');
    router.refresh();
  }

  return (
    <div className="flex gap-3">
      <Button onClick={() => handleVerify(true)}  variant="default">Onayla</Button>
      <Button onClick={() => handleVerify(false)} variant="destructive">Reddet</Button>
    </div>
  );
}
```

---

## Şikayet (Report) Yönetimi

```typescript
// app/(dashboard)/reports/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ReportsTable } from '@/components/data-tables/reports-table';

// Şikayet tablosu (DB migrasyon gerektirir — sprint 6)
// reports: id, reporter_id, content_type, content_id, reason, status, created_at

export default async function ReportsPage() {
  const sb = createServerSupabaseClient();
  const { data: reports } = await sb
    .from('reports')
    .select('*, profiles!reporter_id(username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Şikayetler</h1>
      <ReportsTable data={reports ?? []} />
    </div>
  );
}
```

---

## Analitik Sayfa — Recharts

```typescript
// components/charts/mau-chart.tsx
'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint { date: string; users: number; }

export function MauChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="bg-card rounded-xl p-4">
      <h2 className="text-sm font-medium text-muted-foreground mb-4">Aylık Aktif Kullanıcı</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="users" stroke="#E63946" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Sidebar Navigasyonu

```typescript
// components/layout/sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, MapPin, Flag, AlertTriangle, BarChart2, Settings
} from 'lucide-react';

const navItems = [
  { href: '/',            label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/users',       label: 'Kullanıcılar',icon: Users },
  { href: '/communities', label: 'Topluluklar', icon: Flag },
  { href: '/pins',        label: 'İşletme Pinleri', icon: MapPin },
  { href: '/reports',     label: 'Şikayetler',  icon: AlertTriangle },
  { href: '/analytics',   label: 'Analitik',    icon: BarChart2 },
  { href: '/settings',    label: 'Ayarlar',     icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 h-screen bg-card border-r flex flex-col">
      <div className="p-4 border-b">
        <span className="font-bold text-lg text-primary">Rollpit Admin</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

---

## Yetki Seviyeleri

| İşlem | Admin | Moderatör |
|---|---|---|
| Kullanıcı banla | ✅ | ❌ |
| İşletme pin doğrula | ✅ | ❌ |
| Şikayet gözden geçir | ✅ | ✅ |
| İçerik sil | ✅ | ✅ |
| Analitik görüntüle | ✅ | ❌ |
| Sistem ayarları | ✅ | ❌ |

Admin panel şu an yalnızca `admin` rolünü destekler. Moderatör paneli Faz 2'de eklenir.