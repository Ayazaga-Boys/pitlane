"use server";

import { redirect } from "next/navigation";
import { revalidateAdminModerationPaths, requireAdminActor, writeAuditLog } from "@/lib/admin-moderation";

async function getOverrideTarget(postId: string) {
  const { adminClient } = await requireAdminActor();
  const result = await adminClient.from("posts").select("id, author_id, caption").eq("id", postId).maybeSingle();
  const post = result.data as { id: string; author_id: string; caption: string | null } | null;

  if (result.error || !post) {
    throw new Error("Post bulunamadı.");
  }

  return post;
}

function getErrorResult(error: unknown) {
  const message = error instanceof Error ? error.message.toLocaleLowerCase("tr-TR") : "";
  if (message.includes("feed_override") || message.includes("relation") || message.includes("schema cache")) {
    return "backend_pending";
  }

  return "failed";
}

async function upsertOverride(postId: string, actionType: "boost" | "shadowban", reason: string) {
  const { actorId, adminClient } = await requireAdminActor();
  const post = await getOverrideTarget(postId);
  const existingResult = await adminClient.from("feed_overrides").select("id").eq("post_id", postId).maybeSingle();
  const existingOverride = existingResult.data as { id: string } | null;

  if (existingResult.error && existingResult.error.code !== "PGRST116") {
    throw new Error(existingResult.error.message);
  }

  const payload = {
    post_id: postId,
    action_type: actionType,
    reason,
    created_by: actorId,
    expires_at: null,
    updated_at: new Date().toISOString(),
  };

  const writeResult = existingResult.data
    ? await adminClient.from("feed_overrides").update(payload as never).eq("id", existingOverride?.id ?? "")
    : await adminClient.from("feed_overrides").insert({ ...payload, created_at: new Date().toISOString() } as never);

  if (writeResult.error) {
    throw new Error(writeResult.error.message);
  }

  await writeAuditLog(actorId, "config_changed", "feed_override", postId, {
    action_type: actionType,
    reason,
    caption: post.caption ?? null,
    source: "admin_panel",
  });
}

export async function applyBoostOverride(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");

  try {
    await upsertOverride(postId, "boost", "Admin panelden manuel feature verildi.");
    revalidateAdminModerationPaths("/feed-overrides", `/posts/${postId}`);
    redirect("/feed-overrides?result=boosted");
  } catch (error) {
    redirect(`/feed-overrides?result=${getErrorResult(error)}`);
  }
}

export async function applyShadowbanOverride(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");

  try {
    await upsertOverride(postId, "shadowban", "Admin panelden manuel shadowban uygulandi.");
    revalidateAdminModerationPaths("/feed-overrides", `/posts/${postId}`);
    redirect("/feed-overrides?result=shadowbanned");
  } catch (error) {
    redirect(`/feed-overrides?result=${getErrorResult(error)}`);
  }
}

export async function clearFeedOverride(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");

  try {
    const { actorId, adminClient } = await requireAdminActor();
    const post = await getOverrideTarget(postId);
    const result = await adminClient.from("feed_overrides").delete().eq("post_id", postId);

    if (result.error) {
      throw new Error(result.error.message);
    }

    await writeAuditLog(actorId, "config_changed", "feed_override", postId, {
      action_type: "cleared",
      caption: post.caption ?? null,
      source: "admin_panel",
    });

    revalidateAdminModerationPaths("/feed-overrides", `/posts/${postId}`);
    redirect("/feed-overrides?result=cleared");
  } catch (error) {
    redirect(`/feed-overrides?result=${getErrorResult(error)}`);
  }
}
