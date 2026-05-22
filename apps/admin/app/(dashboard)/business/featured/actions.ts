"use server";

import { redirect } from "next/navigation";
import { revalidateAdminModerationPaths, requireAdminActor, writeAuditLog } from "@/lib/admin-moderation";

export async function updateBusinessFeaturedRank(formData: FormData) {
  const locationId = String(formData.get("locationId") ?? "").trim();
  const nextRank = Number(String(formData.get("featuredRank") ?? "").trim());

  if (!locationId) {
    throw new Error("Business location kaydı bulunamadı.");
  }
  if (!Number.isFinite(nextRank) || nextRank < 0) {
    throw new Error("Featured rank 0 veya üzeri olmalı.");
  }

  const { actorId, adminClient } = await requireAdminActor();
  const currentResult = await adminClient
    .from("business_locations")
    .select("id, business_name, featured_rank")
    .eq("id", locationId)
    .maybeSingle();

  const location = currentResult.data as { id: string; business_name: string; featured_rank: number } | null;
  if (currentResult.error || !location) {
    throw new Error("Business location bulunamadı.");
  }

  const updateResult = await adminClient
    .from("business_locations")
    .update({ featured_rank: nextRank } as never)
    .eq("id", locationId);

  if (updateResult.error) {
    throw new Error("Featured rank güncellenemedi.");
  }

  await writeAuditLog(actorId, "config_changed", "business_location", locationId, {
    action: "featured_rank_updated",
    business_name: location.business_name,
    previous_rank: location.featured_rank,
    next_rank: nextRank,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths("/business/featured", "/business/locations/map");
  redirect("/business/featured?result=rank_updated");
}
