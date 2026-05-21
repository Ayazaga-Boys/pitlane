"use server";

import { redirect } from "next/navigation";
import { revalidateAdminModerationPaths, setUserModerationState } from "@/lib/admin-moderation";

export async function suspendCommunityNeedCreator(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  if (!userId) {
    throw new Error("Kullanıcı bulunamadı.");
  }

  await setUserModerationState(userId, "suspend_7d");
  revalidateAdminModerationPaths("/community-needs", "/users", `/users/${userId}`);
  redirect("/community-needs?result=suspended");
}
