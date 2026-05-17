"use server";

import { redirect } from "next/navigation";
import { requireAdminActor, revalidateAdminModerationPaths, writeAuditLog } from "@/lib/admin-moderation";

export async function sendWaveInvites(formData: FormData) {
  const count = Number(String(formData.get("count") ?? "100"));

  if (!Number.isFinite(count) || count < 1 || count > 500) {
    throw new Error("Wave invite adedi 1 ile 500 arasında olmalı.");
  }

  const { actorId, adminClient } = await requireAdminActor();
  const candidatesResult = await adminClient
    .from("waiting_list")
    .select("id")
    .is("invited_at", null)
    .order("created_at", { ascending: true })
    .limit(count);

  const candidates = candidatesResult.data as Array<{ id: string }> | null;
  if (candidatesResult.error || !candidates || candidates.length === 0) {
    throw new Error("Wave invite için uygun aday bulunamadı.");
  }

  const ids = candidates.map((candidate) => candidate.id);
  const now = new Date().toISOString();
  const updateResult = await adminClient
    .from("waiting_list")
    .update({ invited_at: now } as unknown as never)
    .in("id", ids);

  if (updateResult.error) {
    throw new Error("Bekleme listesi güncellenemedi.");
  }

  try {
    await writeAuditLog(actorId, "config_changed", "waiting_list_wave", actorId, {
      invited_count: ids.length,
      source: "admin_panel",
      sent_at: now,
    });
  } catch {
    // Keep wave invite action successful even if audit write fails.
  }

  revalidateAdminModerationPaths("/waiting-list");
  redirect(`/waiting-list?result=sent&count=${ids.length}`);
}
