export type UserRole = "user" | "moderator" | "admin" | "banned";
export type LocationShareMode = "everyone" | "followers" | "none";

export interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_private: boolean;
  location_share_mode: LocationShareMode;
  ghost_mode: boolean;
  is_verified: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface FollowRow {
  follower_id: string;
  followee_id: string;
  created_at: string;
}

export interface FollowRequestRow {
  id: string;
  requester_id: string;
  target_id: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  created_at: string;
  responded_at: string | null;
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
  helper_id: string | null;
  status: "open" | "matched" | "resolved" | "cancelled";
  issue_type: "breakdown" | "flat_tire" | "fuel" | "accident" | "other";
  description: string | null;
  resolved_at: string | null;
  expires_at: string;
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
  tax_document_key: string | null;
  tax_document_content_type: "application/pdf" | "image/jpeg" | "image/png" | "image/webp" | null;
  verification_status: "not_submitted" | "pending" | "verified" | "rejected";
  verification_submitted_at: string | null;
  verified_at: string | null;
  campaign_text: string | null;
  campaign_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessApplicationRow {
  id: string;
  applicant_id: string;
  business_name: string;
  category: "garage" | "repair" | "parts" | "fuel" | "cafe" | "dealer" | "other";
  description: string | null;
  h3_cell: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string | null;
  website: string | null;
  photo_url: string | null;
  working_hours: Record<string, unknown>;
  status: "pending" | "under_review" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  location_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessLocationRow {
  id: string;
  owner_id: string;
  source_application_id: string | null;
  business_name: string;
  category: "garage" | "repair" | "parts" | "fuel" | "cafe" | "dealer" | "other";
  description: string | null;
  h3_cell: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string | null;
  website: string | null;
  photo_url: string | null;
  working_hours: Record<string, unknown>;
  is_active: boolean;
  featured_rank: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessDocumentRow {
  id: string;
  application_id: string;
  uploader_id: string;
  document_type: "tax_license" | "business_license" | "identity" | "other";
  storage_key: string;
  content_type: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  size_bytes: number;
  status: "pending_upload" | "uploaded" | "rejected";
  created_at: string;
}

export interface ReportRow {
  id: string;
  reporter_id: string;
  content_type: "message" | "flare" | "community" | "profile" | "business_pin" | "post" | "comment";
  content_id: string;
  reason: "spam" | "harassment" | "inappropriate" | "fake" | "other";
  description: string | null;
  status: "pending" | "reviewed" | "dismissed";
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: "none" | "content_deleted" | "user_warned" | "user_banned" | null;
  created_at: string;
}

export interface MessageRow {
  id: string;
  sender_id: string;
  dm_peer_id: string | null;
  community_id: string | null;
  flare_id: string | null;
  body: string;
  media_asset_id: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface MediaAssetRow {
  id: string;
  uploader_id: string;
  asset_type: "image" | "video";
  content_type: string;
  storage_key: string;
  cf_image_id: string | null;
  cf_stream_id: string | null;
  width: number | null;
  height: number | null;
  duration_sec: number | null;
  size_bytes: number | null;
  status: "pending" | "processing" | "ready" | "failed";
  owner_type: "post" | "story" | null;
  owner_id: string | null;
  created_at: string;
}

export interface PostRow {
  id: string;
  author_id: string;
  caption: string | null;
  media_id: string | null;
  visibility: "public" | "followers" | "private";
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoryRow {
  id: string;
  author_id: string;
  media_id: string;
  audience: "public" | "followers" | "private";
  expires_at: string;
  deleted_at: string | null;
  created_at: string;
}

export interface StoryViewRow {
  story_id: string;
  viewer_id: string;
  viewed_at: string;
}

export interface PostDiscoveryScoreRow {
  post_id: string;
  author_id: string;
  author_is_private: boolean;
  visibility: "public" | "followers" | "private";
  created_at: string;
  like_count: number;
  comment_count: number;
  engagement_rate: number;
  recency_decay: number;
  base_score: number;
  refreshed_at: string;
}

export interface FeedOverrideRow {
  id: string;
  post_id: string;
  action_type: "boost" | "shadowban";
  reason: string | null;
  created_by: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: "help_nearby" | "flare_invite" | "message" | "community_invite" | "rsvp_update" | "system";
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface PushDeviceRow {
  id: string;
  user_id: string;
  platform: "ios" | "android";
  token: string;
  app_build: string | null;
  last_seen_at: string;
  created_at: string;
}

export interface RemoteConfigRow {
  key: string;
  value: boolean | number | string | Record<string, unknown> | null;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface InviteCodeRow {
  code: string;
  inviter_id: string | null;
  uses_count: number;
  max_uses: number;
  expires_at: string | null;
  created_at: string;
}

export interface CommunityInviteRow {
  id: string;
  community_id: string;
  creator_id: string;
  link_slug: string | null;
  code: string | null;
  mode: "instant" | "request";
  uses_count: number;
  max_uses: number | null;
  expires_at: string | null;
  created_at: string;
}

export interface CommunityDirectInviteRow {
  id: string;
  community_id: string;
  inviter_id: string;
  invitee_id: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  created_at: string;
  responded_at: string | null;
}

export interface CommunityJoinRequestRow {
  id: string;
  community_id: string;
  requester_id: string;
  source_invite_id: string | null;
  status: "pending" | "accepted" | "rejected" | "canceled";
  created_at: string;
  responded_at: string | null;
}

export interface WaitingListRow {
  id: string;
  email: string;
  vehicle_type: "car" | "motorcycle" | "other" | null;
  city: string | null;
  invited_at: string | null;
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
  role_id: string | null;
  joined_at: string;
}

export interface CommunityRoleRow {
  id: string;
  community_id: string;
  name: string;
  permissions: Record<string, boolean>;
  rank_order: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityEventRow {
  id: string;
  community_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  location_h3: string | null;
  status: "scheduled" | "canceled" | "completed";
  created_at: string;
  updated_at: string;
}

export interface EventRsvpRow {
  event_id: string;
  user_id: string;
  response: "yes" | "maybe" | "no";
  created_at: string;
  updated_at: string;
}

export interface CommunityNeedRow {
  id: string;
  community_id: string;
  creator_id: string;
  type: "parts" | "fuel" | "tools" | "ride_help" | "other";
  urgency_color: "yellow" | "red";
  body: string;
  status: "open" | "resolved" | "closed" | "flagged";
  spam_score?: number | null;
  spam_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_id: string;
  action:
    | "user_banned"
    | "user_unbanned"
    | "content_deleted"
    | "content_restored"
    | "pin_verified"
    | "pin_rejected"
    | "config_changed"
    | "report_resolved";
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
      follows: {
        Row: FollowRow;
        Insert: FollowRow;
        Update: Partial<FollowRow>;
        Relationships: [];
      };
      follow_requests: {
        Row: FollowRequestRow;
        Insert: Partial<FollowRequestRow>;
        Update: Partial<FollowRequestRow>;
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
      business_applications: {
        Row: BusinessApplicationRow;
        Insert: Partial<BusinessApplicationRow> & {
          applicant_id: string;
          business_name: string;
          category: BusinessApplicationRow["category"];
          h3_cell: string;
          latitude: number;
          longitude: number;
          address: string;
        };
        Update: Partial<BusinessApplicationRow>;
        Relationships: [];
      };
      business_locations: {
        Row: BusinessLocationRow;
        Insert: Partial<BusinessLocationRow> & {
          owner_id: string;
          business_name: string;
          category: BusinessLocationRow["category"];
          h3_cell: string;
          latitude: number;
          longitude: number;
          address: string;
        };
        Update: Partial<BusinessLocationRow>;
        Relationships: [];
      };
      business_documents: {
        Row: BusinessDocumentRow;
        Insert: Partial<BusinessDocumentRow> & {
          application_id: string;
          uploader_id: string;
          document_type: BusinessDocumentRow["document_type"];
          storage_key: string;
          content_type: BusinessDocumentRow["content_type"];
          size_bytes: number;
        };
        Update: Partial<BusinessDocumentRow>;
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
      community_needs: {
        Row: CommunityNeedRow;
        Insert: Partial<CommunityNeedRow> & {
          community_id: string;
          creator_id: string;
          type: CommunityNeedRow["type"];
          urgency_color: CommunityNeedRow["urgency_color"];
          body: string;
        };
        Update: Partial<CommunityNeedRow>;
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
      media_assets: {
        Row: MediaAssetRow;
        Insert: Partial<MediaAssetRow> & {
          id: string;
          uploader_id: string;
          asset_type: MediaAssetRow["asset_type"];
          content_type: string;
          storage_key: string;
          status: MediaAssetRow["status"];
        };
        Update: Partial<MediaAssetRow>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Partial<MessageRow> & { id: string; sender_id: string; body: string };
        Update: Partial<MessageRow>;
        Relationships: [];
      };
      posts: {
        Row: PostRow;
        Insert: Partial<PostRow> & { author_id: string };
        Update: Partial<PostRow>;
        Relationships: [];
      };
      comments: {
        Row: CommentRow;
        Insert: Partial<CommentRow> & { post_id: string; author_id: string; body: string };
        Update: Partial<CommentRow>;
        Relationships: [];
      };
      stories: {
        Row: StoryRow;
        Insert: Partial<StoryRow> & { author_id: string; media_id: string; audience: StoryRow["audience"] };
        Update: Partial<StoryRow>;
        Relationships: [];
      };
      story_views: {
        Row: StoryViewRow;
        Insert: StoryViewRow;
        Update: Partial<StoryViewRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow> & { user_id: string; type: NotificationRow["type"]; title: string; body: string };
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      remote_configs: {
        Row: RemoteConfigRow;
        Insert: Partial<RemoteConfigRow> & { key: string; value: RemoteConfigRow["value"] };
        Update: Partial<RemoteConfigRow>;
        Relationships: [];
      };
      invite_codes: {
        Row: InviteCodeRow;
        Insert: Partial<InviteCodeRow> & { code: string };
        Update: Partial<InviteCodeRow>;
        Relationships: [];
      };
      community_invites: {
        Row: CommunityInviteRow;
        Insert: Partial<CommunityInviteRow> & { community_id: string; creator_id: string; mode: CommunityInviteRow["mode"] };
        Update: Partial<CommunityInviteRow>;
        Relationships: [];
      };
      community_direct_invites: {
        Row: CommunityDirectInviteRow;
        Insert: Partial<CommunityDirectInviteRow> & { community_id: string; inviter_id: string; invitee_id: string };
        Update: Partial<CommunityDirectInviteRow>;
        Relationships: [];
      };
      community_join_requests: {
        Row: CommunityJoinRequestRow;
        Insert: Partial<CommunityJoinRequestRow> & { community_id: string; requester_id: string };
        Update: Partial<CommunityJoinRequestRow>;
        Relationships: [];
      };
      waiting_list: {
        Row: WaitingListRow;
        Insert: Partial<WaitingListRow> & { email: string };
        Update: Partial<WaitingListRow>;
        Relationships: [];
      };
      push_devices: {
        Row: PushDeviceRow;
        Insert: Partial<PushDeviceRow> & { id: string; user_id: string; platform: PushDeviceRow["platform"]; token: string };
        Update: Partial<PushDeviceRow>;
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
