"use server";

import { redirect } from "next/navigation";
import { requireAdminActor, requirePanelActor, revalidateAdminModerationPaths, resolveReport, setUserModerationState, writeAuditLog } from "@/lib/admin-moderation";
import type { Database } from "@/lib/types/database";

type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

interface ReportTargetInfo {
  id: string;
  contentType: Database["public"]["Tables"]["reports"]["Row"]["content_type"];
  contentId: string;
  reason: Database["public"]["Tables"]["reports"]["Row"]["reason"];
  targetUserId: string | null;
}

async function getReportTarget(reportId: string): Promise<ReportTargetInfo> {
  const { adminClient } = await requirePanelActor(["admin", "moderator"]);
  const reportResult = await adminClient
    .from("reports")
    .select("id, content_type, content_id, reason")
    .eq("id", reportId)
    .maybeSingle();

  const report = reportResult.data as {
    id: string;
    content_type: Database["public"]["Tables"]["reports"]["Row"]["content_type"];
    content_id: string;
    reason: Database["public"]["Tables"]["reports"]["Row"]["reason"];
  } | null;

  if (reportResult.error || !report) {
    throw new Error("Şikayet kaydı bulunamadı.");
  }

  let targetUserId: string | null = null;

  if (report.content_type === "message") {
    const messageResult = await adminClient.from("messages").select("sender_id").eq("id", report.content_id).maybeSingle();
    targetUserId = (messageResult.data as { sender_id: string } | null)?.sender_id ?? null;
  } else if (report.content_type === "flare") {
    const flareResult = await adminClient.from("flares").select("creator_id").eq("id", report.content_id).maybeSingle();
    targetUserId = (flareResult.data as { creator_id: string } | null)?.creator_id ?? null;
  } else if (report.content_type === "community") {
    const communityResult = await adminClient.from("communities").select("owner_id").eq("id", report.content_id).maybeSingle();
    targetUserId = (communityResult.data as { owner_id: string } | null)?.owner_id ?? null;
  } else if (report.content_type === "business_pin") {
    const pinResult = await adminClient.from("business_pins").select("owner_id").eq("id", report.content_id).maybeSingle();
    targetUserId = (pinResult.data as { owner_id: string } | null)?.owner_id ?? null;
  } else if (report.content_type === "profile") {
    targetUserId = report.content_id;
  }

  return {
    id: report.id,
    contentType: report.content_type,
    contentId: report.content_id,
    reason: report.reason,
    targetUserId,
  };
}

async function sendSystemWarning(userId: string, title: string, body: string, data: Record<string, unknown>) {
  const { adminClient } = await requirePanelActor(["admin", "moderator"]);
  const payload: NotificationInsert = {
    user_id: userId,
    type: "system",
    title,
    body,
    data,
  };

  const result = await adminClient.from("notifications").insert([payload] as unknown as never[]);
  if (result.error) {
    throw new Error("Sistem bildirimi gönderilemedi.");
  }
}

export async function deleteReportedContent(reportId: string) {
  const { actorId, adminClient } = await requirePanelActor(["admin", "moderator"]);
  const target = await getReportTarget(reportId);

  if (target.contentType === "message") {
    await adminClient.from("messages").update({ is_deleted: true } as unknown as never).eq("id", target.contentId);
  } else if (target.contentType === "flare") {
    await adminClient.from("flares").update({ status: "cancelled" } as unknown as never).eq("id", target.contentId);
  } else if (target.contentType === "community") {
    await adminClient.from("communities").delete().eq("id", target.contentId);
  }

  await resolveReport(reportId, { status: "reviewed", actionTaken: "content_deleted" });
  await writeAuditLog(actorId, "content_deleted", target.contentType, target.contentId, {
    report_id: reportId,
    reason: target.reason,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths(`/reports/${reportId}`, "/reports");
  redirect(`/reports/${reportId}?result=content_deleted`);
}

export async function warnReportedUser(reportId: string) {
  const { actorId } = await requirePanelActor(["admin", "moderator"]);
  const target = await getReportTarget(reportId);

  if (!target.targetUserId) {
    throw new Error("Uyarı gönderilecek kullanıcı bulunamadı.");
  }

  await sendSystemWarning(
    target.targetUserId,
    "Topluluk kuralları uyarısı",
    "Paylaştığın içerik bir moderatör tarafından incelendi. Lütfen topluluk kurallarını tekrar gözden geçir.",
    { report_id: reportId, action: "warning" },
  );
  await resolveReport(reportId, { status: "reviewed", actionTaken: "user_warned" });
  await writeAuditLog(actorId, "report_resolved", "report", reportId, {
    action: "user_warned",
    target_user_id: target.targetUserId,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths(`/reports/${reportId}`, "/reports");
  redirect(`/reports/${reportId}?result=warned`);
}

export async function suspendReportedUser(reportId: string) {
  const target = await getReportTarget(reportId);
  if (!target.targetUserId) {
    throw new Error("Askıya alınacak kullanıcı bulunamadı.");
  }

  await setUserModerationState(target.targetUserId, "suspend_7d");
  await resolveReport(reportId, { status: "reviewed", actionTaken: "user_banned" });
  revalidateAdminModerationPaths(`/reports/${reportId}`, "/reports", `/users/${target.targetUserId}`);
  redirect(`/reports/${reportId}?result=suspended`);
}

export async function banReportedUser(reportId: string) {
  const target = await getReportTarget(reportId);
  if (!target.targetUserId) {
    throw new Error("Ban uygulanacak kullanıcı bulunamadı.");
  }

  await setUserModerationState(target.targetUserId, "ban_permanent");
  await resolveReport(reportId, { status: "reviewed", actionTaken: "user_banned" });
  revalidateAdminModerationPaths(`/reports/${reportId}`, "/reports", `/users/${target.targetUserId}`);
  redirect(`/reports/${reportId}?result=banned`);
}

export async function dismissReportAction(reportId: string) {
  const { actorId } = await requirePanelActor(["admin", "moderator"]);
  await resolveReport(reportId, { status: "dismissed", actionTaken: "none" });
  await writeAuditLog(actorId, "report_resolved", "report", reportId, {
    action: "dismissed",
    source: "admin_panel",
  });
  revalidateAdminModerationPaths(`/reports/${reportId}`, "/reports");
  redirect(`/reports/${reportId}?result=dismissed`);
}
