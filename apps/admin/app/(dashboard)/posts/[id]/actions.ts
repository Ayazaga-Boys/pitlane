"use server";

import { redirect } from "next/navigation";
import {
  revalidateAdminModerationPaths,
  requirePanelActor,
  sendSystemNotification,
  setUserModerationState,
  writeAuditLog,
} from "@/lib/admin-moderation";

async function getPostTarget(postId: string) {
  const { adminClient } = await requirePanelActor(["admin", "moderator"]);
  const result = await adminClient
    .from("posts")
    .select("id, author_id, caption, media_id, deleted_at")
    .eq("id", postId)
    .maybeSingle();

  const post = result.data as {
    id: string;
    author_id: string;
    caption: string | null;
    media_id: string | null;
    deleted_at: string | null;
  } | null;

  if (result.error || !post) {
    throw new Error("Post bulunamadı.");
  }

  return post;
}

export async function deletePostContent(postId: string) {
  const { actorId, adminClient } = await requirePanelActor(["admin", "moderator"]);
  const post = await getPostTarget(postId);

  if (!post.deleted_at) {
    const deletedAt = new Date().toISOString();
    const updateResult = await adminClient.from("posts").update({ deleted_at: deletedAt } as never).eq("id", postId);
    if (updateResult.error) {
      throw new Error("Post kaldırılamadı.");
    }

    if (post.media_id) {
      await adminClient
        .from("media_assets")
        .update({ owner_type: null, owner_id: null } as never)
        .eq("id", post.media_id);
    }

    await writeAuditLog(actorId, "content_deleted", "post", postId, {
      source: "admin_panel",
      caption: post.caption ?? null,
    });
  }

  revalidateAdminModerationPaths(`/posts/${postId}`, "/posts", "/comments");
  redirect(`/posts/${postId}?result=content_deleted`);
}

export async function restorePostContent(postId: string) {
  const { actorId, adminClient } = await requirePanelActor(["admin", "moderator"]);
  const post = await getPostTarget(postId);

  if (post.deleted_at) {
    const updateResult = await adminClient.from("posts").update({ deleted_at: null } as never).eq("id", postId);
    if (updateResult.error) {
      throw new Error("Post geri yüklenemedi.");
    }

    await writeAuditLog(actorId, "content_restored", "post", postId, {
      source: "admin_panel",
      caption: post.caption ?? null,
    });
  }

  revalidateAdminModerationPaths(`/posts/${postId}`, "/posts", "/comments");
  redirect(`/posts/${postId}?result=content_restored`);
}

export async function warnPostAuthor(postId: string) {
  const { actorId } = await requirePanelActor(["admin", "moderator"]);
  const post = await getPostTarget(postId);

  await sendSystemNotification(
    post.author_id,
    "Postun moderasyon incelemesine alındı",
    "Paylaştığın gönderi moderasyon ekibi tarafından işaretlendi. Lütfen topluluk kurallarını tekrar gözden geçir.",
    { source: "admin_panel", post_id: postId, action: "warning" },
  );

  await writeAuditLog(actorId, "report_resolved", "post", postId, {
    action: "user_warned",
    target_user_id: post.author_id,
    source: "admin_panel",
  });

  revalidateAdminModerationPaths(`/posts/${postId}`, "/posts");
  redirect(`/posts/${postId}?result=warned`);
}

export async function suspendPostAuthor(postId: string) {
  const post = await getPostTarget(postId);
  await setUserModerationState(post.author_id, "suspend_7d");
  revalidateAdminModerationPaths(`/posts/${postId}`, "/posts", `/users/${post.author_id}`);
  redirect(`/posts/${postId}?result=suspended`);
}

export async function banPostAuthor(postId: string) {
  const post = await getPostTarget(postId);
  await setUserModerationState(post.author_id, "ban_permanent");
  revalidateAdminModerationPaths(`/posts/${postId}`, "/posts", `/users/${post.author_id}`);
  redirect(`/posts/${postId}?result=banned`);
}
