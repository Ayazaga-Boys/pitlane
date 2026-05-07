import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface DashboardStat {
  key: "users" | "flares" | "help" | "pins";
  label: string;
  value: number;
  tone: "brand" | "info" | "warning" | "success";
  detail: string;
}

const mockStats: DashboardStat[] = [
  { key: "users", label: "Toplam Kullanici", value: 1280, tone: "brand", detail: "Mock veri: profiles migration bekleniyor" },
  { key: "flares", label: "Aktif Flare", value: 42, tone: "info", detail: "Canli etkinlik sayisi" },
  { key: "help", label: "Acik Yardim", value: 7, tone: "warning", detail: "Mudahale bekleyen talepler" },
  { key: "pins", label: "Bekleyen Pin", value: 18, tone: "success", detail: "Dogrulama sirasi" },
];

export async function getDashboardStats(): Promise<{ stats: DashboardStat[]; usingMockData: boolean }> {
  const supabase = createServerSupabaseClient();

  const [profilesResult, flaresResult, helpResult, pinsResult] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("flares").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("help_requests").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("business_pins").select("*", { count: "exact", head: true }).eq("is_verified", false),
  ]);

  const hasError =
    Boolean(profilesResult.error) ||
    Boolean(flaresResult.error) ||
    Boolean(helpResult.error) ||
    Boolean(pinsResult.error);

  if (hasError) {
    return { stats: mockStats, usingMockData: true };
  }

  return {
    usingMockData: false,
    stats: [
      {
        key: "users",
        label: "Toplam Kullanici",
        value: profilesResult.count ?? 0,
        tone: "brand",
        detail: "Kayitli profil sayisi",
      },
      {
        key: "flares",
        label: "Aktif Flare",
        value: flaresResult.count ?? 0,
        tone: "info",
        detail: "Durumu active olan flare kayitlari",
      },
      {
        key: "help",
        label: "Acik Yardim",
        value: helpResult.count ?? 0,
        tone: "warning",
        detail: "Status open olan yardim talepleri",
      },
      {
        key: "pins",
        label: "Bekleyen Pin",
        value: pinsResult.count ?? 0,
        tone: "success",
        detail: "Henuz dogrulanmamis isletmeler",
      },
    ],
  };
}
