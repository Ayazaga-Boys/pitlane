"use server";

import { redirect } from "next/navigation";
import { requireAdminActor, revalidateAdminModerationPaths, writeAuditLog } from "@/lib/admin-moderation";

export async function removeHelpRequestAction(helpRequestId: string) {
  const { actorId, adminClient } = await requireAdminActor();

  const requestResult = await adminClient
    .from("help_requests")
    .select("id, requester_id, issue_type, status")
    .eq("id", helpRequestId)
    .maybeSingle();

  const request = requestResult.data as {
    id: string;
    requester_id: string;
    issue_type: string;
    status: string;
  } | null;

  if (requestResult.error || !request) {
    throw new Error("Yardım talebi bulunamadı.");
  }

  const deleteResult = await adminClient.from("help_requests").delete().eq("id", helpRequestId);

  if (deleteResult.error) {
    throw new Error("Yardım talebi kaldırılamadı.");
  }

  await writeAuditLog(actorId, "config_changed", "help_request", helpRequestId, {
    action: "help_request_removed",
    requester_id: request.requester_id,
    issue_type: request.issue_type,
    previous_status: request.status,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths("/help-requests", `/help-requests/${helpRequestId}`);
  redirect("/help-requests?result=removed");
}
