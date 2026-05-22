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

export async function revokeCommunityInvite(formData: FormData) {
  const inviteId = String(formData.get("inviteId") ?? "").trim();
  if (!inviteId) {
    throw new Error("Davet kaydı bulunamadı.");
  }

  const { actorId, adminClient } = await requireAdminActor();
  const existingResult = await adminClient
    .from("community_invites")
    .select("id, community_id, link_slug, code, uses_count, max_uses, expires_at")
    .eq("id", inviteId)
    .maybeSingle();

  const existingInvite = existingResult.data as {
    id: string;
    community_id: string;
    link_slug: string | null;
    code: string | null;
    uses_count: number;
    max_uses: number | null;
    expires_at: string | null;
  } | null;

  if (existingResult.error || !existingInvite) {
    throw new Error("Topluluk daveti bulunamadı.");
  }

  const revokedAt = new Date().toISOString();
  const updateResult = await adminClient
    .from("community_invites")
    .update({ expires_at: revokedAt, max_uses: existingInvite.uses_count } as never)
    .eq("id", inviteId);

  if (updateResult.error) {
    throw new Error("Topluluk daveti revoke edilemedi.");
  }

  await writeAuditLog(actorId, "config_changed", "community_invite", inviteId, {
    community_id: existingInvite.community_id,
    token: existingInvite.link_slug ?? existingInvite.code,
    previous_expires_at: existingInvite.expires_at,
    previous_max_uses: existingInvite.max_uses,
    revoked_at: revokedAt,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths("/invites");
  redirect("/invites?result=community_invite_revoked");
}
