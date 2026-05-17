"use server";

import { redirect } from "next/navigation";
import { requireAdminActor, revalidateAdminModerationPaths, writeAuditLog } from "@/lib/admin-moderation";
import type { Database } from "@/lib/types/database";

type InviteInsert = Database["public"]["Tables"]["invite_codes"]["Insert"];

function generateInviteCode(prefix: string) {
  const normalized = prefix
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || "ROLLPIT";
  const token = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${normalized}-${token}`;
}

export async function createInviteBatch(formData: FormData) {
  const prefix = String(formData.get("prefix") ?? "ROLLPIT").trim();
  const count = Number(String(formData.get("count") ?? "5"));
  const maxUses = Number(String(formData.get("maxUses") ?? "5"));
  const expiresAt = String(formData.get("expiresAt") ?? "").trim();

  if (!Number.isFinite(count) || count < 1 || count > 50) {
    throw new Error("Kod adedi 1 ile 50 arasında olmalı.");
  }

  if (!Number.isFinite(maxUses) || maxUses < 1 || maxUses > 20) {
    throw new Error("Maksimum kullanım 1 ile 20 arasında olmalı.");
  }

  const { actorId, adminClient } = await requireAdminActor();
  const payload: InviteInsert[] = Array.from({ length: count }, () => ({
    code: generateInviteCode(prefix),
    inviter_id: actorId,
    uses_count: 0,
    max_uses: maxUses,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
  }));

  const insertResult = await adminClient.from("invite_codes").insert(payload as unknown as never[]);
  if (insertResult.error) {
    throw new Error("Davet kodları oluşturulamadı.");
  }

  try {
    await writeAuditLog(actorId, "config_changed", "invite_code_batch", actorId, {
      prefix,
      count,
      max_uses: maxUses,
      expires_at: expiresAt || null,
      source: "admin_panel",
    });
  } catch {
    // Invite batch creation should still succeed even if audit write fails.
  }

  revalidateAdminModerationPaths("/invites");
  redirect(`/invites?result=created&count=${count}`);
}
