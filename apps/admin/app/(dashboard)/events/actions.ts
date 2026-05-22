"use server";

import { redirect } from "next/navigation";
import { revalidateAdminModerationPaths, requireAdminActor, sendSystemNotification, writeAuditLog } from "@/lib/admin-moderation";

async function getEventTarget(eventId: string) {
  const { adminClient } = await requireAdminActor();
  const result = await adminClient
    .from("community_events")
    .select("id, community_id, creator_id, title, status")
    .eq("id", eventId)
    .maybeSingle();

  const event = result.data as {
    id: string;
    community_id: string;
    creator_id: string;
    title: string;
    status: "scheduled" | "canceled" | "completed";
  } | null;

  if (result.error || !event) {
    throw new Error("Etkinlik bulunamadı.");
  }

  return event;
}

export async function cancelCommunityEvent(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!eventId || !reason) {
    throw new Error("Etkinlik iptal nedeni zorunlu.");
  }

  const { actorId, adminClient } = await requireAdminActor();
  const event = await getEventTarget(eventId);

  if (event.status !== "scheduled") {
    throw new Error("Sadece planlanan etkinlik iptal edilebilir.");
  }

  const updateResult = await adminClient
    .from("community_events")
    .update({ status: "canceled" } as never)
    .eq("id", eventId);

  if (updateResult.error) {
    throw new Error("Etkinlik iptal edilemedi.");
  }

  await sendSystemNotification(
    event.creator_id,
    "Etkinliğin moderasyon incelemesiyle iptal edildi",
    "Oluşturduğun etkinlik admin ekip tarafından iptal edildi. Ayrıntılar için topluluk kurallarını ve moderasyon notunu gözden geçir.",
    { source: "admin_panel", event_id: eventId, community_id: event.community_id, action: "event_canceled", reason },
  );

  await writeAuditLog(actorId, "config_changed", "community_event", eventId, {
    action: "event_canceled",
    reason,
    title: event.title,
    community_id: event.community_id,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths("/events", `/users/${event.creator_id}`);
  redirect("/events?result=canceled");
}
