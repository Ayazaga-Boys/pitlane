"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendPinRejectionEmail } from "@/lib/admin-integrations";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type AuditLogInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];
type BusinessPinUpdate = Database["public"]["Tables"]["business_pins"]["Update"];
type AdminActor = { id: string; role: "user" | "moderator" | "admin" };

async function requireAdminActor() {
  const sessionClient = createServerSupabaseClient();
  const { data: authData, error: authError } = await sessionClient.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("Admin oturumu bulunamadı.");
  }

  const adminClient = createAdminSupabaseClient();
  const actorResult = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", authData.user.id);

  const actorProfile = (actorResult.data?.[0] as AdminActor | undefined) ?? null;
  const actorError = actorResult.error;

  if (actorError || !actorProfile || actorProfile.role !== "admin") {
    throw new Error("Bu aksiyon için admin rolü gerekiyor.");
  }

  return { actorId: actorProfile.id, adminClient };
}

async function writeAuditLog(
  actorId: string,
  action: "pin_verified" | "pin_rejected",
  targetId: string,
  metadata: Record<string, unknown>,
) {
  const adminClient = createAdminSupabaseClient();
  const payload: AuditLogInsert = {
    actor_id: actorId,
    action,
    target_type: "business_pin",
    target_id: targetId,
    metadata,
  };
  const auditResult = await adminClient.from("audit_logs").insert([payload] as unknown as never[]);

  if (auditResult.error) {
    throw new Error("Audit log kaydı yazılamadı.");
  }
}

export async function verifyBusinessPinAction(pinId: string) {
  const { actorId, adminClient } = await requireAdminActor();
  const payload: BusinessPinUpdate = {
    is_verified: true,
    is_active: true,
  };
  const updateResult = await adminClient
    .from("business_pins")
    .update(payload as unknown as never)
    .eq("id", pinId);

  if (updateResult.error) {
    throw new Error("İşletme pini doğrulanamadı.");
  }

  await writeAuditLog(actorId, "pin_verified", pinId, {
    source: "admin_panel",
  });

  revalidatePath("/");
  revalidatePath("/pins");
  revalidatePath(`/pins/${pinId}/verify`);
  redirect(`/pins/${pinId}/verify?result=verified`);
}

export async function rejectBusinessPinAction(pinId: string) {
  const { actorId, adminClient } = await requireAdminActor();
  const pinResult = await adminClient.from("business_pins").select("id, owner_id, name").eq("id", pinId).maybeSingle();
  const pin = pinResult.data as { id: string; owner_id: string; name: string } | null;

  if (pinResult.error || !pin) {
    throw new Error("İşletme pini bulunamadı.");
  }

  const payload: BusinessPinUpdate = {
    is_verified: false,
    is_active: false,
  };
  const updateResult = await adminClient
    .from("business_pins")
    .update(payload as unknown as never)
    .eq("id", pinId);

  if (updateResult.error) {
    throw new Error("İşletme pini reddedilemedi.");
  }

  const ownerProfileResult = await adminClient
    .from("profiles")
    .select("display_name, username")
    .eq("id", pin.owner_id)
    .maybeSingle();
  const ownerProfile = ownerProfileResult.data as { display_name: string | null; username: string | null } | null;
  const ownerAuthResult = await adminClient.auth.admin.getUserById(pin.owner_id);
  const ownerEmail = ownerAuthResult.data.user?.email ?? null;
  const recipientName = ownerProfile?.display_name ?? ownerProfile?.username ?? "Rollpit kullanıcısı";
  const emailDelivery = await sendPinRejectionEmail({
    to: ownerEmail,
    recipientName,
    businessName: pin.name,
  });

  await writeAuditLog(actorId, "pin_rejected", pinId, {
    source: "admin_panel",
    rejection_email_attempted: emailDelivery.attempted,
    rejection_email_delivered: emailDelivery.delivered,
    rejection_email_reason: emailDelivery.reason ?? null,
    rejection_email_target: ownerEmail,
  });

  revalidatePath("/");
  revalidatePath("/pins");
  revalidatePath(`/pins/${pinId}/verify`);
  redirect(`/pins/${pinId}/verify?result=rejected`);
}
