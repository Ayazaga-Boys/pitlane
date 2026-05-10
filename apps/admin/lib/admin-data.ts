import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { MockPin, MockReport } from "@/lib/mock-data";
import type { BusinessPinRow, ReportRow } from "@/lib/types/database";

export interface AdminDataResult<T> {
  data: T;
  usingMockData: boolean;
}

interface PinRecord extends Pick<BusinessPinRow, "id" | "name" | "category" | "address" | "owner_id" | "created_at" | "is_verified"> {
  owner_profile: {
    username: string | null;
    display_name: string | null;
  } | null;
}

interface ReportRecord extends Pick<ReportRow, "id" | "content_type" | "reason" | "status" | "created_at"> {
  reporter_profile: {
    username: string | null;
    display_name: string | null;
  } | null;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

function mapReason(reason: ReportRow["reason"]): string {
  switch (reason) {
    case "spam":
      return "Spam";
    case "harassment":
      return "Taciz";
    case "inappropriate":
      return "Uygunsuz içerik";
    case "fake":
      return "Sahte içerik";
    default:
      return "Diğer";
  }
}

function shortenId(id: string): string {
  return id.slice(0, 8);
}

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function mapContentType(contentType: ReportRow["content_type"]): MockReport["contentType"] {
  switch (contentType) {
    case "message":
      return "message";
    case "flare":
      return "flare";
    default:
      return "community_post";
  }
}

export async function getAdminPinsOrMock(mockPins: MockPin[]): Promise<AdminDataResult<MockPin[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("business_pins")
      .select("id, name, category, address, owner_id, created_at, is_verified, owner_profile:profiles!business_pins_owner_id_fkey(username, display_name)")
      .order("is_verified", { ascending: true })
      .order("created_at", { ascending: false });

    if (result.error || !result.data) {
      return { data: mockPins, usingMockData: true };
    }

    const data = (result.data as unknown as PinRecord[]).map((pin) => {
      const owner = pin.owner_profile?.display_name ?? pin.owner_profile?.username ?? shortenId(pin.owner_id);
      const mappedPin: MockPin = {
        id: pin.id,
        name: pin.name,
        category: pin.category,
        owner,
        city: pin.address ?? "Adres yok",
        submittedAt: formatDate(pin.created_at),
        status: pin.is_verified ? "verified" : "pending",
      };

      return mappedPin;
    });

    return { data, usingMockData: false };
  } catch {
    return { data: mockPins, usingMockData: true };
  }
}

export async function getAdminReportsOrMock(mockReports: MockReport[]): Promise<AdminDataResult<MockReport[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("reports")
      .select("id, content_type, reason, status, created_at, reporter_profile:profiles!reports_reporter_id_fkey(username, display_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);

    if (result.error || !result.data) {
      return { data: mockReports, usingMockData: true };
    }

    const data = (result.data as unknown as ReportRecord[]).map((report) => {
      const reporter = report.reporter_profile?.username ?? report.reporter_profile?.display_name ?? "anonim";
      const mappedReport: MockReport = {
        id: report.id,
        contentType: mapContentType(report.content_type),
        reason: mapReason(report.reason),
        reporter,
        createdAt: formatDateTime(report.created_at),
        severity:
          report.reason === "harassment"
            ? "high"
            : report.reason === "fake" || report.reason === "inappropriate"
              ? "medium"
              : "low",
        status: report.status === "pending" ? "pending" : "reviewing",
      };

      return mappedReport;
    });

    return { data, usingMockData: false };
  } catch {
    return { data: mockReports, usingMockData: true };
  }
}
