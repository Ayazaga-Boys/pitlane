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
  is_active: boolean;
  is_verified: boolean;
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
          is_active: boolean;
          is_verified: boolean;
        };
        Update: Partial<BusinessPinRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
