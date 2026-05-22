"use server";

import { redirect } from "next/navigation";
import { addSupportNote, revalidateAdminModerationPaths, setUserModerationState } from "@/lib/admin-moderation";

export async function suspendUserForSevenDays(userId: string) {
  await setUserModerationState(userId, "suspend_7d");
  revalidateAdminModerationPaths(`/users/${userId}`, "/users");
  redirect(`/users/${userId}?result=suspended`);
}

export async function permanentlyBanUser(userId: string) {
  await setUserModerationState(userId, "ban_permanent");
  revalidateAdminModerationPaths(`/users/${userId}`, "/users", "/reports");
  redirect(`/users/${userId}?result=banned`);
}

export async function liftUserBan(userId: string) {
  await setUserModerationState(userId, "unban");
  revalidateAdminModerationPaths(`/users/${userId}`, "/users", "/reports");
  redirect(`/users/${userId}?result=unbanned`);
}

export async function saveSupportNote(userId: string, formData: FormData) {
  const note = String(formData.get("supportNote") ?? "");
  await addSupportNote(userId, note);
  revalidateAdminModerationPaths(`/users/${userId}`, "/users");
  redirect(`/users/${userId}?result=note_saved`);
}
