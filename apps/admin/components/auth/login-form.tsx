"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "unauthorized"
      ? "Bu panel yalnızca admin rolündeki hesaplar için açıktır."
      : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form className="space-y-lg" onSubmit={handleSubmit}>
      <div className="space-y-sm">
        <label className="block text-sm font-medium text-text-secondary" htmlFor="email">
          E-posta
        </label>
        <Input
          autoComplete="email"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@pitlane.test"
          required
          type="email"
          value={email}
        />
      </div>

      <div className="space-y-sm">
        <label className="block text-sm font-medium text-text-secondary" htmlFor="password">
          Şifre
        </label>
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={password}
        />
      </div>

      {error ? (
        <div className="flex items-start gap-sm rounded-md border border-error/40 bg-error/10 p-md text-sm text-white">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-error" />
          <p>{error}</p>
        </div>
      ) : null}

      <Button className="w-full gap-sm" disabled={isSubmitting} type="submit">
        {isSubmitting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
        {isSubmitting ? "Giriş yapılıyor" : "Giriş yap"}
      </Button>
    </form>
  );
}
