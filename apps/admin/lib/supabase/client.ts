"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getBrowserEnv } from "@/lib/env";
import type { Database } from "@/lib/types/database";

let browserClient:
  | ReturnType<typeof createBrowserClient<Database>>
  | undefined;

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const env = getBrowserEnv();

  browserClient = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return browserClient;
}
