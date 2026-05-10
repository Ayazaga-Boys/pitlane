export type UserRole = "user" | "moderator" | "admin";

export interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface FlareRow {
  id: string;
  creator_id: string;
  title: string;
  status: "draft" | "active" | "cancelled" | "completed";
  starts_at: string;
  created_at: string;
}

export interface HelpRequestRow {
  id: string;
  requester_id: string;
  status: "open" | "matched" | "resolved" | "cancelled";
  issue_type: "breakdown" | "flat_tire" | "fuel" | "accident" | "other";
  created_at: string;
}

export interface BusinessPinRow {
  id: string;
  owner_id: string;
  name: string;
  category: "garage" | "repair" | "parts" | "fuel" | "cafe" | "other";
  address: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface ReportRow {
  id: string;
  reporter_id: string;
  content_type: "message" | "flare" | "community" | "profile" | "business_pin";
  content_id: string;
  reason: "spam" | "harassment" | "inappropriate" | "fake" | "other";
  description: string | null;
  status: "pending" | "reviewed" | "dismissed";
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: "none" | "content_deleted" | "user_warned" | "user_banned" | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      flares: {
        Row: FlareRow;
        Insert: Partial<FlareRow> & { id: string; creator_id: string; title: string; status: FlareRow["status"]; starts_at: string };
        Update: Partial<FlareRow>;
        Relationships: [];
      };
      help_requests: {
        Row: HelpRequestRow;
        Insert: Partial<HelpRequestRow> & { id: string; requester_id: string; status: HelpRequestRow["status"]; issue_type: HelpRequestRow["issue_type"] };
        Update: Partial<HelpRequestRow>;
        Relationships: [];
      };
      business_pins: {
        Row: BusinessPinRow;
        Insert: Partial<BusinessPinRow> & {
          id: string;
          owner_id: string;
          name: string;
          category: BusinessPinRow["category"];
          address?: string | null;
          is_active: boolean;
          is_verified: boolean;
        };
        Update: Partial<BusinessPinRow>;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: Partial<ReportRow> & {
          id: string;
          reporter_id: string;
          content_type: ReportRow["content_type"];
          content_id: string;
          reason: ReportRow["reason"];
          status: ReportRow["status"];
        };
        Update: Partial<ReportRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
