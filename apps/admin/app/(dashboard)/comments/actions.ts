"use server";

import { redirect } from "next/navigation";
import {
  revalidateAdminModerationPaths,
  requirePanelActor,
  sendSystemNotification,
  setUserModerationState,
  writeAuditLog,
} from "@/lib/admin-moderation";

async function getCommentTarget(commentId: string) {
  const { adminClient } = await requirePanelActor(["admin", "moderator"]);
  const result = await adminClient
    .from("comments")
    .select("id, author_id, post_id, body, is_deleted")
    .eq("id", commentId)
    .maybeSingle();

  const comment = result.data as {
    id: string;
    author_id: string;
    post_id: string;
    body: string;
    is_deleted: boolean;
  } | null;

  if (result.error || !comment) {
    throw new Error("Yorum bulunamadı.");
  }

  return comment;
}

export async function deleteCommentContent(commentId: string) {
  const { actorId, adminClient } = await requirePanelActor(["admin", "moderator"]);
  const comment = await getCommentTarget(commentId);

  if (!comment.is_deleted) {
    const result = await adminClient.from("comments").update({ is_deleted: true } as never).eq("id", commentId);
    if (result.error) {
      throw new Error("Yorum kaldırılamadı.");
    }

    await writeAuditLog(actorId, "content_deleted", "comment", commentId, {
      source: "admin_panel",
      post_id: comment.post_id,
    });
  }

  revalidateAdminModerationPaths("/comments", `/posts/${comment.post_id}`);
  redirect("/comments?result=content_deleted");
}

export async function restoreCommentContent(commentId: string) {
  const { actorId, adminClient } = await requirePanelActor(["admin", "moderator"]);
  const comment = await getCommentTarget(commentId);

  if (comment.is_deleted) {
    const result = await adminClient.from("comments").update({ is_deleted: false } as never).eq("id", commentId);
    if (result.error) {
      throw new Error("Yorum geri yüklenemedi.");
    }

    await writeAuditLog(actorId, "content_restored", "comment", commentId, {
      source: "admin_panel",
      post_id: comment.post_id,
    });
  }

  revalidateAdminModerationPaths("/comments", `/posts/${comment.post_id}`);
  redirect("/comments?result=content_restored");
}

export async function warnCommentAuthor(commentId: string) {
  const { actorId } = await requirePanelActor(["admin", "moderator"]);
  const comment = await getCommentTarget(commentId);

  await sendSystemNotification(
    comment.author_id,
    "Yorumun moderasyon incelemesine alındı",
    "Bir yorumun moderasyon ekibi tarafından işaretlendi. Lütfen topluluk kurallarını gözden geçir.",
    { source: "admin_panel", comment_id: commentId, action: "warning" },
  );

  await writeAuditLog(actorId, "report_resolved", "comment", commentId, {
    action: "user_warned",
    target_user_id: comment.author_id,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths("/comments", `/posts/${comment.post_id}`);
  redirect("/comments?result=warned");
}

export async function suspendCommentAuthor(commentId: string) {
  const comment = await getCommentTarget(commentId);
  await setUserModerationState(comment.author_id, "suspend_7d");
  revalidateAdminModerationPaths("/comments", `/users/${comment.author_id}`, `/posts/${comment.post_id}`);
  redirect("/comments?result=suspended");
}

export async function banCommentAuthor(commentId: string) {
  const comment = await getCommentTarget(commentId);
  await setUserModerationState(comment.author_id, "ban_permanent");
  revalidateAdminModerationPaths("/comments", `/users/${comment.author_id}`, `/posts/${comment.post_id}`);
  redirect("/comments?result=banned");
}
