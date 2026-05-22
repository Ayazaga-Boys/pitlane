import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

interface BackendCallResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

function getBackendBaseUrl() {
  const value = process.env.API_BASE_URL?.trim() ?? process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
  if (value) {
    return value.replace(/\/$/, "");
  }

  return "http://127.0.0.1:3000";
}

export async function callAdminBackend<T = unknown>(
  path: string,
  init?: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: Record<string, unknown>;
  },
): Promise<BackendCallResult<T>> {
  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) {
    return { ok: false, status: 0, data: null, error: "missing_api_base_url" };
  }

  const sessionClient = createServerSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await sessionClient.auth.getSession();

  if (sessionError || !session?.access_token) {
    return { ok: false, status: 401, data: null, error: "missing_admin_session" };
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as T | { error?: string; code?: string } | null;
    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? ((payload as T | null) ?? null) : null,
      error: response.ok ? null : (typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string" ? payload.error : "backend_request_failed"),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "backend_request_failed",
    };
  }
}
