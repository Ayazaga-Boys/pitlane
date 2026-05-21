"use server";

import { redirect } from "next/navigation";
import { revalidateAdminModerationPaths, requireAdminActor, writeAuditLog } from "@/lib/admin-moderation";
import { mockCompetitions } from "@/lib/mock-data";

function getCompetitionTarget(competitionId: string) {
  const competition = mockCompetitions.find((entry) => entry.id === competitionId) ?? null;
  if (!competition) {
    throw new Error("Yarışma bulunamadı.");
  }

  return competition;
}

function getCompetitionEntryTarget(competitionId: string, entryId: string) {
  const competition = getCompetitionTarget(competitionId);
  const entry = competition.topEntries.find((item) => item.id === entryId) ?? null;

  if (!entry) {
    throw new Error("Yarışma katılımı bulunamadı.");
  }

  return { competition, entry };
}

export async function cancelCompetition(formData: FormData) {
  const competitionId = String(formData.get("competitionId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!competitionId || !reason) {
    throw new Error("Yarışma iptal nedeni zorunlu.");
  }

  const { actorId } = await requireAdminActor();
  const competition = getCompetitionTarget(competitionId);

  await writeAuditLog(actorId, "config_changed", "competition", competitionId, {
    action: "competition_canceled",
    competition_title: competition.title,
    community_name: competition.communityName,
    reason,
    source: "admin_panel",
    backend_contract: "pending",
  });

  revalidateAdminModerationPaths("/competitions", `/competitions/${competitionId}`, "/audit");
  redirect(`/competitions/${competitionId}?result=canceled`);
}

export async function pauseCompetitionVoting(formData: FormData) {
  const competitionId = String(formData.get("competitionId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!competitionId || !reason) {
    throw new Error("Oylama durdurma nedeni zorunlu.");
  }

  const { actorId } = await requireAdminActor();
  const competition = getCompetitionTarget(competitionId);

  await writeAuditLog(actorId, "config_changed", "competition", competitionId, {
    action: "competition_voting_paused",
    competition_title: competition.title,
    community_name: competition.communityName,
    reason,
    source: "admin_panel",
    backend_contract: "pending",
  });

  revalidateAdminModerationPaths("/competitions", `/competitions/${competitionId}`, "/audit");
  redirect(`/competitions/${competitionId}?result=paused`);
}

export async function rejectCompetitionEntry(formData: FormData) {
  const competitionId = String(formData.get("competitionId") ?? "");
  const entryId = String(formData.get("entryId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!competitionId || !entryId || !reason) {
    throw new Error("Entry reddetme için tüm alanlar zorunlu.");
  }

  const { actorId } = await requireAdminActor();
  const { competition, entry } = getCompetitionEntryTarget(competitionId, entryId);

  await writeAuditLog(actorId, "config_changed", "competition_entry", entryId, {
    action: "competition_entry_rejected",
    competition_id: competitionId,
    competition_title: competition.title,
    community_name: competition.communityName,
    entry_title: entry.title,
    reason,
    source: "admin_panel",
    backend_contract: "pending",
  });

  revalidateAdminModerationPaths("/competitions", `/competitions/${competitionId}`, "/audit");
  redirect(`/competitions/${competitionId}?result=entry_rejected`);
}
