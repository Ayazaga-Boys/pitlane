export type UserRole = "user" | "moderator" | "admin";

export interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  ghost_mode: boolean;
  is_verified: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface FlareRow {
  id: string;
  creator_id: string;
  community_id: string | null;
  title: string;
  description: string | null;
  rsvp_count: number;
  status: "draft" | "active" | "cancelled" | "ended";
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
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
  h3_cell: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  campaign_text: string | null;
  campaign_ends_at: string | null;
  created_at: string;
  updated_at: string;
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

export interface VehicleRow {
  id: string;
  user_id: string;
  type: "car" | "motorcycle" | "other";
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  photo_url: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface CommunityRow {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  type: "public" | "private" | "secret";
  vehicle_type: "car" | "motorcycle" | "all";
  city: string | null;
  member_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityMemberRow {
  community_id: string;
  user_id: string;
  role: "captain" | "moderator" | "member";
  joined_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_id: string;
  action: "user_banned" | "user_unbanned" | "content_deleted" | "pin_verified" | "pin_rejected" | "config_changed" | "report_resolved";
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
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
          h3_cell: string;
          address?: string | null;
          is_active: boolean;
          is_verified: boolean;
        };
        Update: Partial<BusinessPinRow>;
        Relationships: [];
      };
      vehicles: {
        Row: VehicleRow;
        Insert: Partial<VehicleRow> & { id: string; user_id: string; type: VehicleRow["type"]; make: string; model: string };
        Update: Partial<VehicleRow>;
        Relationships: [];
      };
      communities: {
        Row: CommunityRow;
        Insert: Partial<CommunityRow> & {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          type: CommunityRow["type"];
          vehicle_type: CommunityRow["vehicle_type"];
        };
        Update: Partial<CommunityRow>;
        Relationships: [];
      };
      community_members: {
        Row: CommunityMemberRow;
        Insert: CommunityMemberRow;
        Update: Partial<CommunityMemberRow>;
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
      audit_logs: {
        Row: AuditLogRow;
        Insert: Partial<AuditLogRow> & { actor_id: string; action: AuditLogRow["action"] };
        Update: Partial<AuditLogRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
