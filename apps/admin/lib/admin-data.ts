import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { MockPin, MockReport } from "@/lib/mock-data";

export interface AdminDataResult<T> {
  data: T;
  usingMockData: boolean;
}

interface PinRow {
  id: string;
  name: string;
  category: MockPin["category"];
  owner_id: string;
  created_at: string;
  is_verified: boolean;
}

interface ReportRow {
  id: string;
  content_type: "message" | "flare" | "community" | "profile" | "business_pin";
  reason: "spam" | "harassment" | "inappropriate" | "fake" | "other";
  status: "pending" | "reviewed" | "dismissed";
  reporter_id: string;
  created_at: string;
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

export async function getAdminPinsOrMock(mockPins: MockPin[]): Promise<AdminDataResult<MockPin[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("business_pins")
      .select("id, name, category, owner_id, created_at, is_verified")
      .order("is_verified", { ascending: true })
      .order("created_at", { ascending: false });

    if (result.error || !result.data) {
      return { data: mockPins, usingMockData: true };
    }

    const data = (result.data as unknown as PinRow[]).map((pin) => {
      const mappedPin: MockPin = {
        id: pin.id,
        name: pin.name,
        category: pin.category,
        owner: shortenId(pin.owner_id),
        city: "—",
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
      .select("id, content_type, reason, status, reporter_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (result.error || !result.data) {
      return { data: mockReports, usingMockData: true };
    }

    const data = (result.data as unknown as ReportRow[]).map((report) => {
      const mappedReport: MockReport = {
        id: report.id,
        contentType:
          report.content_type === "community" || report.content_type === "profile" || report.content_type === "business_pin"
            ? "community_post"
            : report.content_type,
        reason: mapReason(report.reason),
        reporter: shortenId(report.reporter_id),
        createdAt: formatDate(report.created_at),
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
