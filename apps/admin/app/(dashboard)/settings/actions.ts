"use server";

import { redirect } from "next/navigation";
import { requireAdminActor, revalidateAdminModerationPaths, writeAuditLog } from "@/lib/admin-moderation";

function encodeActionError(message: string) {
  return encodeURIComponent(message);
}

export async function updateRemoteConfig(formData: FormData) {
  const key = String(formData.get("key") ?? "").trim();
  const type = String(formData.get("type") ?? "string").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawValue = String(formData.get("value") ?? "").trim();

  if (!key) {
    redirect(`/settings?result=error&message=${encodeActionError("Config anahtarı zorunlu.")}`);
  }

  const { actorId, adminClient } = await requireAdminActor();

  let value: boolean | number | string = rawValue;
  if (type === "flag") {
    value = rawValue === "true";
  } else if (type === "number") {
    value = Number(rawValue);
    if (Number.isNaN(value)) {
      redirect(`/settings?result=error&message=${encodeActionError("Sayısal değer geçerli değil.")}`);
    }
  }

  const updateWithAuditColumn = await adminClient
    .from("remote_configs")
    .update({
      value,
      description,
      updated_by: actorId,
    } as unknown as never)
    .eq("key", key);

  let updateError = updateWithAuditColumn.error;

  // Some environments may not have the latest `updated_by` column yet.
  if (updateError?.message?.includes("updated_by")) {
    const fallbackUpdate = await adminClient
      .from("remote_configs")
      .update({
        value,
        description,
      } as unknown as never)
      .eq("key", key);

    updateError = fallbackUpdate.error;
  }

  if (updateError) {
    redirect(
      `/settings?result=error&message=${encodeActionError(
        updateError.message || "Uzak yapılandırma güncellenemedi.",
      )}`,
    );
  }

  let auditWarning: string | null = null;

  try {
    await writeAuditLog(actorId, "config_changed", "remote_config", key, {
      key,
      value,
      source: "admin_panel",
    });
  } catch {
    auditWarning = "Ayar kaydedildi, ancak audit kaydı yazılamadı.";
  }

  revalidateAdminModerationPaths("/settings");
  const params = new URLSearchParams({
    result: "updated",
    key,
  });

  if (auditWarning) {
    params.set("message", auditWarning);
  }

  redirect(`/settings?${params.toString()}`);
}
