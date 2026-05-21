"use server";

import { redirect } from "next/navigation";
import {
  revalidateAdminModerationPaths,
  requirePanelActor,
  sendSystemNotification,
  setUserModerationState,
  writeAuditLog,
} from "@/lib/admin-moderation";

async function getStoryTarget(storyId: string) {
  const { adminClient } = await requirePanelActor(["admin", "moderator"]);
  const result = await adminClient
    .from("stories")
    .select("id, author_id, media_id, deleted_at")
    .eq("id", storyId)
    .maybeSingle();

  const story = result.data as {
    id: string;
    author_id: string;
    media_id: string;
    deleted_at: string | null;
  } | null;

  if (result.error || !story) {
    throw new Error("Story bulunamadı.");
  }

  return story;
}

export async function deleteStoryContent(storyId: string) {
  const { actorId, adminClient } = await requirePanelActor(["admin", "moderator"]);
  const story = await getStoryTarget(storyId);

  if (!story.deleted_at) {
    const deletedAt = new Date().toISOString();
    const result = await adminClient.from("stories").update({ deleted_at: deletedAt } as never).eq("id", storyId);
    if (result.error) throw new Error("Story kaldırılamadı.");

    await adminClient.from("media_assets").update({ owner_type: null, owner_id: null } as never).eq("id", story.media_id);
    await writeAuditLog(actorId, "content_deleted", "story", storyId, { source: "admin_panel" });
  }

  revalidateAdminModerationPaths("/stories", `/stories/${storyId}`);
  redirect(`/stories/${storyId}?result=content_deleted`);
}

export async function restoreStoryContent(storyId: string) {
  const { actorId, adminClient } = await requirePanelActor(["admin", "moderator"]);
  const story = await getStoryTarget(storyId);

  if (story.deleted_at) {
    const result = await adminClient.from("stories").update({ deleted_at: null } as never).eq("id", storyId);
    if (result.error) throw new Error("Story geri yüklenemedi.");

    await writeAuditLog(actorId, "content_restored", "story", storyId, { source: "admin_panel" });
  }

  revalidateAdminModerationPaths("/stories", `/stories/${storyId}`);
  redirect(`/stories/${storyId}?result=content_restored`);
}

export async function warnStoryAuthor(storyId: string) {
  const { actorId } = await requirePanelActor(["admin", "moderator"]);
  const story = await getStoryTarget(storyId);

  await sendSystemNotification(
    story.author_id,
    "Story içeriğin moderasyon incelemesinde",
    "Story paylaşımın moderasyon ekibi tarafından işaretlendi. Lütfen topluluk kurallarını tekrar kontrol et.",
    { source: "admin_panel", story_id: storyId, action: "warning" },
  );

  await writeAuditLog(actorId, "report_resolved", "story", storyId, {
    action: "user_warned",
    target_user_id: story.author_id,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths("/stories", `/stories/${storyId}`);
  redirect(`/stories/${storyId}?result=warned`);
}

export async function suspendStoryAuthor(storyId: string) {
  const story = await getStoryTarget(storyId);
  await setUserModerationState(story.author_id, "suspend_7d");
  revalidateAdminModerationPaths("/stories", `/stories/${storyId}`, `/users/${story.author_id}`);
  redirect(`/stories/${storyId}?result=suspended`);
}

export async function banStoryAuthor(storyId: string) {
  const story = await getStoryTarget(storyId);
  await setUserModerationState(story.author_id, "ban_permanent");
  revalidateAdminModerationPaths("/stories", `/stories/${storyId}`, `/users/${story.author_id}`);
  redirect(`/stories/${storyId}?result=banned`);
}
