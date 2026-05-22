"use server";

import { redirect } from "next/navigation";
import { revalidateAdminModerationPaths, requireAdminActor, sendSystemNotification, writeAuditLog } from "@/lib/admin-moderation";

async function getBusinessApplicationTarget(applicationId: string) {
  const { adminClient } = await requireAdminActor();
  const result = await adminClient
    .from("business_applications")
    .select("id, applicant_id, business_name, category, description, h3_cell, latitude, longitude, address, phone, website, photo_url, working_hours, status, location_id")
    .eq("id", applicationId)
    .maybeSingle();

  const application = result.data as {
    id: string;
    applicant_id: string;
    business_name: string;
    category: "garage" | "repair" | "parts" | "fuel" | "cafe" | "dealer" | "other";
    description: string | null;
    h3_cell: string;
    latitude: number;
    longitude: number;
    address: string;
    phone: string | null;
    website: string | null;
    photo_url: string | null;
    working_hours: Record<string, unknown>;
    status: "pending" | "under_review" | "approved" | "rejected";
    location_id: string | null;
  } | null;

  if (result.error || !application) {
    throw new Error("İşletme başvurusu bulunamadı.");
  }

  return application;
}

export async function approveBusinessApplication(applicationId: string) {
  const { actorId, adminClient } = await requireAdminActor();
  const application = await getBusinessApplicationTarget(applicationId);

  if (application.status !== "pending" && application.status !== "under_review") {
    throw new Error("Sadece bekleyen veya incelemedeki başvurular onaylanabilir.");
  }

  let locationId = application.location_id;
  if (!locationId) {
    const locationResult = await adminClient
      .from("business_locations")
      .insert({
        owner_id: application.applicant_id,
        source_application_id: application.id,
        business_name: application.business_name,
        category: application.category,
        description: application.description,
        h3_cell: application.h3_cell,
        latitude: application.latitude,
        longitude: application.longitude,
        address: application.address,
        phone: application.phone,
        website: application.website,
        photo_url: application.photo_url,
        working_hours: application.working_hours,
        is_active: true,
      } as never)
      .select("id")
      .single();

    const location = locationResult.data as { id: string } | null;
    if (locationResult.error || !location) {
      throw new Error("Business location oluşturulamadı.");
    }
    locationId = location.id;
  }

  const reviewedAt = new Date().toISOString();
  const updateResult = await adminClient
    .from("business_applications")
    .update({
      status: "approved",
      rejection_reason: null,
      reviewer_id: actorId,
      reviewed_at: reviewedAt,
      location_id: locationId,
    } as never)
    .eq("id", applicationId);

  if (updateResult.error) {
    throw new Error("Başvuru onaylanamadı.");
  }

  await sendSystemNotification(
    application.applicant_id,
    "İşletme başvurun onaylandı",
    "İşletme başvurun admin ekip tarafından onaylandı ve harita görünürlüğü için hazırlandı.",
    { source: "admin_panel", application_id: applicationId, action: "business_approved", location_id: locationId },
  );

  await writeAuditLog(actorId, "config_changed", "business_application", applicationId, {
    action: "business_approved",
    business_name: application.business_name,
    location_id: locationId,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths("/business/applications", `/business/applications/${applicationId}`);
  redirect(`/business/applications/${applicationId}?result=approved`);
}

export async function rejectBusinessApplication(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!applicationId) {
    throw new Error("Başvuru kaydı bulunamadı.");
  }
  if (!reason) {
    throw new Error("Red nedeni boş olamaz.");
  }

  const { actorId, adminClient } = await requireAdminActor();
  const application = await getBusinessApplicationTarget(applicationId);

  const updateResult = await adminClient
    .from("business_applications")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewer_id: actorId,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq("id", applicationId)
    .in("status", ["pending", "under_review"]);

  if (updateResult.error) {
    throw new Error("Başvuru reddedilemedi.");
  }

  await sendSystemNotification(
    application.applicant_id,
    "İşletme başvurun için ek güncelleme gerekiyor",
    "İşletme başvurun şu aşamada onaylanamadı. Red nedeni panel notlarında paylaşıldı; belgeleri güncelleyip yeniden başvurabilirsin.",
    { source: "admin_panel", application_id: applicationId, action: "business_rejected", reason },
  );

  await writeAuditLog(actorId, "config_changed", "business_application", applicationId, {
    action: "business_rejected",
    business_name: application.business_name,
    reason,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths("/business/applications", `/business/applications/${applicationId}`);
  redirect(`/business/applications/${applicationId}?result=rejected`);
}
