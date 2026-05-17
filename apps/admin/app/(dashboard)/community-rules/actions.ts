"use server";

import { redirect } from "next/navigation";
import { requireAdminActor, revalidateAdminModerationPaths, writeAuditLog } from "@/lib/admin-moderation";

function encodeActionError(message: string) {
  return encodeURIComponent(message);
}

export async function updateCommunityRules(formData: FormData) {
  const version = String(formData.get("version") ?? "").trim() || "v1.0";
  const publishedUrl = String(formData.get("publishedUrl") ?? "").trim() || "https://rollpit.app/community-guidelines";
  const trText = String(formData.get("trText") ?? "").trim();
  const enText = String(formData.get("enText") ?? "").trim();

  if (!trText || !enText) {
    redirect(`/community-rules?result=error&message=${encodeActionError("TR ve EN kural metni birlikte zorunlu.")}`);
  }

  const { actorId, adminClient } = await requireAdminActor();
  const payload = {
    version,
    publishedUrl,
    trText,
    enText,
    updatedAt: new Date().toISOString(),
  };

  const updateWithAuditColumn = await adminClient
    .from("remote_configs")
    .upsert(
      {
        key: "community_guidelines_v1",
        value: payload,
        description: "Topluluk kuralları TR-EN yayın metni",
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
          key: "community_guidelines_v1",
          value: payload,
          description: "Topluluk kuralları TR-EN yayın metni",
        } as unknown as never,
        { onConflict: "key" },
      );

    updateError = fallbackUpdate.error;
  }

  if (updateError) {
    redirect(`/community-rules?result=error&message=${encodeActionError(updateError.message || "Kural metni kaydedilemedi.")}`);
  }

  let auditWarning: string | null = null;
  try {
    await writeAuditLog(actorId, "config_changed", "community_rules", "community_guidelines_v1", {
      version,
      publishedUrl,
      source: "admin_panel",
    });
  } catch {
    auditWarning = "Kural metni kaydedildi, ancak audit kaydı yazılamadı.";
  }

  revalidateAdminModerationPaths("/community-rules");
  const params = new URLSearchParams({ result: "updated" });
  if (auditWarning) params.set("message", auditWarning);
  redirect(`/community-rules?${params.toString()}`);
}
