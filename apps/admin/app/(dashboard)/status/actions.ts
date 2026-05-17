"use server";

import { redirect } from "next/navigation";
import { requireAdminActor, revalidateAdminModerationPaths, writeAuditLog } from "@/lib/admin-moderation";

function encodeActionError(message: string) {
  return encodeURIComponent(message);
}

export async function updateStatusPageState(formData: FormData) {
  const { actorId, adminClient } = await requireAdminActor();

  const publicUrl = String(formData.get("publicUrl") ?? "").trim() || "https://status.rollpit.app";
  const phase = String(formData.get("phase") ?? "investigating").trim();
  const message = String(formData.get("message") ?? "").trim();

  const components = [
    {
      key: "api",
      label: "API",
      status: String(formData.get("status_api") ?? "operational").trim(),
      note: String(formData.get("note_api") ?? "").trim(),
    },
    {
      key: "realtime",
      label: "Realtime",
      status: String(formData.get("status_realtime") ?? "operational").trim(),
      note: String(formData.get("note_realtime") ?? "").trim(),
    },
    {
      key: "push",
      label: "Push Bildirimleri",
      status: String(formData.get("status_push") ?? "operational").trim(),
      note: String(formData.get("note_push") ?? "").trim(),
    },
    {
      key: "media",
      label: "Medya Hattı",
      status: String(formData.get("status_media") ?? "operational").trim(),
      note: String(formData.get("note_media") ?? "").trim(),
    },
    {
      key: "admin",
      label: "Admin Panel",
      status: String(formData.get("status_admin") ?? "operational").trim(),
      note: String(formData.get("note_admin") ?? "").trim(),
    },
  ];

  const payload = {
    publicUrl,
    incident: {
      phase,
      message,
      updatedAt: new Date().toISOString(),
    },
    components,
  };

  const updateWithAuditColumn = await adminClient
    .from("remote_configs")
    .upsert(
      {
        key: "status_page_state",
        value: payload,
        description: "Durum sayfası bileşen sağlığı ve incident notu",
        updated_by: actorId,
      } as unknown as never,
      { onConflict: "key" },
    );

  let updateError = updateWithAuditColumn.error;

  if (updateError?.message?.includes("updated_by")) {
    const fallbackUpdate = await adminClient
      .from("remote_configs")
      .upsert(
        {
          key: "status_page_state",
          value: payload,
          description: "Durum sayfası bileşen sağlığı ve incident notu",
        } as unknown as never,
        { onConflict: "key" },
      );

    updateError = fallbackUpdate.error;
  }

  if (updateError) {
    redirect(`/status?result=error&message=${encodeActionError(updateError.message || "Durum sayfası kaydedilemedi.")}`);
  }

  let auditWarning: string | null = null;
  try {
    await writeAuditLog(actorId, "config_changed", "status_page", "status_page_state", {
      phase,
      publicUrl,
      source: "admin_panel",
    });
  } catch {
    auditWarning = "Durum sayfası kaydedildi, ancak audit kaydı yazılamadı.";
  }

  revalidateAdminModerationPaths("/status");
  const params = new URLSearchParams({ result: "updated" });
  if (auditWarning) {
    params.set("message", auditWarning);
  }

  redirect(`/status?${params.toString()}`);
}
