import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-lg py-3xl">
      <div className="grid w-full max-w-5xl gap-xl lg:grid-cols-[1.15fr_0.85fr]">
        <section className="surface-panel relative overflow-hidden p-2xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pit-red to-transparent" />
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-pit-red-soft">Pitlane Admin</p>
          <h1 className="mt-lg max-w-md text-4xl font-semibold leading-tight text-text-primary">
            Moderasyon ve operasyon merkezi tek yerden yonetilsin.
          </h1>
          <p className="mt-lg max-w-xl text-sm leading-7 text-text-secondary">
            Dashboard, rapor kuyrugu, topluluk akisleri ve isletme pin dogrulamalari bu panelde toplanir.
            Yetkisiz hesaplar giris yapsa bile admin rolu olmadan ilerleyemez.
          </p>
          <div className="mt-2xl grid gap-md sm:grid-cols-2">
            {[
              "Supabase tabanli oturum yonetimi",
              "Role dayali route korumasi",
              "Tailwind token uyumlu karanlik tema",
              "Klavye dostu focus ve 44px hedefler",
            ].map((item) => (
              <div key={item} className="surface-card flex items-start gap-md p-lg">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-pit-red" />
                <p className="text-sm leading-6 text-text-secondary">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-2xl">
          <div className="space-y-sm">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-pit-red-soft">Admin girisi</p>
            <h2 className="text-2xl font-semibold text-text-primary">E-posta ve sifre ile devam et</h2>
            <p className="text-sm leading-6 text-text-secondary">
              OTP kullanilmiyor. Supabase e-posta ve sifre girisi admin paneli icin dogrudan aktif.
            </p>
          </div>

          <div className="mt-xl">
            <Suspense fallback={<p className="text-sm text-text-secondary">Form hazirlaniyor...</p>}>
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
