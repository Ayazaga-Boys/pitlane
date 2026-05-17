import { redirect } from "next/navigation";
import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProfileRow, UserRole } from "@/lib/types/database";

export interface AdminIdentity {
  userId: string;
  email: string | undefined;
  role: UserRole;
  profile: ProfileRow | null;
}

function deriveRole(profile: ProfileRow | null, metadataRole: unknown): UserRole | null {
  if (profile?.role) {
    return profile.role;
  }

  if (metadataRole === "admin" || metadataRole === "moderator" || metadataRole === "user") {
    return metadataRole;
  }

  return null;
}

export const getAdminIdentity = cache(async (): Promise<AdminIdentity> => {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profileResult = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileResult.data ?? null;
  const role = deriveRole(profile, user.app_metadata.role ?? user.user_metadata.role);

  if (role !== "admin" && role !== "moderator") {
    redirect("/login?error=unauthorized");
  }

  return {
    userId: user.id,
    email: user.email,
    role,
    profile,
  };
});
