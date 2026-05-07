import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase/middleware";
import type { ProfileRow, UserRole } from "@/lib/types/database";

function resolveRole(profile: ProfileRow | null, metadataRole: unknown): UserRole | null {
  if (profile?.role) {
    return profile.role;
  }

  if (metadataRole === "admin" || metadataRole === "moderator" || metadataRole === "user") {
    return metadataRole;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareSupabaseClient(request);
  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname.startsWith("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isLoginPage) {
      return response;
    }

    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const profileResult = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const role = resolveRole(profileResult.data ?? null, user.app_metadata.role ?? user.user_metadata.role);

  if (role !== "admin") {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(redirectUrl);
  }

  if (isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
