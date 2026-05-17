"use server";

import { redirect } from "next/navigation";
import { deleteCommunity, revalidateAdminModerationPaths } from "@/lib/admin-moderation";

export async function deleteCommunityAction(communityId: string) {
  await deleteCommunity(communityId);
  revalidateAdminModerationPaths("/communities");
  redirect("/communities?result=deleted");
}
