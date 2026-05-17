"use server";

import { redirect } from "next/navigation";
import { requireAdminActor, revalidateAdminModerationPaths, writeAuditLog } from "@/lib/admin-moderation";
import type { Database, UserRole } from "@/lib/types/database";

type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

function audienceLabel(audience: string) {
  switch (audience) {
    case "admins":
      return "Adminler";
    case "moderators":
      return "Moderatörler";
    case "active_users":
      return "Aktif kullanıcılar";
    default:
      return "Tüm kullanıcılar";
  }
}

export async function sendSystemNotification(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "all");

  if (!title || !body) {
    throw new Error("Başlık ve mesaj gövdesi zorunlu.");
  }

  const { actorId, adminClient } = await requireAdminActor();
  let query = adminClient.from("profiles").select("id, role");

  if (audience === "admins") {
    query = query.eq("role", "admin");
  } else if (audience === "moderators") {
    query = query.eq("role", "moderator");
  } else if (audience === "active_users") {
    query = query.eq("role", "user");
  }

  const recipientsResult = await query;
  const recipients = (recipientsResult.data as Array<{ id: string; role: UserRole }> | null) ?? null;

  if (recipientsResult.error || !recipients || recipients.length === 0) {
    throw new Error("Bildirim gönderilecek kullanıcı bulunamadı.");
  }

  const payload: NotificationInsert[] = recipients.map((recipient) => ({
    user_id: recipient.id,
    type: "system",
    title,
    body,
    data: {
      audience,
      audience_label: audienceLabel(audience),
      source: "admin_panel",
      sent_by: actorId,
    },
  }));

  const insertResult = await adminClient.from("notifications").insert(payload as unknown as never[]);
  if (insertResult.error) {
    throw new Error("Sistem bildirimi gönderilemedi.");
  }

  await writeAuditLog(actorId, "config_changed", "system_notification", actorId, {
    title,
    audience,
    audience_label: audienceLabel(audience),
    recipient_count: recipients.length,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths("/notifications");
  redirect(`/notifications?result=sent&count=${recipients.length}`);
}
