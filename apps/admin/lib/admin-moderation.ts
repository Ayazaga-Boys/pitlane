import { revalidatePath } from "next/cache";
import { notifyRealtimeDisconnect } from "@/lib/admin-integrations";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database, UserRole } from "@/lib/types/database";

type AuditAction = Database["public"]["Tables"]["audit_logs"]["Row"]["action"];
type AuditInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type ReportUpdate = Database["public"]["Tables"]["reports"]["Update"];
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

interface AdminActor {
  actorId: string;
  adminClient: ReturnType<typeof createAdminSupabaseClient>;
  role: UserRole;
}

export interface UserModerationResult {
  status: "active" | "suspended";
  role: UserRole;
}

function safeAuditInsertPayload(payload: AuditInsert) {
  return [payload] as unknown as never[];
}

function safeProfileUpdatePayload(payload: ProfileUpdate) {
  return payload as unknown as never;
}

function safeReportUpdatePayload(payload: ReportUpdate) {
  return payload as unknown as never;
}

export async function requirePanelActor(allowedRoles: UserRole[] = ["admin"]): Promise<AdminActor> {
  const sessionClient = createServerSupabaseClient();
  const { data: authData, error: authError } = await sessionClient.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("Admin oturumu bulunamadı.");
  }

  const adminClient = createAdminSupabaseClient();
  const actorResult = await adminClient.from("profiles").select("id, role").eq("id", authData.user.id);
  const actorProfile = actorResult.data?.[0] as { id: string; role: UserRole } | undefined;

  if (actorResult.error || !actorProfile || !allowedRoles.includes(actorProfile.role)) {
    throw new Error("Bu aksiyon için yetkili panel rolü gerekiyor.");
  }

  return { actorId: actorProfile.id, adminClient, role: actorProfile.role };
}

export async function requireAdminActor(): Promise<AdminActor> {
  return requirePanelActor(["admin"]);
}

export async function writeAuditLog(
  actorId: string,
  action: AuditAction,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown>,
) {
  const adminClient = createAdminSupabaseClient();
  const payload: AuditInsert = {
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  };

  const result = await adminClient.from("audit_logs").insert(safeAuditInsertPayload(payload));

  if (result.error) {
    throw new Error("Audit log kaydı yazılamadı.");
  }
}

async function getLatestPreviousRole(userId: string): Promise<UserRole> {
  const adminClient = createAdminSupabaseClient();
  const auditResult = await adminClient
    .from("audit_logs")
    .select("metadata")
    .eq("action", "user_banned")
    .eq("target_type", "profile")
    .eq("target_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const latestAudit = (auditResult.data?.[0] as { metadata?: { previous_role?: unknown } } | undefined) ?? undefined;
  const metadata = latestAudit?.metadata;
  const previousRole = metadata?.previous_role;

  if (previousRole === "admin" || previousRole === "moderator" || previousRole === "user") {
    return previousRole;
  }

  return "user";
}

export async function setUserModerationState(
  userId: string,
  mode: "suspend_7d" | "ban_permanent" | "unban",
): Promise<UserModerationResult> {
  const { actorId, adminClient } = await requireAdminActor();
  const profileResult = await adminClient.from("profiles").select("id, role").eq("id", userId).maybeSingle();
  const currentProfile = profileResult.data as { id: string; role: UserRole } | null;

  if (profileResult.error || !currentProfile) {
    throw new Error("Kullanıcı profili bulunamadı.");
  }

  if (mode === "unban") {
    const restoreRole = await getLatestPreviousRole(userId);
    const authResult = await adminClient.auth.admin.updateUserById(userId, { ban_duration: "0" });
    if (authResult.error) {
      throw new Error("Ban kaldırılırken auth güncellenemedi.");
    }

    const profileUpdate: ProfileUpdate = { role: restoreRole };
    const profileUpdateResult = await adminClient.from("profiles").update(safeProfileUpdatePayload(profileUpdate)).eq("id", userId);
    if (profileUpdateResult.error) {
      throw new Error("Ban kaldırılırken profil rolü güncellenemedi.");
    }

    await writeAuditLog(actorId, "user_unbanned", "profile", userId, {
      restore_role: restoreRole,
      source: "admin_panel",
    });

    return { status: "active", role: restoreRole };
  }

  const banDuration = mode === "suspend_7d" ? "7d" : "none";
  const authResult = await adminClient.auth.admin.updateUserById(userId, { ban_duration: banDuration });
  if (authResult.error) {
    throw new Error("Kullanıcı askıya alınamadı.");
  }

  const profileUpdate: ProfileUpdate = { role: "banned" };
  const profileUpdateResult = await adminClient.from("profiles").update(safeProfileUpdatePayload(profileUpdate)).eq("id", userId);
  if (profileUpdateResult.error) {
    throw new Error("Kullanıcı rolü güncellenemedi.");
  }

  if (mode === "ban_permanent") {
    await adminClient.from("push_devices").delete().eq("user_id", userId);
  }

  const realtimeHook =
    mode === "ban_permanent"
      ? await notifyRealtimeDisconnect({ userId, mode })
      : { attempted: false, delivered: false, reason: "not_required" };

  await writeAuditLog(actorId, "user_banned", "profile", userId, {
    mode,
    previous_role: currentProfile.role,
    cleared_push_devices: mode === "ban_permanent",
    realtime_disconnect_attempted: realtimeHook.attempted,
    realtime_disconnect_delivered: realtimeHook.delivered,
    realtime_disconnect_reason: realtimeHook.reason ?? null,
    source: "admin_panel",
  });

  return { status: "suspended", role: "banned" };
}

export async function addSupportNote(userId: string, note: string) {
  const trimmed = note.trim();
  if (!trimmed) {
    throw new Error("Destek notu boş olamaz.");
  }

  const { actorId } = await requireAdminActor();
  await writeAuditLog(actorId, "config_changed", "support_note", userId, {
    note: trimmed,
    source: "admin_panel",
  });
}

export async function sendSystemNotification(userId: string, title: string, body: string, data: Record<string, unknown>) {
  const { adminClient } = await requirePanelActor(["admin", "moderator"]);
  const payload: NotificationInsert = {
    user_id: userId,
    type: "system",
    title,
    body,
    data,
  };

  const result = await adminClient.from("notifications").insert([payload] as unknown as never[]);
  if (result.error) {
    throw new Error("Sistem bildirimi gönderilemedi.");
  }
}

export async function deleteCommunity(communityId: string) {
  const { actorId, adminClient } = await requireAdminActor();
  const communityResult = await adminClient.from("communities").select("id, name").eq("id", communityId).maybeSingle();
  const community = communityResult.data as { id: string; name: string } | null;

  if (communityResult.error || !community) {
    throw new Error("Topluluk bulunamadı.");
  }

  const deleteResult = await adminClient.from("communities").delete().eq("id", communityId);
  if (deleteResult.error) {
    throw new Error("Topluluk silinemedi.");
  }

  await writeAuditLog(actorId, "config_changed", "community", communityId, {
    action: "community_deleted",
    name: community.name,
    source: "admin_panel",
  });
}

export async function resolveReport(
  reportId: string,
  update: {
    status: "reviewed" | "dismissed";
    actionTaken: Database["public"]["Tables"]["reports"]["Row"]["action_taken"];
  },
) {
  const { actorId, adminClient } = await requirePanelActor(["admin", "moderator"]);
  const payload: ReportUpdate = {
    status: update.status,
    reviewed_by: actorId,
    reviewed_at: new Date().toISOString(),
    action_taken: update.actionTaken,
  };

  const result = await adminClient.from("reports").update(safeReportUpdatePayload(payload)).eq("id", reportId);
  if (result.error) {
    throw new Error("Şikayet durumu güncellenemedi.");
  }
}

export function revalidateAdminModerationPaths(...paths: string[]) {
  const defaults = ["/users", "/communities", "/reports", "/posts", "/comments", "/pins", "/"];
  for (const path of [...defaults, ...paths]) {
    revalidatePath(path);
  }
}
