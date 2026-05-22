import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { callAdminBackend } from "@/lib/admin-backend";
import type {
  AnalyticsPoint,
  MockCommunity,
  MockCommunityEvent,
  MockCommunityInvite,
  MockBusinessApplication,
  MockBusinessLocation,
  MockCommunityNeed,
  MockCompetition,
  MockFeedOverride,
  MockHelpRequest,
  MockInviteCode,
  MockModerationComment,
  MockModerationPost,
  MockModerationStory,
  MockPin,
  MockCommunityRulesConfig,
  MockExportRequest,
  MockReport,
  MockStatusPage,
  MockSystemNotification,
  MockTrendingPost,
  MockUser,
  MockWaitingListEntry,
} from "@/lib/mock-data";
import type {
  AuditLogRow,
  BusinessApplicationRow,
  BusinessDocumentRow,
  BusinessLocationRow,
  CommunityNeedRow,
  CommunityEventRow,
  CommunityDirectInviteRow,
  CommunityInviteRow,
  CommunityJoinRequestRow,
  BusinessPinRow,
  CommunityMemberRow,
  CommunityRow,
  CommunityRoleRow,
  EventRsvpRow,
  FlareRow,
  FeedOverrideRow,
  FollowRow,
  HelpRequestRow,
  InviteCodeRow,
  LocationShareMode,
  MediaAssetRow,
  MessageRow,
  NotificationRow,
  PostRow,
  PostDiscoveryScoreRow,
  ProfileRow,
  ReportRow,
  RemoteConfigRow,
  StoryRow,
  StoryViewRow,
  UserRole,
  VehicleRow,
  WaitingListRow,
  CommentRow,
} from "@/lib/types/database";

export interface AdminDataResult<T> {
  data: T;
  usingMockData: boolean;
}

export interface AdminPinDetail {
  pin: MockPin;
  ownerUsername: string | null;
  ownerBio: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  createdAtLabel: string;
}

export interface AdminBusinessApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantUsername: string;
  businessName: string;
  category: BusinessApplicationRow["category"];
  status: BusinessApplicationRow["status"];
  address: string;
  phone: string | null;
  website: string | null;
  photoUrl: string | null;
  documentsCount: number;
  hasUploadedDocuments: boolean;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface AdminBusinessApplicationDetail {
  application: AdminBusinessApplication;
  description: string | null;
  h3Cell: string;
  latitude: number;
  longitude: number;
  locationId: string | null;
  reviewerLabel: string | null;
  workingHoursSummary: string;
  documents: Array<{
    id: string;
    type: BusinessDocumentRow["document_type"];
    contentType: BusinessDocumentRow["content_type"];
    sizeLabel: string;
    status: BusinessDocumentRow["status"];
    storageKey: string;
    createdAt: string;
    previewUrl: string | null;
  }>;
}

export interface AdminBusinessLocation {
  id: string;
  ownerId: string;
  ownerName: string;
  businessName: string;
  category: BusinessLocationRow["category"];
  address: string;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  featuredRank: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminCommunityNeed {
  id: string;
  communityId: string;
  communityName: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorStatus: "active" | "suspended";
  type: CommunityNeedRow["type"];
  urgencyColor: CommunityNeedRow["urgency_color"];
  body: string;
  status: CommunityNeedRow["status"];
  createdAt: string;
  createdWithin24h: number;
  flaggedAsSpam: boolean;
  spamScore: number | null;
  spamReason: string | null;
}

export interface AdminCompetitionEntry {
  id: string;
  title: string;
  votes: number;
  flagged: boolean;
  rejectedByAdmin: boolean;
  rejectionReason: string | null;
  rejectedAt: string | null;
}

export interface AdminCompetition {
  id: string;
  communityName: string;
  title: string;
  status: MockCompetition["status"];
  startsAt: string;
  endsAt: string;
  entriesCount: number;
  votesCount: number;
  reportsCount: number;
  suspicious: boolean;
  filtersSummary: string;
  moderationNote: string;
  topEntries: AdminCompetitionEntry[];
  blockedEntriesCount: number;
  adminActionLabel: string | null;
  adminActionAt: string | null;
  votingPaused: boolean;
  canceledByAdmin: boolean;
}

export interface AdminUserDetail {
  user: MockUser;
  supportNotes: Array<{
    id: string;
    note: string;
    createdAt: string;
  }>;
}

export interface AdminReportDetail {
  report: MockReport;
  status: ReportRow["status"];
  actionTaken: ReportRow["action_taken"];
  contentType: ReportRow["content_type"];
  description: string | null;
  reporterLabel: string;
  targetUserId: string | null;
  targetLabel: string;
  contentPreviewTitle: string;
  contentPreviewBody: string;
  severityRecommendation: {
    title: string;
    description: string;
    tone: "info" | "warning" | "error";
    score: number;
    recommendedAction: string;
    signals: string[];
  };
}

export interface AdminAnalyticsData {
  summary: {
    totalProfiles: number;
    totalFlares: number;
    openHelpRequests: number;
    pendingReports: number;
  };
  monthlyActiveUsers: AnalyticsPoint[];
  weeklyFlares: AnalyticsPoint[];
  helpByIssue: AnalyticsPoint[];
  communityGrowth: AnalyticsPoint[];
  helpResponseTimes: AnalyticsPoint[];
  waitingListGrowth: AnalyticsPoint[];
}

export interface AdminAuditEntry {
  id: string;
  createdAt: string;
  actorLabel: string;
  actorRole: UserRole | "unknown";
  action: AuditLogRow["action"];
  targetType: string;
  targetId: string;
  summary: string;
}

export interface AdminSystemNotification {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
}

export interface AdminHelpRequest {
  id: string;
  requesterLabel: string;
  city: string;
  issueType: HelpRequestRow["issue_type"];
  status: HelpRequestRow["status"];
  createdAt: string;
  note: string;
}

export interface AdminRemoteConfig {
  key: string;
  description: string;
  type: "flag" | "number" | "string";
  value: boolean | number | string;
  updatedAt: string | null;
}

export interface AdminInviteCode {
  code: string;
  inviterLabel: string;
  usesCount: number;
  maxUses: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface AdminCommunityInvite {
  id: string;
  communityName: string;
  creatorName: string;
  token: string;
  tokenType: "link" | "code";
  mode: CommunityInviteRow["mode"];
  usesCount: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string;
  status: "active" | "expired" | "revoked";
  suspicious: boolean;
  pendingJoinRequests: number;
  pendingDirectInvites: number;
}

export interface AdminWaitingListEntry {
  id: string;
  email: string;
  vehicleType: "car" | "motorcycle" | "other" | null;
  city: string | null;
  invitedAt: string | null;
  createdAt: string;
}

export interface AdminStatusComponent {
  key: "api" | "realtime" | "push" | "media" | "admin";
  label: string;
  status: "operational" | "degraded" | "partial_outage" | "major_outage";
  note: string;
}

export interface AdminStatusPage {
  publicUrl: string;
  incident: {
    phase: "investigating" | "identified" | "monitoring" | "resolved";
    message: string;
    updatedAt: string;
  };
  components: AdminStatusComponent[];
}

export interface AdminCommunityRulesConfig {
  version: string;
  publishedUrl: string;
  trText: string;
  enText: string;
  updatedAt: string;
}

export interface AdminExportRequest {
  id: string;
  requesterLabel: string;
  channel: "app" | "support";
  status: "queued" | "processing" | "ready" | "expired" | "failed";
  requestedAt: string;
  readyAt: string | null;
  expiresAt: string | null;
}

export interface AdminSupportSearchUser {
  id: string;
  displayName: string;
  username: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: "active" | "suspended";
  createdAt: string;
}

export interface AdminModerationPost {
  id: string;
  authorName: string;
  authorUsername: string;
  authorStatus: "active" | "suspended";
  caption: string;
  visibility: PostRow["visibility"];
  mediaKind: "image" | "video" | "none";
  mediaPreviewUrl: string | null;
  reportsCount: number;
  commentsCount: number;
  latestReportReason: string | null;
  latestReportAt: string | null;
  createdAt: string;
  deletedAt: string | null;
  mediaModeration?: {
    provider: string;
    score: number | null;
    status: "clean" | "review" | "blocked";
    labels: string[];
    reason: string | null;
    flaggedAt: string | null;
  } | null;
}

export interface AdminModerationComment {
  id: string;
  postId: string;
  postCaption: string;
  authorName: string;
  authorUsername: string;
  authorStatus: "active" | "suspended";
  body: string;
  reportsCount: number;
  latestReportReason: string | null;
  latestReportAt: string | null;
  createdAt: string;
  isDeleted: boolean;
}

export interface AdminModerationPostDetail {
  post: AdminModerationPost;
  relatedReports: Array<{
    id: string;
    reason: string;
    reporterLabel: string;
    createdAt: string;
    status: ReportRow["status"];
  }>;
  recentComments: AdminModerationComment[];
}

export interface AdminModerationStory {
  id: string;
  authorName: string;
  authorUsername: string;
  authorStatus: "active" | "suspended";
  audience: StoryRow["audience"];
  mediaKind: "image" | "video";
  mediaPreviewUrl: string | null;
  viewsCount: number;
  expiresAt: string;
  createdAt: string;
  deletedAt: string | null;
  isExpiringSoon: boolean;
}

export interface AdminModerationStoryDetail {
  story: AdminModerationStory;
  viewers: Array<{
    id: string;
    username: string;
    displayName: string;
    viewedAt: string;
  }>;
}

export interface AdminFeedOverride {
  id: string;
  postId: string;
  postCaption: string;
  authorName: string;
  authorUsername: string;
  actionType: FeedOverrideRow["action_type"];
  reason: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface AdminTrendingPost {
  postId: string;
  caption: string;
  authorName: string;
  authorUsername: string;
  visibility: PostRow["visibility"];
  mediaPreviewUrl: string | null;
  score: number;
  engagementRate: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  overrideState: FeedOverrideRow["action_type"] | "none";
}

export interface AdminCommunityEvent {
  id: string;
  communityId: string;
  communityName: string;
  creatorId: string;
  title: string;
  creatorName: string;
  startsAt: string;
  status: CommunityEventRow["status"];
  attendeesYes: number;
  attendeesMaybe: number;
  reportsCount: number;
  suspicious: boolean;
  suspiciousReason: string | null;
  priorityLabel: "kritik" | "incele" | "normal";
}

interface PinRecord
  extends Pick<
    BusinessPinRow,
    "id" | "name" | "category" | "address" | "owner_id" | "created_at" | "is_verified" | "is_active" | "phone" | "website"
  > {
  owner_profile: Pick<ProfileRow, "username" | "display_name" | "bio"> | null;
}

interface ReportRecord extends Pick<ReportRow, "id" | "content_type" | "reason" | "status" | "created_at"> {
  reporter_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface UserRecord
  extends Pick<
    ProfileRow,
    "id" | "username" | "display_name" | "avatar_url" | "bio" | "is_private" | "location_share_mode" | "role" | "created_at" | "updated_at"
  > {}

interface VehicleRecord extends Pick<VehicleRow, "id" | "user_id" | "type" | "make" | "model" | "year" | "is_primary"> {}

interface FollowRecord extends Pick<FollowRow, "follower_id" | "followee_id" | "created_at"> {}

interface FollowProfileRecord extends Pick<ProfileRow, "id" | "username" | "display_name" | "avatar_url" | "is_private"> {}

interface FollowerRelationRecord extends Pick<FollowRow, "created_at"> {
  follower: FollowProfileRecord | null;
}

interface FollowingRelationRecord extends Pick<FollowRow, "created_at"> {
  followee: FollowProfileRecord | null;
}

interface CommunityMembershipRecord extends Pick<CommunityMemberRow, "community_id" | "user_id" | "role"> {
  community: Pick<CommunityRow, "id" | "name" | "city"> | null;
}

interface UserReportRecord extends Pick<ReportRow, "id" | "reason" | "status" | "created_at"> {}

interface ContentReportRecord extends Pick<ReportRow, "id" | "content_id" | "reason" | "status" | "created_at"> {
  reporter_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface SupportNoteRecord extends Pick<AuditLogRow, "id" | "created_at" | "metadata"> {}

interface CommunityRecord
  extends Pick<CommunityRow, "id" | "name" | "slug" | "city" | "member_count" | "type" | "vehicle_type" | "description" | "created_at"> {
  owner_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface CommunityRoleRecord extends Pick<CommunityRoleRow, "id" | "community_id" | "name" | "permissions" | "rank_order" | "created_at"> {}

interface CommunityMemberDetailRecord extends Pick<CommunityMemberRow, "community_id" | "user_id" | "role" | "role_id"> {
  profile: Pick<ProfileRow, "username" | "display_name"> | null;
  community_role: Pick<CommunityRoleRow, "id" | "name" | "permissions" | "rank_order"> | null;
}

interface CommunityFlareRecord extends Pick<FlareRow, "id" | "community_id" | "title" | "starts_at" | "rsvp_count" | "status"> {}

interface CommunityEventRecord extends Pick<CommunityEventRow, "id" | "community_id" | "creator_id" | "title" | "starts_at" | "status"> {
  community: Pick<CommunityRow, "name"> | null;
  creator_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface EventRsvpAggregateRecord extends Pick<EventRsvpRow, "event_id" | "response"> {}

interface ReportDetailRecord
  extends Pick<ReportRow, "id" | "content_type" | "content_id" | "reason" | "status" | "created_at" | "description" | "action_taken"> {
  reporter_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface MessageContentRecord extends Pick<MessageRow, "id" | "sender_id" | "body" | "is_deleted"> {
  sender_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface FlareContentRecord extends Pick<FlareRow, "id" | "creator_id" | "title" | "description" | "status"> {
  creator_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface CommunityContentRecord extends Pick<CommunityRow, "id" | "owner_id" | "name" | "description"> {
  owner_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface BusinessPinContentRecord extends Pick<BusinessPinRow, "id" | "owner_id" | "name" | "address" | "category"> {
  owner_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface BusinessDocumentRecord
  extends Pick<BusinessDocumentRow, "id" | "application_id" | "document_type" | "storage_key" | "content_type" | "size_bytes" | "status" | "created_at"> {}

interface BusinessApplicationRecord
  extends Pick<
    BusinessApplicationRow,
    | "id"
    | "applicant_id"
    | "business_name"
    | "category"
    | "description"
    | "h3_cell"
    | "latitude"
    | "longitude"
    | "address"
    | "phone"
    | "website"
    | "photo_url"
    | "working_hours"
    | "status"
    | "rejection_reason"
    | "reviewer_id"
    | "reviewed_at"
    | "location_id"
    | "created_at"
    | "updated_at"
  > {
  applicant_profile: Pick<ProfileRow, "id" | "username" | "display_name" | "avatar_url"> | null;
  reviewer_profile: Pick<ProfileRow, "id" | "username" | "display_name"> | null;
  business_documents: BusinessDocumentRecord[] | null;
}

interface BusinessLocationRecord
  extends Pick<
    BusinessLocationRow,
    | "id"
    | "owner_id"
    | "business_name"
    | "category"
    | "address"
    | "latitude"
    | "longitude"
    | "photo_url"
    | "featured_rank"
    | "is_active"
    | "created_at"
  > {
  owner_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface CommunityNeedRecord
  extends Pick<CommunityNeedRow, "id" | "community_id" | "creator_id" | "type" | "urgency_color" | "body" | "status" | "created_at"> {
  community: Pick<CommunityRow, "name"> | null;
  creator_profile: Pick<ProfileRow, "username" | "display_name" | "role"> | null;
  spam_score?: number | null;
  spam_reason?: string | null;
}

interface BackendCompetitionListItem {
  id?: string;
  title?: string | null;
  status?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string | null;
  community_id?: string | null;
  community?: { name?: string | null } | null;
  entries_count?: number | null;
  votes_count?: number | null;
  reports_count?: number | null;
  suspicious?: boolean | null;
  filters_summary?: string | null;
  moderation_note?: string | null;
}

interface BackendCompetitionEntryItem {
  id?: string;
  title?: string | null;
  caption?: string | null;
  votes_count?: number | null;
  votes?: number | null;
  report_count?: number | null;
  suspicious?: boolean | null;
  status?: string | null;
  rejected_reason?: string | null;
  created_at?: string | null;
}

interface ProfileContentRecord extends Pick<ProfileRow, "id" | "username" | "display_name" | "bio"> {}

interface PostContentRecord extends Pick<PostRow, "id" | "author_id" | "caption" | "visibility" | "deleted_at"> {}

interface CommentContentPreviewRecord extends Pick<CommentRow, "id" | "post_id" | "author_id" | "body" | "is_deleted"> {}

interface AuditLogRecord extends Pick<AuditLogRow, "id" | "created_at" | "action" | "target_type" | "target_id" | "metadata"> {
  actor_profile: Pick<ProfileRow, "username" | "display_name" | "role"> | null;
}

interface NotificationRecord extends Pick<NotificationRow, "id" | "title" | "body" | "data" | "created_at" | "type"> {}
interface RemoteConfigRecord extends Pick<RemoteConfigRow, "key" | "value" | "description" | "updated_at"> {}
interface HelpRequestRecord extends Pick<HelpRequestRow, "id" | "issue_type" | "status" | "created_at"> {
  requester_profile: Pick<ProfileRow, "username" | "display_name" | "bio"> | null;
}
interface InviteCodeRecord extends Pick<InviteCodeRow, "code" | "uses_count" | "max_uses" | "expires_at" | "created_at"> {
  inviter_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface CommunityInviteRecord
  extends Pick<CommunityInviteRow, "id" | "community_id" | "creator_id" | "link_slug" | "code" | "mode" | "uses_count" | "max_uses" | "expires_at" | "created_at"> {
  community: Pick<CommunityRow, "name"> | null;
  creator_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface DirectInviteRecord extends Pick<CommunityDirectInviteRow, "community_id" | "status"> {}

interface JoinRequestRecord extends Pick<CommunityJoinRequestRow, "community_id" | "source_invite_id" | "status"> {}
type WaitingListRecord = Pick<WaitingListRow, "id" | "email" | "vehicle_type" | "city" | "invited_at" | "created_at">;

interface MediaAssetRecord extends Pick<MediaAssetRow, "id" | "asset_type" | "storage_key" | "cf_image_id" | "cf_stream_id" | "status"> {
  [key: string]: unknown;
}

interface PostRecord extends Pick<PostRow, "id" | "author_id" | "caption" | "visibility" | "deleted_at" | "created_at" | "updated_at"> {
  author_profile: Pick<ProfileRow, "username" | "display_name" | "avatar_url" | "role"> | null;
  media: MediaAssetRecord | null;
}

interface CommentRecord extends Pick<CommentRow, "id" | "post_id" | "author_id" | "body" | "is_deleted" | "created_at" | "updated_at"> {
  author_profile: Pick<ProfileRow, "username" | "display_name" | "role"> | null;
  post: Pick<PostRow, "id" | "caption" | "deleted_at"> | null;
}

interface StoryRecord extends Pick<StoryRow, "id" | "author_id" | "audience" | "expires_at" | "deleted_at" | "created_at"> {
  author_profile: Pick<ProfileRow, "username" | "display_name" | "role"> | null;
  media: MediaAssetRecord | null;
}

interface StoryViewRecord extends Pick<StoryViewRow, "story_id" | "viewer_id" | "viewed_at"> {
  viewer: Pick<ProfileRow, "id" | "username" | "display_name"> | null;
}

interface FeedOverrideRecord extends Pick<FeedOverrideRow, "id" | "post_id" | "action_type" | "reason" | "expires_at" | "created_at" | "updated_at"> {
  post: PostRecord | null;
}

interface DiscoverScoreRecord
  extends Pick<
    PostDiscoveryScoreRow,
    "post_id" | "author_id" | "author_is_private" | "visibility" | "created_at" | "like_count" | "comment_count" | "engagement_rate" | "base_score" | "refreshed_at"
  > {}

const defaultStatusComponents: AdminStatusComponent[] = [
  { key: "api", label: "API", status: "operational", note: "Servis yanıt süreleri normal." },
  { key: "realtime", label: "Realtime", status: "operational", note: "WebSocket bağlantıları stabil." },
  { key: "push", label: "Push Bildirimleri", status: "operational", note: "Bildirim akışı normal." },
  { key: "media", label: "Medya Hattı", status: "operational", note: "Görsel/video işleme kuyruğu açık." },
  { key: "admin", label: "Admin Panel", status: "operational", note: "Giriş ve yönetim ekranları erişilebilir." },
];

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
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

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

function formatAuditAction(action: AuditLogRow["action"]) {
  switch (action) {
    case "user_banned":
      return "Kullanıcı banlandı";
    case "user_unbanned":
      return "Kullanıcı banı kaldırıldı";
    case "content_deleted":
      return "İçerik silindi";
    case "content_restored":
      return "İçerik geri yüklendi";
    case "pin_verified":
      return "Pin doğrulandı";
    case "pin_rejected":
      return "Pin reddedildi";
    case "config_changed":
      return "Yapılandırma değişti";
    case "report_resolved":
      return "Şikayet çözüldü";
    default:
      return action;
  }
}

function summarizeAuditMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata) {
    return "Ek metadata bulunmuyor.";
  }

  if (typeof metadata.note === "string" && metadata.note.length > 0) {
    return metadata.note;
  }

  if (typeof metadata.mode === "string") {
    return `Moderasyon modu: ${metadata.mode}`;
  }

  if (typeof metadata.action === "string") {
    if (metadata.action === "business_approved") {
      const businessName = typeof metadata.business_name === "string" ? metadata.business_name : "İşletme";
      return `${businessName} başvurusu onaylandı.`;
    }
    if (metadata.action === "business_rejected") {
      const businessName = typeof metadata.business_name === "string" ? metadata.business_name : "İşletme";
      return `${businessName} başvurusu reddedildi${typeof metadata.reason === "string" ? `: ${metadata.reason}` : "."}`;
    }
    if (metadata.action === "competition_canceled") {
      return `Yarışma iptal edildi${typeof metadata.reason === "string" ? `: ${metadata.reason}` : "."}`;
    }
    if (metadata.action === "competition_voting_paused") {
      return `Yarışma oylaması durduruldu${typeof metadata.reason === "string" ? `: ${metadata.reason}` : "."}`;
    }
    if (metadata.action === "competition_entry_rejected") {
      const title = typeof metadata.entry_title === "string" ? metadata.entry_title : "Entry";
      return `${title} katılımı reddedildi${typeof metadata.reason === "string" ? `: ${metadata.reason}` : "."}`;
    }
    if (metadata.action === "event_canceled") {
      const title = typeof metadata.title === "string" ? metadata.title : "Etkinlik";
      return `${title} iptal edildi${typeof metadata.reason === "string" ? `: ${metadata.reason}` : "."}`;
    }
    if (metadata.action === "user_warned") {
      return "Kullanıcıya uyarı bildirimi gönderildi.";
    }
    if (metadata.action === "community_deleted") {
      const name = typeof metadata.name === "string" ? metadata.name : "Topluluk";
      return `${name} silindi.`;
    }
    if (metadata.action === "cleared") {
      return "Override temizlendi.";
    }
    if (metadata.action === "boost" || metadata.action === "shadowban") {
      return `Feed override: ${metadata.action}`;
    }
    return `Aksiyon: ${metadata.action}`;
  }

  if (typeof metadata.reason === "string") {
    return `Neden: ${metadata.reason}`;
  }

  if (typeof metadata.source === "string") {
    return `Kaynak: ${metadata.source}`;
  }

  return "Metadata kaydı var, ancak kısa özet üretilemedi.";
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(date);
}

function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(date);
}

function formatIssueType(issueType: HelpRequestRow["issue_type"]) {
  switch (issueType) {
    case "breakdown":
      return "Arıza";
    case "flat_tire":
      return "Lastik";
    case "fuel":
      return "Yakıt";
    case "accident":
      return "Kaza";
    default:
      return "Diğer";
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildRecentMonthBuckets(monthCount: number): AnalyticsPoint[] {
  const now = new Date();
  return Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (monthCount - index - 1), 1);
    return { label: monthLabel(date), value: 0 };
  });
}

function buildRecentDayBuckets(dayCount: number): AnalyticsPoint[] {
  const now = startOfDay(new Date());
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (dayCount - index - 1));
    return { label: weekdayLabel(date), value: 0 };
  });
}

function incrementBucketByMonth(points: AnalyticsPoint[], value: string) {
  const target = startOfMonth(new Date(value));
  const label = monthLabel(target);
  const bucket = points.find((point) => point.label === label);
  if (bucket) {
    bucket.value += 1;
  }
}

function incrementBucketByDay(points: AnalyticsPoint[], value: string) {
  const target = startOfDay(new Date(value));
  const label = weekdayLabel(target);
  const bucket = points.find((point) => point.label === label);
  if (bucket) {
    bucket.value += 1;
  }
}

function shortenId(id: string): string {
  return id.slice(0, 8);
}

function unwrapBackendData<T>(payload: unknown): T | null {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return ((payload as Record<string, unknown>).data as T) ?? null;
  }

  return (payload as T) ?? null;
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

type CompetitionAuditAction = "competition_canceled" | "competition_voting_paused" | "competition_entry_rejected";

interface CompetitionAuditOverrideState {
  competitionActions: Map<
    string,
    {
      action: Exclude<CompetitionAuditAction, "competition_entry_rejected">;
      reason: string | null;
      createdAt: string;
    }
  >;
  rejectedEntries: Map<
    string,
    Map<
      string,
      {
        reason: string | null;
        createdAt: string;
      }
    >
  >;
}

function buildAdminCompetitionFromMock(
  competition: MockCompetition,
  overrides: CompetitionAuditOverrideState,
): AdminCompetition {
  return applyCompetitionOverrides(
    {
      id: competition.id,
      communityName: competition.communityName,
      title: competition.title,
      status: competition.status,
      startsAt: competition.startsAt,
      endsAt: competition.endsAt,
      entriesCount: competition.entriesCount,
      votesCount: competition.votesCount,
      reportsCount: competition.reportsCount,
      suspicious: competition.suspicious,
      filtersSummary: competition.filtersSummary,
      moderationNote: competition.moderationNote,
      topEntries: competition.topEntries.map((entry) => ({
        ...entry,
        rejectedByAdmin: false,
        rejectionReason: null,
        rejectedAt: null,
      })),
      blockedEntriesCount: 0,
      adminActionLabel: null,
      adminActionAt: null,
      votingPaused: false,
      canceledByAdmin: false,
    },
    overrides,
  );
}

function applyCompetitionOverrides(
  competition: AdminCompetition,
  overrides: CompetitionAuditOverrideState,
): AdminCompetition {
  const latestAction = overrides.competitionActions.get(competition.id);
  const rejectedEntries = overrides.rejectedEntries.get(competition.id) ?? new Map();
  const topEntries: AdminCompetitionEntry[] = competition.topEntries.map((entry) => {
    const rejectedState = rejectedEntries.get(entry.id);
    if (!rejectedState) {
      return entry;
    }

    return {
      ...entry,
      rejectedByAdmin: true,
      rejectionReason: rejectedState.reason ?? entry.rejectionReason ?? null,
      rejectedAt: formatDateTime(rejectedState.createdAt),
    };
  });

  const moderationNotes = [competition.moderationNote];
  if (latestAction?.action === "competition_canceled") {
    moderationNotes.push(latestAction.reason ? `Admin iptal notu: ${latestAction.reason}` : "Admin bu yarışmayı operasyon kararıyla iptal etti.");
  }
  if (latestAction?.action === "competition_voting_paused") {
    moderationNotes.push(latestAction.reason ? `Oylama durdurma notu: ${latestAction.reason}` : "Admin şüpheli oy akışı nedeniyle oylamayı geçici olarak durdurdu.");
  }
  if (rejectedEntries.size > 0) {
    moderationNotes.push(`${rejectedEntries.size} entry admin override ile reddedildi.`);
  }

  let adminActionLabel = competition.adminActionLabel;
  if (latestAction?.action === "competition_canceled") {
    adminActionLabel = "admin iptal etti";
  } else if (latestAction?.action === "competition_voting_paused") {
    adminActionLabel = "oylama durduruldu";
  } else if (!adminActionLabel && rejectedEntries.size > 0) {
    adminActionLabel = `${rejectedEntries.size} entry reddedildi`;
  }

  return {
    ...competition,
    status: latestAction?.action === "competition_canceled" ? "canceled" : competition.status,
    suspicious: competition.suspicious || latestAction?.action === "competition_voting_paused" || rejectedEntries.size > 0,
    moderationNote: moderationNotes.filter(Boolean).join(" "),
    topEntries,
    blockedEntriesCount: Math.max(competition.blockedEntriesCount, rejectedEntries.size),
    adminActionLabel,
    adminActionAt: latestAction ? formatDateTime(latestAction.createdAt) : competition.adminActionAt,
    votingPaused: competition.votingPaused || latestAction?.action === "competition_voting_paused",
    canceledByAdmin: competition.canceledByAdmin || latestAction?.action === "competition_canceled",
  };
}

async function getCompetitionAuditOverrides(competitionIds: string[]): Promise<CompetitionAuditOverrideState> {
  const emptyState: CompetitionAuditOverrideState = {
    competitionActions: new Map(),
    rejectedEntries: new Map(),
  };

  if (competitionIds.length === 0) {
    return emptyState;
  }

  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("audit_logs")
      .select("id, created_at, target_type, target_id, metadata")
      .in("target_type", ["competition", "competition_entry"])
      .order("created_at", { ascending: false })
      .limit(250);

    if (result.error || !result.data) {
      return emptyState;
    }

    const competitionIdSet = new Set(competitionIds);

    for (const entry of result.data as Array<Pick<AuditLogRow, "id" | "created_at" | "target_type" | "target_id" | "metadata">>) {
      const metadata = entry.metadata as Record<string, unknown> | null;
      const action = metadata?.action;

      if (entry.target_type === "competition" && entry.target_id && competitionIdSet.has(entry.target_id)) {
        if (
          (action === "competition_canceled" || action === "competition_voting_paused") &&
          !emptyState.competitionActions.has(entry.target_id)
        ) {
          emptyState.competitionActions.set(entry.target_id, {
            action,
            reason: typeof metadata?.reason === "string" ? metadata.reason : null,
            createdAt: entry.created_at,
          });
        }
      }

      if (entry.target_type === "competition_entry" && entry.target_id && action === "competition_entry_rejected") {
        const competitionId = typeof metadata?.competition_id === "string" ? metadata.competition_id : null;
        if (!competitionId || !competitionIdSet.has(competitionId)) {
          continue;
        }

        const rejectedEntries = emptyState.rejectedEntries.get(competitionId) ?? new Map();
        if (!rejectedEntries.has(entry.target_id)) {
          rejectedEntries.set(entry.target_id, {
            reason: typeof metadata?.reason === "string" ? metadata.reason : null,
            createdAt: entry.created_at,
          });
          emptyState.rejectedEntries.set(competitionId, rejectedEntries);
        }
      }
    }

    return emptyState;
  } catch {
    return emptyState;
  }
}

function mapReportStatus(status: ReportRow["status"]): MockUser["reportHistory"][number]["status"] {
  if (status === "dismissed") {
    return "resolved";
  }

  if (status === "reviewed") {
    return "reviewing";
  }

  return "pending";
}

function mapContentType(contentType: ReportRow["content_type"]): MockReport["contentType"] {
  switch (contentType) {
    case "message":
      return "message";
    case "flare":
      return "flare";
    case "post":
      return "post";
    case "comment":
      return "comment";
    default:
      return "community_post";
  }
}

function mapPinStatus(pin: Pick<BusinessPinRow, "is_verified" | "is_active">): MockPin["status"] {
  if (pin.is_verified) {
    return "verified";
  }

  if (!pin.is_active) {
    return "rejected";
  }

  return "pending";
}

function mapBusinessCategory(category: BusinessApplicationRow["category"]): string {
  switch (category) {
    case "garage":
      return "Garaj";
    case "repair":
      return "Tamir";
    case "parts":
      return "Parça";
    case "fuel":
      return "Yakıt";
    case "cafe":
      return "Kafe";
    case "dealer":
      return "Galeri";
    default:
      return "Diğer";
  }
}

function normalizeCompetitionStatus(value: string | null | undefined): AdminCompetition["status"] {
  if (value === "voting" || value === "completed" || value === "canceled") {
    return value;
  }

  return "draft";
}

function mapCompetitionEntryFromBackend(entry: BackendCompetitionEntryItem): AdminCompetitionEntry | null {
  if (!entry.id) {
    return null;
  }

  const rejected = entry.status === "rejected";
  return {
    id: entry.id,
    title: entry.title ?? entry.caption ?? "İsimsiz entry",
    votes: entry.votes_count ?? entry.votes ?? 0,
    flagged: Boolean(entry.suspicious) || (entry.report_count ?? 0) > 0,
    rejectedByAdmin: rejected,
    rejectionReason: rejected ? entry.rejected_reason ?? "Entry admin tarafından reddedildi." : null,
    rejectedAt: rejected && entry.created_at ? formatDateTime(entry.created_at) : null,
  };
}

function mapCompetitionFromBackend(
  competition: BackendCompetitionListItem,
  entries: BackendCompetitionEntryItem[] = [],
): AdminCompetition | null {
  if (!competition.id) {
    return null;
  }

  const topEntries = entries.map(mapCompetitionEntryFromBackend).filter((entry): entry is AdminCompetitionEntry => Boolean(entry));
  const blockedEntriesCount = topEntries.filter((entry) => entry.rejectedByAdmin).length;
  const reportsCount = competition.reports_count ?? topEntries.filter((entry) => entry.flagged).length;
  const suspicious = Boolean(competition.suspicious) || reportsCount > 0;

  return {
    id: competition.id,
    communityName: competition.community?.name ?? (competition.community_id ? shortenId(competition.community_id) : "Topluluk yok"),
    title: competition.title ?? "Yarışma",
    status: normalizeCompetitionStatus(competition.status),
    startsAt: formatDateTime(competition.starts_at ?? competition.created_at ?? new Date().toISOString()),
    endsAt: competition.ends_at ? formatDateTime(competition.ends_at) : "Belirtilmedi",
    entriesCount: competition.entries_count ?? topEntries.length,
    votesCount: competition.votes_count ?? topEntries.reduce((total, entry) => total + entry.votes, 0),
    reportsCount,
    suspicious,
    filtersSummary: competition.filters_summary ?? "Backend yarışma kontratı aktif.",
    moderationNote: competition.moderation_note ?? (suspicious ? "Şüpheli yarışma sinyali var. Entry ve oy akışı incelenmeli." : "Yarışma akışı normal görünüyor."),
    topEntries,
    blockedEntriesCount,
    adminActionLabel: blockedEntriesCount > 0 ? `${blockedEntriesCount} entry reddedildi` : null,
    adminActionAt: null,
    votingPaused: false,
    canceledByAdmin: competition.status === "canceled",
  };
}

function summarizeWorkingHours(workingHours: Record<string, unknown> | null | undefined): string {
  if (!workingHours || Object.keys(workingHours).length === 0) {
    return "Çalışma saati bilgisi girilmemiş.";
  }

  const entries = Object.entries(workingHours)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .slice(0, 3)
    .map(([day, value]) => `${day}: ${value}`);

  return entries.length > 0 ? entries.join(" · ") : "Çalışma saati formatı hazır değil.";
}

function mapUserRole(role: ProfileRow["role"]): MockUser["role"] {
  return role === "admin" || role === "moderator" ? role : "user";
}

function mapVehicleType(type: VehicleRow["type"]): MockUser["vehicles"][number]["type"] {
  return type === "car" || type === "motorcycle" ? type : "other";
}

function mapCommunityType(type: CommunityRow["type"]): MockCommunity["type"] {
  return type === "private" || type === "secret" ? type : "public";
}

function mapCommunityVehicleType(type: CommunityRow["vehicle_type"]): MockCommunity["vehicleType"] {
  return type === "car" || type === "motorcycle" ? type : "all";
}

function mapFlareStatus(status: FlareRow["status"]): MockCommunity["activeFlares"][number]["status"] {
  if (status === "draft") {
    return "draft";
  }

  if (status === "cancelled") {
    return "cancelled";
  }

  return "active";
}

function profileLabel(profile: Pick<ProfileRow, "username" | "display_name"> | null, fallback: string): string {
  return profile?.display_name ?? profile?.username ?? fallback;
}

function deriveSupportNote(user: UserRecord, memberships: CommunityMembershipRecord[], reportCount: number): string {
  const communityCount = memberships.length;
  if (user.role === "admin") {
    return "Panel erişimi aktif. Kritik aksiyonlar için audit log kaydı bekleniyor.";
  }
  if (reportCount > 0) {
    return `Bu kullanıcı için ${reportCount} moderasyon kaydı bulundu. Aksiyon öncesi rapor geçmişi tekrar gözden geçirilmeli.`;
  }
  if (communityCount > 0) {
    return `${communityCount} topluluk üyeliği bulundu. Şu an dikkat gerektiren açık moderasyon notu görünmüyor.`;
  }

  return "Bu kullanıcı için ek destek notu bulunmuyor. Ayrıntılı CM notları daha sonra audit entegrasyonuyla eklenecek.";
}

function deriveModerationNote(community: CommunityRecord, memberCount: number, activeFlareCount: number): string {
  if (activeFlareCount > 0) {
    return `Toplulukta ${activeFlareCount} aktif flare kaydı var. Moderasyon öncesi rota ve RSVP akışı birlikte gözden geçirilmeli.`;
  }
  if (memberCount > 100) {
    return "Üye sayısı yüksek. İçerik akışı yoğun olduğundan kaptan ve moderatör rolleri düzenli izlenmeli.";
  }

  return "Topluluk akışı sakin görünüyor. Şu an ek moderasyon riski işareti bulunmuyor.";
}

function deriveUserStatus(role: UserRole): MockUser["status"] {
  return role === "banned" ? "suspended" : "active";
}

function deriveReportSeverity(reason: ReportRow["reason"]): MockReport["severity"] {
  return reason === "harassment" ? "high" : reason === "fake" || reason === "inappropriate" ? "medium" : "low";
}

function hasProfanitySignal(text: string) {
  const normalized = (text ?? "").toLocaleLowerCase("tr-TR");
  return ["gerizekali", "aptal", "salak", "siktir", "orospu", "rezil ederim"].some((token) => normalized.includes(token));
}

function deriveSeverityRecommendation(input: {
  reason: ReportRow["reason"];
  contentType: ReportRow["content_type"];
  contentPreviewBody: string;
  priorReportsCount: number;
  targetStatus: "active" | "suspended" | "unknown";
}): AdminReportDetail["severityRecommendation"] {
  const signals: string[] = [];
  let score = 0;

  switch (input.reason) {
    case "harassment":
      score += 55;
      signals.push("Taciz / kişisel saldırı kategorisi");
      break;
    case "fake":
      score += 35;
      signals.push("Yanıltıcı veya sahte içerik bildirimi");
      break;
    case "inappropriate":
      score += 32;
      signals.push("Topluluk kurallarına aykırı içerik");
      break;
    case "spam":
      score += 18;
      signals.push("Spam / tekrar içerik paterni");
      break;
    default:
      score += 12;
      signals.push("Manuel değerlendirme gerektiren kategori");
      break;
  }

  if (input.contentType === "message") {
    score += 12;
    signals.push("İhlal özel mesaj veya sohbet akışında geçti");
  } else if (input.contentType === "flare") {
    score += 8;
    signals.push("İhlal etkinlik / flare akışını etkiliyor");
  } else if (input.contentType === "community") {
    score += 6;
    signals.push("İhlal topluluk görünürlüğünü etkiliyor");
  }

  if (hasProfanitySignal(input.contentPreviewBody)) {
    score += 15;
    signals.push("Metinde doğrudan küfür / tehdit tonu algılandı");
  }

  if (input.priorReportsCount >= 3) {
    score += 20;
    signals.push(`Kullanıcı hakkında ${input.priorReportsCount} geçmiş moderasyon kaydı var`);
  } else if (input.priorReportsCount > 0) {
    score += 10;
    signals.push(`Kullanıcı hakkında ${input.priorReportsCount} önceki rapor bulundu`);
  }

  if (input.targetStatus === "suspended") {
    score += 12;
    signals.push("Kullanıcı zaten askıda / daha önce moderasyon görmüş");
  }

  const boundedScore = Math.min(score, 100);

  if (boundedScore >= 80) {
    return {
      title: "Kritik risk",
      description: "Yüksek zarar potansiyeli ve tekrar sinyali var. İçerik silme ile birlikte kalıcı ban veya en az 7 günlük suspend ilk tercih olmalı.",
      tone: "error",
      score: boundedScore,
      recommendedAction: "İçeriği sil + kalıcı banı değerlendir",
      signals,
    };
  }

  if (boundedScore >= 55) {
    return {
      title: "Yüksek risk",
      description: "İhlal güçlü ve moderasyon kaydı tekrara işaret ediyor. İçerik kaldırma ve 7 gün suspend / sert uyarı akışı önerilir.",
      tone: "error",
      score: boundedScore,
      recommendedAction: "İçeriği sil + 7 gün suspend uygula",
      signals,
    };
  }

  if (boundedScore >= 30) {
    return {
      title: "Orta risk",
      description: "İhlal doğrulanırsa kullanıcıyı uyarma ve gerekirse içeriği kaldırma yeterli olabilir; tekrar kontrolü önemli.",
      tone: "warning",
      score: boundedScore,
      recommendedAction: "Önce uyar, gerekirse içeriği kaldır",
      signals,
    };
  }

  return {
    title: "Düşük risk",
    description: "Sinyaller sınırlı görünüyor. Manuel inceleme sonrası uyarı veya dismiss kararı verilebilir.",
    tone: "info",
    score: boundedScore,
    recommendedAction: "Manuel incele, gerekirse dismiss et",
    signals,
  };
}

function toMockPin(pin: PinRecord): MockPin {
  return {
    id: pin.id,
    name: pin.name,
    category: pin.category,
    owner: profileLabel(pin.owner_profile, shortenId(pin.owner_id)),
    city: pin.address ?? "Adres yok",
    submittedAt: formatDate(pin.created_at),
    status: mapPinStatus(pin),
  };
}

function mapBusinessApplication(application: BusinessApplicationRecord): AdminBusinessApplication {
  return {
    id: application.id,
    applicantId: application.applicant_id,
    applicantName: profileLabel(application.applicant_profile, shortenId(application.applicant_id)),
    applicantUsername: application.applicant_profile?.username ?? shortenId(application.applicant_id),
    businessName: application.business_name,
    category: application.category,
    status: application.status,
    address: application.address,
    phone: application.phone,
    website: application.website,
    photoUrl: application.photo_url,
    documentsCount: application.business_documents?.length ?? 0,
    hasUploadedDocuments: (application.business_documents ?? []).some((document) => document.status === "uploaded"),
    createdAt: formatDateTime(application.created_at),
    reviewedAt: application.reviewed_at ? formatDateTime(application.reviewed_at) : null,
    rejectionReason: application.rejection_reason,
  };
}

function mapBusinessApplicationDetail(application: BusinessApplicationRecord): AdminBusinessApplicationDetail {
  return {
    application: mapBusinessApplication(application),
    description: application.description,
    h3Cell: application.h3_cell,
    latitude: application.latitude,
    longitude: application.longitude,
    locationId: application.location_id,
    reviewerLabel: profileLabel(application.reviewer_profile, "") || null,
    workingHoursSummary: summarizeWorkingHours(application.working_hours),
    documents: (application.business_documents ?? []).map((document) => ({
      id: document.id,
      type: document.document_type,
      contentType: document.content_type,
      sizeLabel: formatBytes(document.size_bytes),
      status: document.status,
      storageKey: document.storage_key,
      createdAt: formatDateTime(document.created_at),
      previewUrl: null,
    })),
  };
}

function mapBusinessLocation(location: BusinessLocationRecord): AdminBusinessLocation {
  return {
    id: location.id,
    ownerId: location.owner_id,
    ownerName: profileLabel(location.owner_profile, shortenId(location.owner_id)),
    businessName: location.business_name,
    category: location.category,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    photoUrl: location.photo_url,
    featuredRank: location.featured_rank,
    isActive: location.is_active,
    createdAt: formatDateTime(location.created_at),
  };
}

function mapCommunityNeed(
  need: CommunityNeedRecord,
  createdWithin24h: number,
): AdminCommunityNeed {
  const flaggedByStatus = need.status === "flagged";
  const spamScore = typeof need.spam_score === "number" ? need.spam_score : null;
  const spamReason = typeof need.spam_reason === "string" && need.spam_reason.trim().length > 0 ? need.spam_reason : null;

  return {
    id: need.id,
    communityId: need.community_id,
    communityName: need.community?.name ?? shortenId(need.community_id),
    creatorId: need.creator_id,
    creatorName: profileLabel(need.creator_profile, shortenId(need.creator_id)),
    creatorUsername: need.creator_profile?.username ?? shortenId(need.creator_id),
    creatorStatus: deriveActorStatus(need.creator_profile?.role),
    type: need.type,
    urgencyColor: need.urgency_color,
    body: need.body,
    status: need.status,
    createdAt: formatDateTime(need.created_at),
    createdWithin24h,
    flaggedAsSpam: flaggedByStatus || createdWithin24h >= 5,
    spamScore,
    spamReason,
  };
}

function buildMockUser(
  user: UserRecord,
  vehicles: VehicleRecord[],
  memberships: CommunityMembershipRecord[],
  reportHistory: UserReportRecord[],
  supportNote: string | null,
  followersCount = 0,
  followingCount = 0,
  followers: MockUser["followers"] = [],
  following: MockUser["following"] = [],
): MockUser {
  const displayName = user.display_name ?? user.username ?? shortenId(user.id);
  const username = user.username ?? user.id.slice(0, 8);
  const city = memberships.find((membership) => membership.community?.city)?.community?.city ?? "Belirtilmedi";

  return {
    id: user.id,
    username,
    displayName,
    role: mapUserRole(user.role),
    avatarUrl: user.avatar_url,
    isPrivate: user.is_private,
    followersCount,
    followingCount,
    locationShareMode: mapLocationShareMode(user.location_share_mode),
    city,
    reports: reportHistory.length,
    createdAt: formatDate(user.created_at),
    status: deriveUserStatus(user.role),
    bio: user.bio ?? "Profil biyografisi henüz girilmemiş.",
    phone: "Kayıtlı değil",
    lastSeenAt: formatDateTime(user.updated_at),
    supportNote: supportNote ?? deriveSupportNote(user, memberships, reportHistory.length),
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id,
      type: mapVehicleType(vehicle.type),
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year ?? 0,
      isPrimary: vehicle.is_primary,
    })),
    communities: memberships.map((membership) => ({
      id: membership.community_id,
      name: membership.community?.name ?? shortenId(membership.community_id),
      role: membership.role,
    })),
    reportHistory: reportHistory.map((report) => ({
      id: report.id,
      reason: mapReason(report.reason),
      status: mapReportStatus(report.status),
      createdAt: formatDateTime(report.created_at),
    })),
    followers,
    following,
  };
}

function mapLocationShareMode(mode: LocationShareMode | null | undefined): MockUser["locationShareMode"] {
  if (mode === "followers" || mode === "none") {
    return mode;
  }

  return "everyone";
}

function buildUserFollowRelation(profile: FollowProfileRecord | null, createdAt: string): MockUser["followers"][number] | null {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    username: profile.username ?? shortenId(profile.id),
    displayName: profile.display_name ?? profile.username ?? shortenId(profile.id),
    avatarUrl: profile.avatar_url,
    isPrivate: Boolean(profile.is_private),
    followedAt: formatDateTime(createdAt),
  };
}

function deriveActorStatus(role: UserRole | null | undefined): "active" | "suspended" {
  return role === "banned" ? "suspended" : "active";
}

function resolveMediaPreviewUrl(media: MediaAssetRecord | null): string | null {
  if (!media) {
    return null;
  }

  if (media.storage_key.startsWith("http://") || media.storage_key.startsWith("https://")) {
    return media.storage_key;
  }

  return null;
}

function readNumberCandidate(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readStringCandidate(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function readBooleanCandidate(source: Record<string, unknown>, keys: string[]): boolean {
  for (const key of keys) {
    if (source[key] === true) {
      return true;
    }
  }

  return false;
}

function readLabelsCandidate(source: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
    }
    if (typeof value === "string" && value.trim().length > 0) {
      return value
        .split(/[;,]/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function normalizeModerationStatus(value: string | null, score: number | null, hasManualFlag: boolean) {
  const normalized = value?.toLocaleLowerCase("tr-TR") ?? null;

  if (normalized) {
    if (["blocked", "reject", "rejected", "removed", "unsafe", "deny"].includes(normalized)) {
      return "blocked" as const;
    }
    if (["review", "flagged", "flag", "pending_review", "manual_review", "needs_review"].includes(normalized)) {
      return "review" as const;
    }
    if (["clean", "approved", "safe", "ready"].includes(normalized)) {
      return "clean" as const;
    }
  }

  if (hasManualFlag) {
    return "review" as const;
  }

  if (score !== null) {
    if (score >= 0.9) return "blocked" as const;
    if (score >= 0.6) return "review" as const;
    return "clean" as const;
  }

  return null;
}

function resolveMediaModerationSignal(
  media: MediaAssetRecord | null,
): AdminModerationPost["mediaModeration"] {
  if (!media) {
    return null;
  }

  const raw = media as Record<string, unknown>;
  const score = readNumberCandidate(raw, [
    "moderation_score",
    "moderationScore",
    "cloudflare_moderation_score",
    "cf_moderation_score",
    "safety_score",
    "ai_score",
  ]);
  const labels = readLabelsCandidate(raw, [
    "moderation_labels",
    "moderationLabels",
    "cloudflare_moderation_labels",
    "flags",
    "categories",
  ]);
  const reason = readStringCandidate(raw, [
    "moderation_reason",
    "moderationReason",
    "moderation_summary",
    "review_reason",
  ]);
  const provider = readStringCandidate(raw, ["moderation_provider", "moderationProvider"]) ?? (score !== null || labels.length > 0 ? "cloudflare_images" : null);
  const flaggedAt = readStringCandidate(raw, ["moderation_flagged_at", "moderationFlaggedAt", "reviewed_at"]);
  const hasManualFlag = readBooleanCandidate(raw, ["moderation_flagged", "flagged_by_moderation", "requires_review", "is_flagged"]);
  const status = normalizeModerationStatus(
    readStringCandidate(raw, ["moderation_status", "moderationStatus", "safety_status", "review_status"]),
    score,
    hasManualFlag,
  );

  if (!provider && score === null && labels.length === 0 && !reason && !flaggedAt && !status) {
    return null;
  }

  return {
    provider: provider ?? "cloudflare_images",
    score,
    status: status ?? "review",
    labels,
    reason,
    flaggedAt: flaggedAt ? formatDateTime(flaggedAt) : null,
  };
}

function mapModerationPost(
  post: PostRecord,
  reports: ContentReportRecord[],
  commentsCount: number,
): AdminModerationPost {
  const latestReport = reports
    .slice()
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];

  return {
    id: post.id,
    authorName: profileLabel(post.author_profile, shortenId(post.author_id)),
    authorUsername: post.author_profile?.username ?? shortenId(post.author_id),
    authorStatus: deriveActorStatus(post.author_profile?.role),
    caption: post.caption ?? "Caption girilmemiş.",
    visibility: post.visibility,
    mediaKind: post.media?.asset_type ?? "none",
    mediaPreviewUrl: resolveMediaPreviewUrl(post.media),
    reportsCount: reports.length,
    commentsCount,
    latestReportReason: latestReport ? mapReason(latestReport.reason) : null,
    latestReportAt: latestReport ? formatDateTime(latestReport.created_at) : null,
    createdAt: formatDateTime(post.created_at),
    deletedAt: post.deleted_at ? formatDateTime(post.deleted_at) : null,
    mediaModeration: resolveMediaModerationSignal(post.media),
  };
}

function mapModerationComment(comment: CommentRecord, reports: ContentReportRecord[]): AdminModerationComment {
  const latestReport = reports
    .slice()
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];

  return {
    id: comment.id,
    postId: comment.post_id,
    postCaption: comment.post?.caption ?? "Post caption bulunamadı.",
    authorName: profileLabel(comment.author_profile, shortenId(comment.author_id)),
    authorUsername: comment.author_profile?.username ?? shortenId(comment.author_id),
    authorStatus: deriveActorStatus(comment.author_profile?.role),
    body: comment.body,
    reportsCount: reports.length,
    latestReportReason: latestReport ? mapReason(latestReport.reason) : null,
    latestReportAt: latestReport ? formatDateTime(latestReport.created_at) : null,
    createdAt: formatDateTime(comment.created_at),
    isDeleted: comment.is_deleted,
  };
}

function isExpiringSoon(expiresAt: string) {
  return new Date(expiresAt).getTime() - Date.now() <= 2 * 60 * 60 * 1000;
}

function mapModerationStory(story: StoryRecord, viewsCount: number): AdminModerationStory {
  return {
    id: story.id,
    authorName: profileLabel(story.author_profile, shortenId(story.author_id)),
    authorUsername: story.author_profile?.username ?? shortenId(story.author_id),
    authorStatus: deriveActorStatus(story.author_profile?.role),
    audience: story.audience,
    mediaKind: story.media?.asset_type ?? "image",
    mediaPreviewUrl: resolveMediaPreviewUrl(story.media),
    viewsCount,
    expiresAt: formatDateTime(story.expires_at),
    createdAt: formatDateTime(story.created_at),
    deletedAt: story.deleted_at ? formatDateTime(story.deleted_at) : null,
    isExpiringSoon: !story.deleted_at && isExpiringSoon(story.expires_at),
  };
}

function mapFeedOverride(override: FeedOverrideRecord): AdminFeedOverride {
  return {
    id: override.id,
    postId: override.post_id,
    postCaption: override.post?.caption ?? "Post caption bulunamadı.",
    authorName: profileLabel(override.post?.author_profile ?? null, shortenId(override.post?.author_id ?? override.post_id)),
    authorUsername: override.post?.author_profile?.username ?? shortenId(override.post?.author_id ?? override.post_id),
    actionType: override.action_type,
    reason: override.reason ?? "Neden girilmedi.",
    expiresAt: override.expires_at ? formatDateTime(override.expires_at) : null,
    createdAt: formatDateTime(override.created_at),
  };
}

function mapTrendingPost(
  score: DiscoverScoreRecord,
  post: PostRecord | null,
  overrideState: AdminTrendingPost["overrideState"],
): AdminTrendingPost {
  return {
    postId: score.post_id,
    caption: post?.caption ?? "Caption girilmemiş.",
    authorName: profileLabel(post?.author_profile ?? null, shortenId(score.author_id)),
    authorUsername: post?.author_profile?.username ?? shortenId(score.author_id),
    visibility: score.visibility,
    mediaPreviewUrl: resolveMediaPreviewUrl(post?.media ?? null),
    score: Number(Number(score.base_score).toFixed(3)),
    engagementRate: Number(Number(score.engagement_rate).toFixed(3)),
    likeCount: score.like_count,
    commentCount: score.comment_count,
    createdAt: formatDateTime(score.created_at),
    overrideState,
  };
}

function buildMockCommunity(
  community: CommunityRecord,
  memberList: CommunityMemberDetailRecord[],
  activeFlares: CommunityFlareRecord[],
  roleDefinitions: CommunityRoleRecord[] = [],
): MockCommunity {
  const captain =
    profileLabel(
      memberList.find((member) => member.role === "captain")?.profile ?? community.owner_profile,
      shortenId(community.id),
    );

  return {
    id: community.id,
    name: community.name,
    slug: community.slug,
    city: community.city ?? "Belirtilmedi",
    members: community.member_count,
    type: mapCommunityType(community.type),
    vehicleType: mapCommunityVehicleType(community.vehicle_type),
    description: community.description ?? "Topluluk açıklaması bulunmuyor.",
    foundedAt: formatDate(community.created_at),
    captain,
    moderationNote: deriveModerationNote(community, memberList.length, activeFlares.length),
    customRoles: roleDefinitions
      .slice()
      .sort((left, right) => left.rank_order - right.rank_order)
      .map((role) => ({
        id: role.id,
        name: role.name,
        rankOrder: role.rank_order,
        permissions: Object.entries(role.permissions ?? {})
          .filter(([, enabled]) => Boolean(enabled))
          .map(([permission]) => permission),
        assignedCount: memberList.filter((member) => member.role_id === role.id).length,
      })),
    memberList: memberList.map((member) => ({
      id: member.user_id,
      name: profileLabel(member.profile, shortenId(member.user_id)),
      role: member.role,
      assignedRole: member.community_role?.name ?? null,
    })),
    activeFlares: activeFlares.map((flare) => ({
      id: flare.id,
      title: flare.title,
      startsAt: formatDateTime(flare.starts_at),
      rsvpCount: flare.rsvp_count,
      status: mapFlareStatus(flare.status),
    })),
  };
}

function mapCommunityEvent(
  event: CommunityEventRecord,
  rsvpCounts: { yes: number; maybe: number },
): AdminCommunityEvent {
  const reportsCount = rsvpCounts.yes >= 80 ? 2 : rsvpCounts.yes >= 50 ? 1 : 0;
  const suspicious = event.status === "scheduled" && rsvpCounts.yes >= 50 && reportsCount >= 1;
  const suspiciousReason =
    suspicious && rsvpCounts.yes >= 80
      ? "Yüksek RSVP hacmi ve rapor sinyali birlikte yükseldi."
      : suspicious
        ? "Katılım eşiği aşıldı ve event rapor sinyali üretti."
        : rsvpCounts.yes >= 50
          ? "Katılım yüksek, ancak rapor sinyali henüz düşük."
          : null;
  const priorityLabel: AdminCommunityEvent["priorityLabel"] =
    suspicious && rsvpCounts.yes >= 80 ? "kritik" : suspicious ? "incele" : "normal";

  return {
    id: event.id,
    communityId: event.community_id,
    communityName: event.community?.name ?? shortenId(event.community_id),
    creatorId: event.creator_id,
    title: event.title,
    creatorName: profileLabel(event.creator_profile, shortenId(event.creator_id)),
    startsAt: formatDateTime(event.starts_at),
    status: event.status,
    attendeesYes: rsvpCounts.yes,
    attendeesMaybe: rsvpCounts.maybe,
    reportsCount,
    suspicious,
    suspiciousReason,
    priorityLabel,
  };
}

function mapCommunityInviteStatus(invite: CommunityInviteRecord): AdminCommunityInvite["status"] {
  if (invite.max_uses !== null && invite.uses_count >= invite.max_uses) {
    return "revoked";
  }

  if (invite.expires_at && Date.parse(invite.expires_at) <= Date.now()) {
    return "expired";
  }

  return "active";
}

function mapCommunityInvite(
  invite: CommunityInviteRecord,
  pendingJoinRequests: number,
  pendingDirectInvites: number,
): AdminCommunityInvite {
  const status = mapCommunityInviteStatus(invite);
  const suspicious = status === "active" && (invite.mode === "request" ? pendingJoinRequests >= 3 : invite.uses_count >= 25);

  return {
    id: invite.id,
    communityName: invite.community?.name ?? shortenId(invite.community_id),
    creatorName: profileLabel(invite.creator_profile, shortenId(invite.creator_id)),
    token: invite.link_slug ?? invite.code ?? shortenId(invite.id),
    tokenType: invite.link_slug ? "link" : "code",
    mode: invite.mode,
    usesCount: invite.uses_count,
    maxUses: invite.max_uses,
    expiresAt: invite.expires_at ? formatDateTime(invite.expires_at) : null,
    createdAt: formatDateTime(invite.created_at),
    status,
    suspicious,
    pendingJoinRequests,
    pendingDirectInvites,
  };
}

export async function getAdminPinsOrMock(mockPins: MockPin[]): Promise<AdminDataResult<MockPin[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("business_pins")
      .select(
        "id, name, category, address, owner_id, created_at, is_verified, is_active, phone, website, owner_profile:profiles!business_pins_owner_id_fkey(username, display_name, bio)",
      )
      .order("is_verified", { ascending: true })
      .order("created_at", { ascending: false });

    if (result.error || !result.data) {
      return { data: mockPins, usingMockData: true };
    }

    return {
      data: (result.data as unknown as PinRecord[]).map(toMockPin),
      usingMockData: false,
    };
  } catch {
    return { data: mockPins, usingMockData: true };
  }
}

export async function getAdminPinDetailOrMock(id: string, mockPins: MockPin[]): Promise<AdminDataResult<AdminPinDetail | null>> {
  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("business_pins")
      .select(
        "id, name, category, address, owner_id, created_at, is_verified, is_active, phone, website, owner_profile:profiles!business_pins_owner_id_fkey(username, display_name, bio)",
      )
      .eq("id", id)
      .maybeSingle();

    if (result.error || !result.data) {
      const mockPin = mockPins.find((pin) => pin.id === id);
      if (!mockPin) {
        return { data: null, usingMockData: true };
      }

      return {
        data: {
          pin: mockPin,
          ownerUsername: null,
          ownerBio: null,
          address: mockPin.city,
          phone: null,
          website: null,
          createdAtLabel: mockPin.submittedAt,
        },
        usingMockData: true,
      };
    }

    const pin = result.data as unknown as PinRecord;
    return {
      data: {
        pin: toMockPin(pin),
        ownerUsername: pin.owner_profile?.username ?? null,
        ownerBio: pin.owner_profile?.bio ?? null,
        address: pin.address,
        phone: pin.phone,
        website: pin.website,
        createdAtLabel: formatDateTime(pin.created_at),
      },
      usingMockData: false,
    };
  } catch {
    const mockPin = mockPins.find((pin) => pin.id === id);
    if (!mockPin) {
      return { data: null, usingMockData: true };
    }

    return {
      data: {
        pin: mockPin,
        ownerUsername: null,
        ownerBio: null,
        address: mockPin.city,
        phone: null,
        website: null,
        createdAtLabel: mockPin.submittedAt,
      },
      usingMockData: true,
    };
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
      const severity: MockReport["severity"] =
        report.reason === "harassment"
          ? "high"
          : report.reason === "fake" || report.reason === "inappropriate"
            ? "medium"
            : "low";
      const status: MockReport["status"] = report.status === "pending" ? "pending" : "reviewing";

      return {
        id: report.id,
        contentType: mapContentType(report.content_type),
        reason: mapReason(report.reason),
        reporter: report.reporter_profile?.username ?? report.reporter_profile?.display_name ?? "anonim",
        createdAt: formatDateTime(report.created_at),
        severity,
        status,
      };
    });

    if (data.length === 0) {
      return { data: mockReports, usingMockData: true };
    }

    return { data, usingMockData: false };
  } catch {
    return { data: mockReports, usingMockData: true };
  }
}

export async function getAdminAnalyticsOrMock(mockAnalytics: {
  mau: AnalyticsPoint[];
  flares: AnalyticsPoint[];
  help: AnalyticsPoint[];
  communities: AnalyticsPoint[];
  helpResponseTimes: AnalyticsPoint[];
  waitingListGrowth: AnalyticsPoint[];
}): Promise<AdminDataResult<AdminAnalyticsData>> {
  const fallback: AdminAnalyticsData = {
    summary: {
      totalProfiles: 0,
      totalFlares: 0,
      openHelpRequests: 0,
      pendingReports: 0,
    },
    monthlyActiveUsers: mockAnalytics.mau,
    weeklyFlares: mockAnalytics.flares,
    helpByIssue: mockAnalytics.help,
    communityGrowth: mockAnalytics.communities,
    helpResponseTimes: mockAnalytics.helpResponseTimes,
    waitingListGrowth: mockAnalytics.waitingListGrowth,
  };

  try {
    const supabase = createAdminSupabaseClient();
    const fiveMonthsAgo = startOfMonth(new Date());
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 4);
    const sevenDaysAgo = startOfDay(new Date());
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [
      profilesCountResult,
      flaresCountResult,
      helpCountResult,
      reportsCountResult,
      profilesActivityResult,
      flaresActivityResult,
      helpIssueResult,
      communitiesGrowthResult,
      helpResolutionResult,
      waitingListGrowthResult,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("flares").select("id", { count: "exact", head: true }),
      supabase.from("help_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("updated_at").gte("updated_at", fiveMonthsAgo.toISOString()),
      supabase.from("flares").select("created_at").gte("created_at", sevenDaysAgo.toISOString()),
      supabase.from("help_requests").select("issue_type").eq("status", "open"),
      supabase.from("communities").select("created_at").gte("created_at", fiveMonthsAgo.toISOString()),
      supabase.from("help_requests").select("created_at, resolved_at").not("resolved_at", "is", null),
      supabase.from("waiting_list").select("created_at").gte("created_at", fiveMonthsAgo.toISOString()),
    ]);

    if (
      profilesCountResult.error ||
      flaresCountResult.error ||
      helpCountResult.error ||
      reportsCountResult.error ||
      profilesActivityResult.error ||
      flaresActivityResult.error ||
      helpIssueResult.error ||
      communitiesGrowthResult.error ||
      helpResolutionResult.error ||
      waitingListGrowthResult.error
    ) {
      return { data: fallback, usingMockData: true };
    }

    const monthlyActiveUsers = buildRecentMonthBuckets(5);
    for (const row of (profilesActivityResult.data as Array<Pick<ProfileRow, "updated_at">>) ?? []) {
      incrementBucketByMonth(monthlyActiveUsers, row.updated_at);
    }

    const weeklyFlares = buildRecentDayBuckets(7);
    for (const row of (flaresActivityResult.data as Array<Pick<FlareRow, "created_at">>) ?? []) {
      incrementBucketByDay(weeklyFlares, row.created_at);
    }

    const helpByIssueSeed: Record<HelpRequestRow["issue_type"], number> = {
      breakdown: 0,
      flat_tire: 0,
      fuel: 0,
      accident: 0,
      other: 0,
    };
    for (const row of (helpIssueResult.data as Array<Pick<HelpRequestRow, "issue_type">>) ?? []) {
      helpByIssueSeed[row.issue_type] += 1;
    }
    const helpByIssue: AnalyticsPoint[] = [
      { label: "Ariza", value: helpByIssueSeed.breakdown },
      { label: "Lastik", value: helpByIssueSeed.flat_tire },
      { label: "Yakit", value: helpByIssueSeed.fuel },
      { label: "Kaza", value: helpByIssueSeed.accident },
      { label: "Diger", value: helpByIssueSeed.other },
    ];

    const communityGrowth = buildRecentMonthBuckets(5);
    for (const row of (communitiesGrowthResult.data as Array<Pick<CommunityRow, "created_at">>) ?? []) {
      incrementBucketByMonth(communityGrowth, row.created_at);
    }

    const helpResponseHours = buildRecentMonthBuckets(5);
    const helpResponseCounts = buildRecentMonthBuckets(5);
    for (const row of
      ((helpResolutionResult.data as Array<Pick<HelpRequestRow, "created_at" | "resolved_at">>) ?? []).filter(
        (entry): entry is Pick<HelpRequestRow, "created_at" | "resolved_at"> & { resolved_at: string } => Boolean(entry.resolved_at),
      )) {
      const resolvedMonthLabel = monthLabel(new Date(row.resolved_at));
      const target = helpResponseHours.find((entry) => entry.label === resolvedMonthLabel);
      const counter = helpResponseCounts.find((entry) => entry.label === resolvedMonthLabel);
      if (!target || !counter) {
        continue;
      }

      const diffMs = new Date(row.resolved_at).getTime() - new Date(row.created_at).getTime();
      const diffHours = Math.max(Math.round(diffMs / (1000 * 60 * 60)), 0);
      target.value += diffHours;
      counter.value += 1;
    }

    const helpResponseTimes = helpResponseHours.map((entry, index) => ({
      label: entry.label,
      value: helpResponseCounts[index]?.value ? Math.round(entry.value / helpResponseCounts[index].value) : 0,
    }));

    const waitingListGrowth = buildRecentMonthBuckets(5);
    for (const row of (waitingListGrowthResult.data as Array<Pick<WaitingListRow, "created_at">>) ?? []) {
      incrementBucketByMonth(waitingListGrowth, row.created_at);
    }

    return {
      data: {
        summary: {
          totalProfiles: profilesCountResult.count ?? 0,
          totalFlares: flaresCountResult.count ?? 0,
          openHelpRequests: helpCountResult.count ?? 0,
          pendingReports: reportsCountResult.count ?? 0,
        },
        monthlyActiveUsers,
        weeklyFlares,
        helpByIssue,
        communityGrowth,
        helpResponseTimes,
        waitingListGrowth,
      },
      usingMockData: false,
    };
  } catch {
    return { data: fallback, usingMockData: true };
  }
}

export async function getAdminAuditLogsOrMock(mockEntries: AdminAuditEntry[]): Promise<AdminDataResult<AdminAuditEntry[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("audit_logs")
      .select("id, created_at, action, target_type, target_id, metadata, actor_profile:profiles!audit_logs_actor_id_fkey(username, display_name, role)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (result.error || !result.data) {
      return { data: mockEntries, usingMockData: true };
    }

    const data = (result.data as unknown as AuditLogRecord[]).map((entry) => ({
      id: entry.id,
      createdAt: formatDateTime(entry.created_at),
      actorLabel: profileLabel(entry.actor_profile, "Bilinmeyen admin"),
      actorRole: (entry.actor_profile?.role ?? "unknown") as AdminAuditEntry["actorRole"],
      action: entry.action,
      targetType: entry.target_type ?? "unknown",
      targetId: entry.target_id ?? "-",
      summary: summarizeAuditMetadata(entry.metadata),
    }));

    if (data.length === 0) {
      return { data: mockEntries, usingMockData: true };
    }

    return { data, usingMockData: false };
  } catch {
    return { data: mockEntries, usingMockData: true };
  }
}

export async function getAdminSystemNotificationsOrMock(
  mockEntries: MockSystemNotification[],
): Promise<AdminDataResult<AdminSystemNotification[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("notifications")
      .select("id, title, body, data, created_at, type")
      .eq("type", "system")
      .order("created_at", { ascending: false })
      .limit(20);

    if (result.error || !result.data) {
      return { data: mockEntries, usingMockData: true };
    }

    const data = (result.data as unknown as NotificationRecord[]).map((entry) => ({
      id: entry.id,
      title: entry.title,
      body: entry.body,
      audience: typeof entry.data?.audience_label === "string" ? entry.data.audience_label : "Bilinmeyen segment",
      createdAt: formatDateTime(entry.created_at),
    }));

    if (data.length === 0) {
      return { data: mockEntries, usingMockData: true };
    }

    return { data, usingMockData: false };
  } catch {
    return { data: mockEntries, usingMockData: true };
  }
}

export async function getAdminRemoteConfigsOrMock(
  mockFlags: Array<{ key: string; description: string; enabled: boolean }>,
): Promise<AdminDataResult<AdminRemoteConfig[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase.from("remote_configs").select("key, value, description, updated_at").order("key");

    if (result.error || !result.data) {
      return {
        data: mockFlags.map((flag) => ({
          key: flag.key,
          description: flag.description,
          type: "flag",
          value: flag.enabled,
          updatedAt: null,
        })),
        usingMockData: true,
      };
    }

    const data = (result.data as unknown as RemoteConfigRecord[]).map((entry) => {
      const rawValue = entry.value;
      let type: AdminRemoteConfig["type"] = "string";
      let value: boolean | number | string = "";

      if (typeof rawValue === "boolean") {
        type = "flag";
        value = rawValue;
      } else if (typeof rawValue === "number") {
        type = "number";
        value = rawValue;
      } else if (typeof rawValue === "string") {
        type = entry.key.includes("feature_") ? "flag" : entry.key.includes("max_") ? "number" : "string";
        value =
          type === "flag"
            ? rawValue === "true"
            : type === "number"
              ? Number(rawValue)
              : rawValue;
      } else {
        type = "string";
        value = JSON.stringify(rawValue ?? "");
      }

      return {
        key: entry.key,
        description: entry.description ?? "Açıklama yok",
        type,
        value,
        updatedAt: entry.updated_at ? formatDateTime(entry.updated_at) : null,
      };
    });

    if (data.length === 0) {
      return {
        data: mockFlags.map((flag) => ({
          key: flag.key,
          description: flag.description,
          type: "flag",
          value: flag.enabled,
          updatedAt: null,
        })),
        usingMockData: true,
      };
    }

    return { data, usingMockData: false };
  } catch {
    return {
      data: mockFlags.map((flag) => ({
        key: flag.key,
        description: flag.description,
        type: "flag",
        value: flag.enabled,
        updatedAt: null,
      })),
      usingMockData: true,
    };
  }
}

export async function getAdminHelpRequestsOrMock(
  mockEntries: MockHelpRequest[],
): Promise<AdminDataResult<AdminHelpRequest[]>> {
  const toMockResult = () => ({
    data: mockEntries.map((entry) => ({
      id: entry.id,
      requesterLabel: entry.requester,
      city: entry.city,
      issueType: entry.issueType,
      status: entry.status,
      createdAt: entry.createdAt,
      note: entry.note,
    })),
    usingMockData: true,
  });

  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("help_requests")
      .select("id, issue_type, status, created_at, requester_profile:profiles!help_requests_requester_id_fkey(username, display_name, bio)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (result.error || !result.data) {
      return toMockResult();
    }

    const data = (result.data as unknown as HelpRequestRecord[]).map((entry) => ({
      id: entry.id,
      requesterLabel: profileLabel(entry.requester_profile, "Bilinmeyen kullanıcı"),
      city: entry.requester_profile?.bio ? "Profil notundan bak" : "Bilinmiyor",
      issueType: entry.issue_type,
      status: entry.status,
      createdAt: formatDateTime(entry.created_at),
      note: `${formatIssueType(entry.issue_type)} talebi ${entry.status === "open" ? "aktif" : "kayıtlı"} durumda.`,
    }));

    if (data.length === 0) {
      return toMockResult();
    }

    return { data, usingMockData: false };
  } catch {
    return toMockResult();
  }
}

export async function getAdminInviteCodesOrMock(
  mockEntries: MockInviteCode[],
): Promise<AdminDataResult<AdminInviteCode[]>> {
  const toMockResult = () => ({
    data: mockEntries.map((entry) => ({
      code: entry.code,
      inviterLabel: entry.inviterLabel,
      usesCount: entry.usesCount,
      maxUses: entry.maxUses,
      expiresAt: entry.expiresAt,
      createdAt: entry.createdAt,
    })),
    usingMockData: true,
  });

  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("invite_codes")
      .select("code, uses_count, max_uses, expires_at, created_at, inviter_profile:profiles!invite_codes_inviter_id_fkey(username, display_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (result.error || !result.data) {
      return toMockResult();
    }

    const data = (result.data as unknown as InviteCodeRecord[]).map((entry) => ({
      code: entry.code,
      inviterLabel: profileLabel(entry.inviter_profile, "Admin havuzu"),
      usesCount: entry.uses_count,
      maxUses: entry.max_uses,
      expiresAt: entry.expires_at ? formatDateTime(entry.expires_at) : null,
      createdAt: formatDateTime(entry.created_at),
    }));

    if (data.length === 0) {
      return toMockResult();
    }

    return { data, usingMockData: false };
  } catch {
    return toMockResult();
  }
}

export async function getAdminCommunityInvitesOrMock(
  mockEntries: MockCommunityInvite[],
): Promise<AdminDataResult<AdminCommunityInvite[]>> {
  const toMockResult = () => ({
    data: mockEntries.map((entry) => ({
      id: entry.id,
      communityName: entry.communityName,
      creatorName: entry.creatorName,
      token: entry.token,
      tokenType: entry.tokenType,
      mode: entry.mode,
      usesCount: entry.usesCount,
      maxUses: entry.maxUses,
      expiresAt: entry.expiresAt,
      createdAt: entry.createdAt,
      status: entry.status,
      suspicious: entry.suspicious,
      pendingJoinRequests: entry.pendingJoinRequests,
      pendingDirectInvites: entry.pendingDirectInvites,
    })),
    usingMockData: true,
  });

  try {
    const supabase = createAdminSupabaseClient();
    const [invitesResult, joinRequestsResult, directInvitesResult] = await Promise.all([
      supabase
        .from("community_invites")
        .select(
          "id, community_id, creator_id, link_slug, code, mode, uses_count, max_uses, expires_at, created_at, community:communities(name), creator_profile:profiles!community_invites_creator_id_fkey(username, display_name)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("community_join_requests").select("community_id, source_invite_id, status").eq("status", "pending"),
      supabase.from("community_direct_invites").select("community_id, status").eq("status", "pending"),
    ]);

    if (invitesResult.error || joinRequestsResult.error || directInvitesResult.error || !invitesResult.data || !joinRequestsResult.data || !directInvitesResult.data) {
      return toMockResult();
    }

    const joinCountsByInvite = new Map<string, number>();
    for (const request of joinRequestsResult.data as unknown as JoinRequestRecord[]) {
      if (!request.source_invite_id) continue;
      joinCountsByInvite.set(request.source_invite_id, (joinCountsByInvite.get(request.source_invite_id) ?? 0) + 1);
    }

    const directCountsByCommunity = new Map<string, number>();
    for (const invite of directInvitesResult.data as unknown as DirectInviteRecord[]) {
      directCountsByCommunity.set(invite.community_id, (directCountsByCommunity.get(invite.community_id) ?? 0) + 1);
    }

    const data = (invitesResult.data as unknown as CommunityInviteRecord[]).map((invite) =>
      mapCommunityInvite(
        invite,
        joinCountsByInvite.get(invite.id) ?? 0,
        directCountsByCommunity.get(invite.community_id) ?? 0,
      ),
    );

    if (data.length === 0) {
      return toMockResult();
    }

    return { data, usingMockData: false };
  } catch {
    return toMockResult();
  }
}

export async function getAdminWaitingListOrMock(
  mockEntries: MockWaitingListEntry[],
): Promise<AdminDataResult<AdminWaitingListEntry[]>> {
  const toMockResult = () => ({
    data: mockEntries.map((entry) => ({
      id: entry.id,
      email: entry.email,
      vehicleType: entry.vehicleType,
      city: entry.city,
      invitedAt: entry.invitedAt,
      createdAt: entry.createdAt,
    })),
    usingMockData: true,
  });

  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("waiting_list")
      .select("id, email, vehicle_type, city, invited_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (result.error || !result.data) {
      return toMockResult();
    }

    const data = (result.data as WaitingListRecord[]).map((entry) => ({
      id: entry.id,
      email: entry.email,
      vehicleType: entry.vehicle_type,
      city: entry.city,
      invitedAt: entry.invited_at ? formatDateTime(entry.invited_at) : null,
      createdAt: formatDateTime(entry.created_at),
    }));

    if (data.length === 0) {
      return toMockResult();
    }

    return { data, usingMockData: false };
  } catch {
    return toMockResult();
  }
}

function isStatusValue(value: unknown): value is AdminStatusComponent["status"] {
  return value === "operational" || value === "degraded" || value === "partial_outage" || value === "major_outage";
}

function isIncidentPhase(
  value: unknown,
): value is AdminStatusPage["incident"]["phase"] {
  return value === "investigating" || value === "identified" || value === "monitoring" || value === "resolved";
}

function mapMockStatusPage(mockPage: MockStatusPage): AdminStatusPage {
  return {
    publicUrl: mockPage.publicUrl,
    incident: {
      phase: mockPage.incident.phase,
      message: mockPage.incident.message,
      updatedAt: mockPage.incident.updatedAt,
    },
    components: mockPage.components.map((component) => ({
      key: component.key,
      label: component.label,
      status: component.status,
      note: component.note,
    })),
  };
}

export async function getAdminStatusPageOrMock(
  mockPage: MockStatusPage,
): Promise<AdminDataResult<AdminStatusPage>> {
  const fallback = mapMockStatusPage(mockPage);

  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("remote_configs")
      .select("key, value, description, updated_at")
      .eq("key", "status_page_state")
      .maybeSingle();

    if (result.error || !result.data) {
      return { data: fallback, usingMockData: true };
    }

    const record = result.data as RemoteConfigRecord;
    const rawState = record.value;

    if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) {
      return { data: fallback, usingMockData: true };
    }

    const state = rawState as {
      publicUrl?: unknown;
      incident?: { phase?: unknown; message?: unknown; updatedAt?: unknown };
      components?: Array<{ key?: unknown; label?: unknown; status?: unknown; note?: unknown }>;
    };

    const componentMap = new Map(
      (state.components ?? [])
        .filter((component) => typeof component?.key === "string")
        .map((component) => [component.key as AdminStatusComponent["key"], component]),
    );

    const components = defaultStatusComponents.map((component) => {
      const override = componentMap.get(component.key);
      return {
        key: component.key,
        label: typeof override?.label === "string" && override.label.trim().length > 0 ? override.label : component.label,
        status: isStatusValue(override?.status) ? override.status : component.status,
        note: typeof override?.note === "string" && override.note.trim().length > 0 ? override.note : component.note,
      };
    });

    const incident = state.incident;
    const updatedAt =
      typeof incident?.updatedAt === "string" && incident.updatedAt
        ? formatDateTime(incident.updatedAt)
        : record.updated_at
          ? formatDateTime(record.updated_at)
          : fallback.incident.updatedAt;

    return {
      data: {
        publicUrl:
          typeof state.publicUrl === "string" && state.publicUrl.trim().length > 0 ? state.publicUrl : fallback.publicUrl,
        incident: {
          phase: isIncidentPhase(incident?.phase) ? incident.phase : fallback.incident.phase,
          message:
            typeof incident?.message === "string" && incident.message.trim().length > 0
              ? incident.message
              : fallback.incident.message,
          updatedAt,
        },
        components,
      },
      usingMockData: false,
    };
  } catch {
    return { data: fallback, usingMockData: true };
  }
}

export async function getAdminCommunityRulesOrMock(
  mockConfig: MockCommunityRulesConfig,
): Promise<AdminDataResult<AdminCommunityRulesConfig>> {
  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("remote_configs")
      .select("key, value, description, updated_at")
      .eq("key", "community_guidelines_v1")
      .maybeSingle();

    if (result.error || !result.data) {
      return { data: mockConfig, usingMockData: true };
    }

    const record = result.data as RemoteConfigRecord;
    const rawValue = record.value;

    if (!rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) {
      return { data: mockConfig, usingMockData: true };
    }

    const config = rawValue as {
      version?: unknown;
      publishedUrl?: unknown;
      trText?: unknown;
      enText?: unknown;
      updatedAt?: unknown;
    };

    return {
      data: {
        version: typeof config.version === "string" && config.version ? config.version : mockConfig.version,
        publishedUrl:
          typeof config.publishedUrl === "string" && config.publishedUrl ? config.publishedUrl : mockConfig.publishedUrl,
        trText: typeof config.trText === "string" && config.trText ? config.trText : mockConfig.trText,
        enText: typeof config.enText === "string" && config.enText ? config.enText : mockConfig.enText,
        updatedAt:
          typeof config.updatedAt === "string" && config.updatedAt
            ? formatDateTime(config.updatedAt)
            : record.updated_at
              ? formatDateTime(record.updated_at)
              : mockConfig.updatedAt,
      },
      usingMockData: false,
    };
  } catch {
    return { data: mockConfig, usingMockData: true };
  }
}

export async function getAdminExportRequestsOrMock(
  mockEntries: MockExportRequest[],
): Promise<AdminDataResult<AdminExportRequest[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("remote_configs")
      .select("key, value")
      .eq("key", "data_export_jobs")
      .maybeSingle();

    if (result.error || !result.data) {
      return { data: mockEntries, usingMockData: true };
    }

    const record = result.data as Pick<RemoteConfigRecord, "key" | "value">;
    const rawJobs = record.value;

    if (!Array.isArray(rawJobs)) {
      return { data: mockEntries, usingMockData: true };
    }

    const entries = rawJobs
      .map((job) => {
        if (!job || typeof job !== "object" || Array.isArray(job)) return null;
        const record = job as {
          id?: unknown;
          requesterLabel?: unknown;
          channel?: unknown;
          status?: unknown;
          requestedAt?: unknown;
          readyAt?: unknown;
          expiresAt?: unknown;
        };

        if (
          typeof record.id !== "string" ||
          typeof record.requesterLabel !== "string" ||
          (record.channel !== "app" && record.channel !== "support") ||
          (record.status !== "queued" &&
            record.status !== "processing" &&
            record.status !== "ready" &&
            record.status !== "expired" &&
            record.status !== "failed") ||
          typeof record.requestedAt !== "string"
        ) {
          return null;
        }

        return {
          id: record.id,
          requesterLabel: record.requesterLabel,
          channel: record.channel,
          status: record.status,
          requestedAt: formatDateTime(record.requestedAt),
          readyAt: typeof record.readyAt === "string" && record.readyAt ? formatDateTime(record.readyAt) : null,
          expiresAt: typeof record.expiresAt === "string" && record.expiresAt ? formatDateTime(record.expiresAt) : null,
        } satisfies AdminExportRequest;
      })
      .filter((entry): entry is AdminExportRequest => Boolean(entry));

    if (entries.length === 0) {
      return { data: mockEntries, usingMockData: true };
    }

    return { data: entries, usingMockData: false };
  } catch {
    return { data: mockEntries, usingMockData: true };
  }
}

export async function getAdminSupportSearchOrMock(
  query: string,
  mockUsers: MockUser[],
): Promise<AdminDataResult<AdminSupportSearchUser[]>> {
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const mockEntries = mockUsers
    .filter((user) => {
      if (!normalizedQuery) return true;
      return [user.displayName, user.username, user.phone]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedQuery);
    })
    .slice(0, 25)
    .map((user) => ({
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      email: `${user.username}@rollpit.test`,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    }));

  try {
    const supabase = createAdminSupabaseClient();
    const [profilesResult, authUsersResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

    if (profilesResult.error || !profilesResult.data || authUsersResult.error || !authUsersResult.data?.users) {
      return { data: mockEntries, usingMockData: true };
    }

    const authUsers = authUsersResult.data.users as Array<{
      id: string;
      email?: string | null;
      phone?: string | null;
      banned_until?: string | null;
      user_metadata?: { phone?: unknown } | null;
    }>;

    const authMap = new Map(authUsers.map((user) => [user.id, user]));

    const entries = (profilesResult.data as Array<Pick<ProfileRow, "id" | "username" | "display_name" | "role" | "created_at">>)
      .map((profile) => {
        const authUser = authMap.get(profile.id);
        const phone =
          authUser?.phone ??
          (typeof authUser?.user_metadata?.phone === "string" ? authUser.user_metadata.phone : null);

        return {
          id: profile.id,
          displayName: profile.display_name ?? profile.username ?? "İsimsiz kullanıcı",
          username: profile.username ?? shortenId(profile.id),
          email: authUser?.email ?? "E-posta yok",
          phone,
          role: profile.role,
          status: profile.role === "banned" || Boolean(authUser?.banned_until) ? "suspended" : "active",
          createdAt: formatDate(profile.created_at),
        } satisfies AdminSupportSearchUser;
      })
      .filter((entry) => {
        if (!normalizedQuery) return true;
        return [entry.displayName, entry.username, entry.email, entry.phone ?? ""]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedQuery);
      })
      .slice(0, 50);

    if (entries.length === 0) {
      return { data: mockEntries, usingMockData: true };
    }

    return { data: entries, usingMockData: false };
  } catch {
    return { data: mockEntries, usingMockData: true };
  }
}

export async function getAdminBusinessApplicationsOrMock(
  mockApplications: MockBusinessApplication[],
): Promise<AdminDataResult<AdminBusinessApplication[]>> {
  const toMockResult = () => ({
    data: mockApplications.map((application) => ({
      id: application.id,
      applicantId: application.id,
      applicantName: application.applicantName,
      applicantUsername: application.applicantUsername,
      businessName: application.businessName,
      category: application.category,
      status: application.status,
      address: application.address,
      phone: application.phone,
      website: application.website,
      photoUrl: application.photoUrl,
      documentsCount: application.documents.length,
      hasUploadedDocuments: application.documents.some((document) => document.status === "uploaded"),
      createdAt: application.createdAt,
      reviewedAt: application.reviewedAt,
      rejectionReason: application.rejectionReason,
    })),
    usingMockData: true,
  });

  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("business_applications")
      .select(
        "id, applicant_id, business_name, category, description, h3_cell, latitude, longitude, address, phone, website, photo_url, working_hours, status, rejection_reason, reviewer_id, reviewed_at, location_id, created_at, updated_at, applicant_profile:profiles!business_applications_applicant_id_fkey(id, username, display_name, avatar_url), reviewer_profile:profiles!business_applications_reviewer_id_fkey(id, username, display_name), business_documents(id, application_id, document_type, storage_key, content_type, size_bytes, status, created_at)",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (result.error || !result.data) {
      return toMockResult();
    }

    return {
      data: (result.data as unknown as BusinessApplicationRecord[]).map(mapBusinessApplication),
      usingMockData: false,
    };
  } catch {
    return toMockResult();
  }
}

export async function getAdminBusinessApplicationByIdOrMock(
  id: string,
  mockApplications: MockBusinessApplication[],
): Promise<AdminDataResult<AdminBusinessApplicationDetail | null>> {
  const mockApplication = mockApplications.find((application) => application.id === id);
  if (mockApplication) {
    return {
      data: {
        application: {
          id: mockApplication.id,
          applicantId: mockApplication.id,
          applicantName: mockApplication.applicantName,
          applicantUsername: mockApplication.applicantUsername,
          businessName: mockApplication.businessName,
          category: mockApplication.category,
          status: mockApplication.status,
          address: mockApplication.address,
          phone: mockApplication.phone,
          website: mockApplication.website,
          photoUrl: mockApplication.photoUrl,
          documentsCount: mockApplication.documents.length,
          hasUploadedDocuments: mockApplication.documents.some((document) => document.status === "uploaded"),
          createdAt: mockApplication.createdAt,
          reviewedAt: mockApplication.reviewedAt,
          rejectionReason: mockApplication.rejectionReason,
        },
        description: null,
        h3Cell: "8928308280fffff",
        latitude: 41.0,
        longitude: 29.0,
        locationId: null,
        reviewerLabel: null,
        workingHoursSummary: "Pzt-Cmt 09:00-19:00",
        documents: mockApplication.documents.map((document) => ({
          id: document.id,
          type: document.type,
          contentType: document.contentType,
          sizeLabel: formatBytes(document.sizeBytes),
          status: document.status,
          storageKey: document.storageKey,
          createdAt: document.createdAt,
          previewUrl: null,
        })),
      },
      usingMockData: true,
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("business_applications")
      .select(
        "id, applicant_id, business_name, category, description, h3_cell, latitude, longitude, address, phone, website, photo_url, working_hours, status, rejection_reason, reviewer_id, reviewed_at, location_id, created_at, updated_at, applicant_profile:profiles!business_applications_applicant_id_fkey(id, username, display_name, avatar_url), reviewer_profile:profiles!business_applications_reviewer_id_fkey(id, username, display_name), business_documents(id, application_id, document_type, storage_key, content_type, size_bytes, status, created_at)",
      )
      .eq("id", id)
      .maybeSingle();

    if (result.error || !result.data) {
      return { data: null, usingMockData: false };
    }

    const detail = mapBusinessApplicationDetail(result.data as unknown as BusinessApplicationRecord);
    const previewResults = await Promise.all(
      detail.documents.map(async (document) => {
        const previewResult = await callAdminBackend<{ data?: { preview_url?: string | null } } | { preview_url?: string | null }>(
          `/v2/admin/business/documents/${document.id}/preview-url`,
        );
        const previewPayload = unwrapBackendData<{ preview_url?: string | null }>(previewResult.data);
        return {
          ...document,
          previewUrl: previewResult.ok ? previewPayload?.preview_url ?? null : null,
        };
      }),
    );

    return {
      data: {
        ...detail,
        documents: previewResults,
      },
      usingMockData: false,
    };
  } catch {
    return { data: null, usingMockData: false };
  }
}

export async function getAdminBusinessLocationsOrMock(
  mockLocations: MockBusinessLocation[],
): Promise<AdminDataResult<AdminBusinessLocation[]>> {
  const toMockResult = () => ({
    data: mockLocations.map((location) => ({
      id: location.id,
      ownerId: location.id,
      ownerName: location.ownerName,
      businessName: location.businessName,
      category: location.category,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      photoUrl: location.photoUrl,
      featuredRank: location.featuredRank,
      isActive: location.isActive,
      createdAt: location.createdAt,
    })),
    usingMockData: true,
  });

  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("business_locations")
      .select("id, owner_id, business_name, category, address, latitude, longitude, photo_url, featured_rank, is_active, created_at, owner_profile:profiles!business_locations_owner_id_fkey(username, display_name)")
      .order("featured_rank", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(200);

    if (result.error || !result.data) {
      return toMockResult();
    }

    return {
      data: (result.data as unknown as BusinessLocationRecord[]).map(mapBusinessLocation),
      usingMockData: false,
    };
  } catch {
    return toMockResult();
  }
}

export async function getAdminCommunityNeedsOrMock(
  mockNeeds: MockCommunityNeed[],
): Promise<AdminDataResult<AdminCommunityNeed[]>> {
  const toMockResult = (): AdminDataResult<AdminCommunityNeed[]> => ({
    data: mockNeeds.map((need): AdminCommunityNeed => ({
      id: need.id,
      communityId: need.id,
      communityName: need.communityName,
      creatorId: need.id,
      creatorName: need.creatorName,
      creatorUsername: need.creatorUsername,
      creatorStatus: "active",
      type: need.type,
      urgencyColor: need.urgencyColor,
      body: need.body,
      status: need.status,
      createdAt: need.createdAt,
      createdWithin24h: need.createdWithin24h,
      flaggedAsSpam: need.flaggedAsSpam,
      spamScore: null,
      spamReason: null,
    })),
    usingMockData: true,
  });

  try {
    const backendResult = await callAdminBackend<{ data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>("/v2/admin/community-needs");
    const backendPayload = unwrapBackendData<Array<Record<string, unknown>>>(backendResult.data);
    if (backendResult.ok && backendPayload) {
      const backendNeeds = backendPayload
        .map((entry) => {
          const row = entry as Record<string, unknown>;
          const id = typeof row.id === "string" ? row.id : null;
          const creatorId = typeof row.creator_id === "string" ? row.creator_id : null;
          const communityId = typeof row.community_id === "string" ? row.community_id : null;
          if (!id || !creatorId || !communityId) {
            return null;
          }

          const createdWithin24h = typeof row.created_within_24h === "number" ? row.created_within_24h : 0;
          return {
            id,
            communityId,
            communityName:
              typeof row.community_name === "string"
                ? row.community_name
                : typeof (row.community as { name?: unknown } | null)?.name === "string"
                  ? ((row.community as { name?: string }).name ?? shortenId(communityId))
                  : shortenId(communityId),
            creatorId,
            creatorName:
              typeof row.creator_name === "string"
                ? row.creator_name
                : typeof (row.creator_profile as { display_name?: unknown; username?: unknown } | null)?.display_name === "string"
                  ? ((row.creator_profile as { display_name?: string }).display_name ?? shortenId(creatorId))
                  : typeof (row.creator_profile as { username?: unknown } | null)?.username === "string"
                    ? ((row.creator_profile as { username?: string }).username ?? shortenId(creatorId))
                    : shortenId(creatorId),
            creatorUsername:
              typeof row.creator_username === "string"
                ? row.creator_username
                : typeof (row.creator_profile as { username?: unknown } | null)?.username === "string"
                  ? ((row.creator_profile as { username?: string }).username ?? shortenId(creatorId))
                  : shortenId(creatorId),
            creatorStatus: row.creator_status === "suspended" || row.creator_role === "banned" ? "suspended" : "active",
            type:
              row.type === "parts" || row.type === "fuel" || row.type === "tools" || row.type === "ride_help"
                ? row.type
                : "other",
            urgencyColor: row.urgency_color === "red" ? "red" : "yellow",
            body: typeof row.body === "string" ? row.body : "İlan metni yok",
            status: row.status === "resolved" || row.status === "closed" || row.status === "flagged" ? row.status : "open",
            createdAt: formatDateTime(typeof row.created_at === "string" ? row.created_at : new Date().toISOString()),
            createdWithin24h,
            flaggedAsSpam: row.status === "flagged" || (typeof row.spam_score === "number" && row.spam_score > 0) || createdWithin24h >= 5,
            spamScore: typeof row.spam_score === "number" ? row.spam_score : null,
            spamReason: typeof row.spam_reason === "string" ? row.spam_reason : null,
          } satisfies AdminCommunityNeed;
        })
        .filter((entry): entry is AdminCommunityNeed => Boolean(entry));

      if (backendNeeds.length > 0) {
        return { data: backendNeeds, usingMockData: false };
      }
    }

    const supabase = createAdminSupabaseClient();
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = await supabase
      .from("community_needs")
      .select(
        "id, community_id, creator_id, type, urgency_color, body, status, created_at, community:communities(name), creator_profile:profiles!community_needs_creator_id_fkey(username, display_name, role)",
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (result.error || !result.data) {
      return toMockResult();
    }

    const recentResult = await supabase
      .from("community_needs")
      .select("creator_id, created_at")
      .gte("created_at", since24h);

    const recentCounts = new Map<string, number>();
    if (!recentResult.error && recentResult.data) {
      for (const row of recentResult.data as Array<Pick<CommunityNeedRow, "creator_id" | "created_at">>) {
        recentCounts.set(row.creator_id, (recentCounts.get(row.creator_id) ?? 0) + 1);
      }
    }

    return {
      data: (result.data as unknown as CommunityNeedRecord[]).map((need) => mapCommunityNeed(need, recentCounts.get(need.creator_id) ?? 1)),
      usingMockData: false,
    };
  } catch {
    return toMockResult();
  }
}

export async function getAdminCompetitionsOrMock(
  mockEntries: MockCompetition[],
): Promise<AdminDataResult<AdminCompetition[]>> {
  const mockOverrides = await getCompetitionAuditOverrides(mockEntries.map((entry) => entry.id));

  try {
    const backendResult = await callAdminBackend<{ data?: BackendCompetitionListItem[] } | BackendCompetitionListItem[]>("/v2/admin/competitions");
    const backendPayload = unwrapBackendData<BackendCompetitionListItem[]>(backendResult.data);
    if (backendResult.ok && backendPayload) {
      const backendCompetitions = backendPayload
        .map((competition) => mapCompetitionFromBackend(competition))
        .filter((entry): entry is AdminCompetition => Boolean(entry));

      if (backendCompetitions.length > 0) {
        const overrides = await getCompetitionAuditOverrides(backendCompetitions.map((entry) => entry.id));
        return {
          data: backendCompetitions.map((entry) => applyCompetitionOverrides(entry, overrides)),
          usingMockData: false,
        };
      }
    }
  } catch {
    // Falls back to audit-backed mock data below.
  }

  return {
    data: mockEntries.map((entry) => buildAdminCompetitionFromMock(entry, mockOverrides)),
    usingMockData: true,
  };
}

export async function getAdminCompetitionByIdOrMock(
  competitionId: string,
  mockEntries: MockCompetition[],
): Promise<AdminDataResult<AdminCompetition | null>> {
  try {
    const backendResult = await callAdminBackend<{
      data?: {
        competition?: BackendCompetitionListItem | null;
        entries?: BackendCompetitionEntryItem[] | null;
        votes?: unknown[] | null;
      };
    } | {
      competition?: BackendCompetitionListItem | null;
      entries?: BackendCompetitionEntryItem[] | null;
      votes?: unknown[] | null;
    }>(`/v2/admin/competitions/${competitionId}`);
    const backendPayload = unwrapBackendData<{
      competition?: BackendCompetitionListItem | null;
      entries?: BackendCompetitionEntryItem[] | null;
      votes?: unknown[] | null;
    }>(backendResult.data);

    if (backendResult.ok && backendPayload?.competition) {
      const mapped = mapCompetitionFromBackend(
        backendPayload.competition,
        backendPayload.entries ?? [],
      );
      if (mapped) {
        const overrides = await getCompetitionAuditOverrides([competitionId]);
        return {
          data: applyCompetitionOverrides(mapped, overrides),
          usingMockData: false,
        };
      }
    }
  } catch {
    // Falls back to audit-backed mock detail below.
  }

  const competition = mockEntries.find((entry) => entry.id === competitionId) ?? null;
  if (!competition) {
    return { data: null, usingMockData: true };
  }

  const overrides = await getCompetitionAuditOverrides([competitionId]);
  return {
    data: buildAdminCompetitionFromMock(competition, overrides),
    usingMockData: true,
  };
}

export async function getAdminUsersOrMock(mockUsers: MockUser[]): Promise<AdminDataResult<MockUser[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const [{ data: profiles, error: profilesError }, { data: vehicles, error: vehiclesError }, { data: memberships, error: membershipsError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, bio, is_private, location_share_mode, role, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase.from("vehicles").select("id, user_id, type, make, model, year, is_primary"),
        supabase.from("community_members").select("community_id, user_id, role, community:communities(id, name, city)"),
      ]);

    if (profilesError || vehiclesError || membershipsError || !profiles || !vehicles || !memberships) {
      return { data: mockUsers, usingMockData: true };
    }

    const profileIds = (profiles as unknown as UserRecord[]).map((profile) => profile.id);
    const [reportsResult, followerRowsResult, followingRowsResult] = await Promise.all([
      supabase.from("reports").select("id, content_id, reason, status, created_at").eq("content_type", "profile").in("content_id", profileIds),
      supabase.from("follows").select("follower_id, followee_id, created_at").in("followee_id", profileIds),
      supabase.from("follows").select("follower_id, followee_id, created_at").in("follower_id", profileIds),
    ]);

    const reportsByUser = new Map<string, UserReportRecord[]>();
    if (!reportsResult.error && reportsResult.data) {
      for (const report of reportsResult.data as unknown as Array<UserReportRecord & { content_id: string }>) {
        const current = reportsByUser.get(report.content_id) ?? [];
        current.push(report);
        reportsByUser.set(report.content_id, current);
      }
    }

    const vehiclesByUser = new Map<string, VehicleRecord[]>();
    for (const vehicle of vehicles as unknown as VehicleRecord[]) {
      const current = vehiclesByUser.get(vehicle.user_id) ?? [];
      current.push(vehicle);
      vehiclesByUser.set(vehicle.user_id, current);
    }

    const membershipsByUser = new Map<string, CommunityMembershipRecord[]>();
    for (const membership of memberships as unknown as CommunityMembershipRecord[]) {
      const current = membershipsByUser.get(membership.user_id) ?? [];
      current.push(membership);
      membershipsByUser.set(membership.user_id, current);
    }

    const followerCountsByUser = new Map<string, number>();
    if (!followerRowsResult.error && followerRowsResult.data) {
      for (const follow of followerRowsResult.data as unknown as FollowRecord[]) {
        followerCountsByUser.set(follow.followee_id, (followerCountsByUser.get(follow.followee_id) ?? 0) + 1);
      }
    }

    const followingCountsByUser = new Map<string, number>();
    if (!followingRowsResult.error && followingRowsResult.data) {
      for (const follow of followingRowsResult.data as unknown as FollowRecord[]) {
        followingCountsByUser.set(follow.follower_id, (followingCountsByUser.get(follow.follower_id) ?? 0) + 1);
      }
    }

    return {
      data: (profiles as unknown as UserRecord[]).map((profile) =>
        buildMockUser(
          profile,
          vehiclesByUser.get(profile.id) ?? [],
          membershipsByUser.get(profile.id) ?? [],
          reportsByUser.get(profile.id) ?? [],
          null,
          followerCountsByUser.get(profile.id) ?? 0,
          followingCountsByUser.get(profile.id) ?? 0,
        ),
      ),
      usingMockData: false,
    };
  } catch {
    return { data: mockUsers, usingMockData: true };
  }
}

export async function getAdminUserByIdOrMock(id: string, mockUsers: MockUser[]): Promise<AdminDataResult<AdminUserDetail | null>> {
  const mockUser = mockUsers.find((user) => user.id === id);
  if (mockUser) {
    return { data: { user: mockUser, supportNotes: [] }, usingMockData: true };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const [
      { data: profile, error: profileError },
      { data: vehicles, error: vehiclesError },
      { data: memberships, error: membershipsError },
      { data: reports, error: reportsError },
      { data: supportNotes, error: supportNotesError },
      { data: followers, error: followersError },
      { data: following, error: followingError },
      { count: followersCount, error: followersCountError },
      { count: followingCount, error: followingCountError },
    ] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, bio, is_private, location_share_mode, role, created_at, updated_at")
          .eq("id", id)
          .maybeSingle(),
        supabase.from("vehicles").select("id, user_id, type, make, model, year, is_primary").eq("user_id", id),
        supabase.from("community_members").select("community_id, user_id, role, community:communities(id, name, city)").eq("user_id", id),
        supabase.from("reports").select("id, reason, status, created_at").eq("content_type", "profile").eq("content_id", id).order("created_at", { ascending: false }),
        supabase
          .from("audit_logs")
          .select("id, created_at, metadata")
          .eq("target_type", "support_note")
          .eq("target_id", id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("follows")
          .select("created_at, follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url, is_private)")
          .eq("followee_id", id)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("follows")
          .select("created_at, followee:profiles!follows_followee_id_fkey(id, username, display_name, avatar_url, is_private)")
          .eq("follower_id", id)
          .order("created_at", { ascending: false })
          .limit(25),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", id),
      ]);

    if (profileError || !profile) {
      return { data: null, usingMockData: false };
    }

    const safeVehicles = vehiclesError ? [] : ((vehicles as unknown as VehicleRecord[]) ?? []);
    const safeMemberships = membershipsError ? [] : ((memberships as unknown as CommunityMembershipRecord[]) ?? []);
    const safeReports = reportsError ? [] : ((reports as unknown as UserReportRecord[]) ?? []);
    const mappedSupportNotes = (supportNotesError ? [] : ((supportNotes as unknown as SupportNoteRecord[]) ?? []))
      .map((entry) => ({
        id: entry.id,
        note: typeof entry.metadata?.note === "string" ? entry.metadata.note : "",
        createdAt: formatDateTime(entry.created_at),
      }))
      .filter((entry) => entry.note.length > 0);
    const mappedFollowers = (followersError ? [] : ((followers as unknown as FollowerRelationRecord[]) ?? []))
      .map((entry) => buildUserFollowRelation(entry.follower, entry.created_at))
      .filter((entry): entry is MockUser["followers"][number] => Boolean(entry));
    const mappedFollowing = (followingError ? [] : ((following as unknown as FollowingRelationRecord[]) ?? []))
      .map((entry) => buildUserFollowRelation(entry.followee, entry.created_at))
      .filter((entry): entry is MockUser["following"][number] => Boolean(entry));

    const user = buildMockUser(
      profile as unknown as UserRecord,
      safeVehicles,
      safeMemberships,
      safeReports,
      mappedSupportNotes[0]?.note ?? null,
      followersCountError ? mappedFollowers.length : (followersCount ?? 0),
      followingCountError ? mappedFollowing.length : (followingCount ?? 0),
      mappedFollowers,
      mappedFollowing,
    );

    return {
      data: { user, supportNotes: mappedSupportNotes },
      usingMockData: false,
    };
  } catch {
    return { data: null, usingMockData: false };
  }
}

export async function getAdminPostsOrMock(
  mockPosts: MockModerationPost[],
): Promise<AdminDataResult<AdminModerationPost[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const [{ data: posts, error: postsError }, { data: comments, error: commentsError }] = await Promise.all([
      supabase
        .from("posts")
        .select(
          "id, author_id, caption, visibility, deleted_at, created_at, updated_at, author_profile:profiles!posts_author_id_fkey(username, display_name, avatar_url, role), media:media_assets!posts_media_id_fkey(*)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("comments").select("id, post_id"),
    ]);

    if (postsError || commentsError || !posts || !comments) {
      return { data: mockPosts, usingMockData: true };
    }

    const postIds = (posts as unknown as PostRecord[]).map((post) => post.id);
    const reportsResult = await supabase
      .from("reports")
      .select("id, content_id, reason, status, created_at, reporter_profile:profiles!reports_reporter_id_fkey(username, display_name)")
      .eq("content_type", "post")
      .in("content_id", postIds);

    const reportsByPost = new Map<string, ContentReportRecord[]>();
    if (!reportsResult.error && reportsResult.data) {
      for (const report of reportsResult.data as unknown as ContentReportRecord[]) {
        const current = reportsByPost.get(report.content_id) ?? [];
        current.push(report);
        reportsByPost.set(report.content_id, current);
      }
    }

    const commentsCountByPost = new Map<string, number>();
    for (const comment of comments as unknown as Array<Pick<CommentRow, "id" | "post_id">>) {
      commentsCountByPost.set(comment.post_id, (commentsCountByPost.get(comment.post_id) ?? 0) + 1);
    }

    const data = (posts as unknown as PostRecord[])
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .map((post) => mapModerationPost(post, reportsByPost.get(post.id) ?? [], commentsCountByPost.get(post.id) ?? 0))
      .sort((left, right) => {
        const leftModerationRank = left.mediaModeration?.status === "blocked" ? 2 : left.mediaModeration?.status === "review" ? 1 : 0;
        const rightModerationRank = right.mediaModeration?.status === "blocked" ? 2 : right.mediaModeration?.status === "review" ? 1 : 0;
        if (rightModerationRank !== leftModerationRank) return rightModerationRank - leftModerationRank;
        if (right.reportsCount !== left.reportsCount) return right.reportsCount - left.reportsCount;
        return (right.latestReportAt ? 1 : 0) - (left.latestReportAt ? 1 : 0);
      });

    return {
      data,
      usingMockData: false,
    };
  } catch {
    return { data: mockPosts, usingMockData: true };
  }
}

export async function getAdminPostByIdOrMock(
  id: string,
  mockPosts: MockModerationPost[],
  mockComments: MockModerationComment[],
): Promise<AdminDataResult<AdminModerationPostDetail | null>> {
  const mockPost = mockPosts.find((entry) => entry.id === id);
  if (mockPost) {
    return {
      data: {
        post: mockPost,
        relatedReports: mockPost.latestReportReason
          ? [
              {
                id: `mock-report-${mockPost.id}`,
                reason: mockPost.latestReportReason,
                reporterLabel: "mock reporter",
                createdAt: mockPost.latestReportAt ?? mockPost.createdAt,
                status: "pending",
              },
            ]
          : [],
        recentComments: mockComments.filter((comment) => comment.postId === id).slice(0, 5),
      },
      usingMockData: true,
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const [{ data: post, error: postError }, { data: comments, error: commentsError }, { data: reports, error: reportsError }] = await Promise.all([
      supabase
        .from("posts")
        .select(
          "id, author_id, caption, visibility, deleted_at, created_at, updated_at, author_profile:profiles!posts_author_id_fkey(username, display_name, avatar_url, role), media:media_assets!posts_media_id_fkey(*)",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("comments")
        .select(
          "id, post_id, author_id, body, is_deleted, created_at, updated_at, author_profile:profiles!comments_author_id_fkey(username, display_name, role), post:posts!comments_post_id_fkey(id, caption, deleted_at)",
        )
        .eq("post_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("reports")
        .select("id, content_id, reason, status, created_at, reporter_profile:profiles!reports_reporter_id_fkey(username, display_name)")
        .eq("content_type", "post")
        .eq("content_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (postError || !post) {
      return { data: null, usingMockData: false };
    }

    const commentReportsResult = await supabase
      .from("reports")
      .select("id, content_id, reason, status, created_at, reporter_profile:profiles!reports_reporter_id_fkey(username, display_name)")
      .eq("content_type", "comment")
      .in("content_id", ((comments as unknown as CommentRecord[]) ?? []).map((comment) => comment.id));

    const reportsByComment = new Map<string, ContentReportRecord[]>();
    if (!commentReportsResult.error && commentReportsResult.data) {
      for (const report of commentReportsResult.data as unknown as ContentReportRecord[]) {
        const current = reportsByComment.get(report.content_id) ?? [];
        current.push(report);
        reportsByComment.set(report.content_id, current);
      }
    }

    const mappedPost = mapModerationPost(post as unknown as PostRecord, (reports as unknown as ContentReportRecord[]) ?? [], (comments ?? []).length);
    const relatedReports = ((reportsError ? [] : ((reports as unknown as ContentReportRecord[]) ?? [])) ?? []).map((report) => ({
      id: report.id,
      reason: mapReason(report.reason),
      reporterLabel: profileLabel(report.reporter_profile, "anonim"),
      createdAt: formatDateTime(report.created_at),
      status: report.status,
    }));
    const recentComments = (commentsError ? [] : ((comments as unknown as CommentRecord[]) ?? []))
      .map((comment) => mapModerationComment(comment, reportsByComment.get(comment.id) ?? []));

    return {
      data: {
        post: mappedPost,
        relatedReports,
        recentComments,
      },
      usingMockData: false,
    };
  } catch {
    return { data: null, usingMockData: false };
  }
}

export async function getAdminCommentsOrMock(
  mockComments: MockModerationComment[],
): Promise<AdminDataResult<AdminModerationComment[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const commentsResult = await supabase
      .from("comments")
      .select(
        "id, post_id, author_id, body, is_deleted, created_at, updated_at, author_profile:profiles!comments_author_id_fkey(username, display_name, role), post:posts!comments_post_id_fkey(id, caption, deleted_at)",
      )
      .order("created_at", { ascending: false })
      .limit(150);

    if (commentsResult.error || !commentsResult.data) {
      return { data: mockComments, usingMockData: true };
    }

    const commentIds = (commentsResult.data as unknown as CommentRecord[]).map((comment) => comment.id);
    const reportsResult = await supabase
      .from("reports")
      .select("id, content_id, reason, status, created_at, reporter_profile:profiles!reports_reporter_id_fkey(username, display_name)")
      .eq("content_type", "comment")
      .in("content_id", commentIds);

    const reportsByComment = new Map<string, ContentReportRecord[]>();
    if (!reportsResult.error && reportsResult.data) {
      for (const report of reportsResult.data as unknown as ContentReportRecord[]) {
        const current = reportsByComment.get(report.content_id) ?? [];
        current.push(report);
        reportsByComment.set(report.content_id, current);
      }
    }

    const data = (commentsResult.data as unknown as CommentRecord[])
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .map((comment) => mapModerationComment(comment, reportsByComment.get(comment.id) ?? []))
      .sort((left, right) => {
        if (right.reportsCount !== left.reportsCount) return right.reportsCount - left.reportsCount;
        return (right.latestReportAt ? 1 : 0) - (left.latestReportAt ? 1 : 0);
      });

    return { data, usingMockData: false };
  } catch {
    return { data: mockComments, usingMockData: true };
  }
}

export async function getAdminStoriesOrMock(
  mockStories: MockModerationStory[],
): Promise<AdminDataResult<AdminModerationStory[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const [storiesResult, viewsResult] = await Promise.all([
      supabase
        .from("stories")
        .select(
          "id, author_id, audience, expires_at, deleted_at, created_at, author_profile:profiles!stories_author_id_fkey(username, display_name, role), media:media_assets!stories_media_id_fkey(id, asset_type, storage_key, cf_image_id, cf_stream_id, status)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("story_views").select("story_id, viewer_id, viewed_at"),
    ]);

    if (storiesResult.error || viewsResult.error || !storiesResult.data || !viewsResult.data) {
      return { data: mockStories, usingMockData: true };
    }

    const viewsCountByStory = new Map<string, number>();
    for (const view of viewsResult.data as unknown as Array<Pick<StoryViewRow, "story_id">>) {
      viewsCountByStory.set(view.story_id, (viewsCountByStory.get(view.story_id) ?? 0) + 1);
    }

    const data = (storiesResult.data as unknown as StoryRecord[])
      .map((story) => mapModerationStory(story, viewsCountByStory.get(story.id) ?? 0))
      .sort((left, right) => {
        if (Number(right.isExpiringSoon) !== Number(left.isExpiringSoon)) {
          return Number(right.isExpiringSoon) - Number(left.isExpiringSoon);
        }
        return (right.viewsCount - left.viewsCount);
      });

    return { data, usingMockData: false };
  } catch {
    return { data: mockStories, usingMockData: true };
  }
}

export async function getAdminStoryByIdOrMock(
  id: string,
  mockStories: MockModerationStory[],
): Promise<AdminDataResult<AdminModerationStoryDetail | null>> {
  const mockStory = mockStories.find((story) => story.id === id);
  if (mockStory) {
    return {
      data: {
        story: mockStory,
        viewers: [
          {
            id: "mock-viewer-1",
            username: "mockviewer",
            displayName: "Mock Viewer",
            viewedAt: mockStory.createdAt,
          },
        ],
      },
      usingMockData: true,
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const [storyResult, viewersResult] = await Promise.all([
      supabase
        .from("stories")
        .select(
          "id, author_id, audience, expires_at, deleted_at, created_at, author_profile:profiles!stories_author_id_fkey(username, display_name, role), media:media_assets!stories_media_id_fkey(id, asset_type, storage_key, cf_image_id, cf_stream_id, status)",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("story_views")
        .select("story_id, viewer_id, viewed_at, viewer:profiles!story_views_viewer_id_fkey(id, username, display_name)")
        .eq("story_id", id)
        .order("viewed_at", { ascending: false })
        .limit(50),
    ]);

    if (storyResult.error || !storyResult.data) {
      return { data: null, usingMockData: false };
    }

    const story = mapModerationStory(storyResult.data as unknown as StoryRecord, (viewersResult.data ?? []).length);
    const viewers = (viewersResult.error ? [] : ((viewersResult.data as unknown as StoryViewRecord[]) ?? [])).map((entry) => ({
      id: entry.viewer?.id ?? entry.viewer_id,
      username: entry.viewer?.username ?? shortenId(entry.viewer_id),
      displayName: entry.viewer?.display_name ?? entry.viewer?.username ?? shortenId(entry.viewer_id),
      viewedAt: formatDateTime(entry.viewed_at),
    }));

    return { data: { story, viewers }, usingMockData: false };
  } catch {
    return { data: null, usingMockData: false };
  }
}

export async function getAdminFeedOverridesOrMock(
  mockOverrides: MockFeedOverride[],
): Promise<AdminDataResult<AdminFeedOverride[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const result = await supabase
      .from("feed_overrides")
      .select(
        "id, post_id, action_type, reason, expires_at, created_at, updated_at, post:posts!feed_overrides_post_id_fkey(id, author_id, caption, visibility, deleted_at, created_at, updated_at, author_profile:profiles!posts_author_id_fkey(username, display_name, avatar_url, role), media:media_assets!posts_media_id_fkey(id, asset_type, storage_key, cf_image_id, cf_stream_id, status))",
      )
      .order("updated_at", { ascending: false })
      .limit(100);

    if (result.error || !result.data) {
      return { data: mockOverrides, usingMockData: true };
    }

    return {
      data: (result.data as unknown as FeedOverrideRecord[]).map(mapFeedOverride),
      usingMockData: false,
    };
  } catch {
    return { data: mockOverrides, usingMockData: true };
  }
}

export async function getAdminTrendingPostsOrMock(
  mockTrendingPosts: MockTrendingPost[],
): Promise<AdminDataResult<AdminTrendingPost[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const [scoresResult, overridesResult] = await Promise.all([
      supabase
        .from("post_discovery_scores")
        .select("post_id, author_id, author_is_private, visibility, created_at, like_count, comment_count, engagement_rate, base_score, refreshed_at")
        .order("base_score", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("feed_overrides").select("post_id, action_type"),
    ]);

    if (scoresResult.error || !scoresResult.data) {
      return { data: mockTrendingPosts, usingMockData: true };
    }

    const scoreRows = scoresResult.data as unknown as DiscoverScoreRecord[];
    const postIds = scoreRows.map((row) => row.post_id);
    const postsResult = await supabase
      .from("posts")
      .select(
        "id, author_id, caption, visibility, deleted_at, created_at, updated_at, author_profile:profiles!posts_author_id_fkey(username, display_name, avatar_url, role), media:media_assets!posts_media_id_fkey(id, asset_type, storage_key, cf_image_id, cf_stream_id, status)",
      )
      .in("id", postIds)
      .is("deleted_at", null);

    if (postsResult.error || !postsResult.data) {
      return { data: mockTrendingPosts, usingMockData: true };
    }

    const postsById = new Map((postsResult.data as unknown as PostRecord[]).map((post) => [post.id, post]));
    const overridesByPost = new Map<string, FeedOverrideRow["action_type"]>();
    if (!overridesResult.error && overridesResult.data) {
      for (const override of overridesResult.data as Array<Pick<FeedOverrideRow, "post_id" | "action_type">>) {
        overridesByPost.set(override.post_id, override.action_type);
      }
    }

    return {
      data: scoreRows.map((row) => mapTrendingPost(row, postsById.get(row.post_id) ?? null, overridesByPost.get(row.post_id) ?? "none")),
      usingMockData: false,
    };
  } catch {
    return { data: mockTrendingPosts, usingMockData: true };
  }
}

export async function getAdminCommunitiesOrMock(mockCommunities: MockCommunity[]): Promise<AdminDataResult<MockCommunity[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const [{ data: communities, error: communitiesError }, { data: members, error: membersError }, { data: flares, error: flaresError }] =
      await Promise.all([
        supabase
          .from("communities")
          .select("id, name, slug, city, member_count, type, vehicle_type, description, created_at, owner_profile:profiles!communities_owner_id_fkey(username, display_name)")
          .order("created_at", { ascending: false }),
        supabase.from("community_members").select("community_id, user_id, role, profile:profiles!community_members_user_id_fkey(username, display_name)"),
        supabase.from("flares").select("id, community_id, title, starts_at, rsvp_count, status").eq("status", "active"),
      ]);

    if (communitiesError || membersError || flaresError || !communities || !members || !flares) {
      return { data: mockCommunities, usingMockData: true };
    }

    const membersByCommunity = new Map<string, CommunityMemberDetailRecord[]>();
    for (const member of members as unknown as CommunityMemberDetailRecord[]) {
      const current = membersByCommunity.get(member.community_id) ?? [];
      current.push(member);
      membersByCommunity.set(member.community_id, current);
    }

    const flaresByCommunity = new Map<string, CommunityFlareRecord[]>();
    for (const flare of flares as unknown as CommunityFlareRecord[]) {
      if (!flare.community_id) continue;
      const current = flaresByCommunity.get(flare.community_id) ?? [];
      current.push(flare);
      flaresByCommunity.set(flare.community_id, current);
    }

    const data = (communities as unknown as CommunityRecord[]).map((community) =>
        buildMockCommunity(
          community,
          membersByCommunity.get(community.id) ?? [],
          flaresByCommunity.get(community.id) ?? [],
        ),
      );

    if (data.length === 0) {
      return { data: mockCommunities, usingMockData: true };
    }

    return {
      data,
      usingMockData: false,
    };
  } catch {
    return { data: mockCommunities, usingMockData: true };
  }
}

export async function getAdminCommunityByIdOrMock(id: string, mockCommunities: MockCommunity[]): Promise<AdminDataResult<MockCommunity | null>> {
  const mockCommunity = mockCommunities.find((community) => community.id === id);
  if (mockCommunity) {
    return { data: mockCommunity, usingMockData: true };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const [{ data: community, error: communityError }, { data: members, error: membersError }, { data: flares, error: flaresError }, { data: roles, error: rolesError }] = await Promise.all([
      supabase
        .from("communities")
        .select("id, name, slug, city, member_count, type, vehicle_type, description, created_at, owner_profile:profiles!communities_owner_id_fkey(username, display_name)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("community_members")
        .select("community_id, user_id, role, role_id, profile:profiles!community_members_user_id_fkey(username, display_name), community_role:community_roles(id, name, permissions, rank_order)")
        .eq("community_id", id),
      supabase.from("flares").select("id, community_id, title, starts_at, rsvp_count, status").eq("community_id", id).order("starts_at", { ascending: true }),
      supabase.from("community_roles").select("id, community_id, name, permissions, rank_order, created_at").eq("community_id", id).order("rank_order", { ascending: true }),
    ]);

    if (communityError || membersError || flaresError || rolesError || !community) {
      return { data: null, usingMockData: false };
    }

    return {
      data: buildMockCommunity(
        community as unknown as CommunityRecord,
        (members as unknown as CommunityMemberDetailRecord[]) ?? [],
        (flares as unknown as CommunityFlareRecord[]) ?? [],
        (roles as unknown as CommunityRoleRecord[]) ?? [],
      ),
      usingMockData: false,
    };
  } catch {
    return { data: null, usingMockData: false };
  }
}

export async function getAdminEventsOrMock(
  mockEvents: MockCommunityEvent[],
): Promise<AdminDataResult<AdminCommunityEvent[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const [eventsResult, rsvpsResult] = await Promise.all([
      supabase
        .from("community_events")
        .select(
          "id, community_id, creator_id, title, starts_at, status, community:communities(name), creator_profile:profiles!community_events_creator_id_fkey(username, display_name)",
        )
        .order("starts_at", { ascending: true })
        .limit(100),
      supabase.from("event_rsvps").select("event_id, response"),
    ]);

    if (eventsResult.error || rsvpsResult.error || !eventsResult.data || !rsvpsResult.data) {
      return { data: mockEvents, usingMockData: true };
    }

    const rsvpCountsByEvent = new Map<string, { yes: number; maybe: number }>();
    for (const rsvp of rsvpsResult.data as unknown as EventRsvpAggregateRecord[]) {
      const current = rsvpCountsByEvent.get(rsvp.event_id) ?? { yes: 0, maybe: 0 };
      if (rsvp.response === "yes") current.yes += 1;
      if (rsvp.response === "maybe") current.maybe += 1;
      rsvpCountsByEvent.set(rsvp.event_id, current);
    }

    const data = (eventsResult.data as unknown as CommunityEventRecord[]).map((event) =>
      mapCommunityEvent(event, rsvpCountsByEvent.get(event.id) ?? { yes: 0, maybe: 0 }),
    );

    return { data, usingMockData: false };
  } catch {
    return { data: mockEvents, usingMockData: true };
  }
}

export async function getAdminReportByIdOrMock(id: string, mockReports: MockReport[]): Promise<AdminDataResult<AdminReportDetail | null>> {
  const mockReport = mockReports.find((report) => report.id === id);
  if (mockReport) {
    const mockMessagePreview =
      mockReport.id === "rep_demo_01"
        ? "\"Sen tam bir gerizekalısın, seni bir daha etkinlikte görürsem rezil ederim.\""
        : mockReport.id === "rep_01"
          ? "\"Boş yapmayı bırak, ne anlarsın sen sürüşten?\""
          : mockReport.id === "rep_02"
            ? "Flare açıklamasında yazan pist günü ile gerçek etkinlik lokasyonu eşleşmiyor."
            : "Aynı içerik kısa aralıklarla tekrar paylaşılmış görünüyor.";

    const mockTargetLabel =
      mockReport.id === "rep_demo_01"
        ? "kaanbiscione"
        : mockReport.id === "rep_01"
          ? "pitqueen"
          : mockReport.id === "rep_02"
            ? "alpdrive"
            : "bogaz-night-riders";

    const mockDescription =
      mockReport.id === "rep_demo_01"
        ? "Bildiren kullanıcı, özel mesajlaşmada doğrudan küfür ve hedef gösterme dili kullanıldığını belirtti."
        : mockReport.contentType === "message"
          ? "Mesaj zinciri içinde kişisel saldırı ve topluluk huzurunu bozan dil raporlandı."
          : mockReport.contentType === "flare"
            ? "Etkinlik detaylarının yanıltıcı olduğu ve kullanıcıları yanlış lokasyona yönlendirdiği iddia ediliyor."
            : "Topluluk akışında spam veya tekrar içerik olduğu bildirildi.";

    const mockSeverityReason = deriveSeverityRecommendation({
      reason: mockReport.severity === "high" ? "harassment" : mockReport.severity === "medium" ? "fake" : "spam",
      contentType: mockReport.contentType === "community_post" ? "community" : mockReport.contentType,
      contentPreviewBody: mockMessagePreview,
      priorReportsCount: mockReport.id === "rep_demo_01" ? 2 : mockReport.id === "rep_01" ? 1 : 0,
      targetStatus: mockReport.id === "rep_03" ? "suspended" : "active",
    });

    return {
      data: {
        report: mockReport,
        status: mockReport.status === "pending" ? "pending" : "reviewed",
        actionTaken: mockReport.status === "pending" ? "none" : "user_warned",
        contentType: mockReport.contentType === "community_post" ? "community" : mockReport.contentType,
        description: mockDescription,
        reporterLabel: mockReport.reporter,
        targetUserId: null,
        targetLabel: mockTargetLabel,
        contentPreviewTitle:
          mockReport.contentType === "message"
            ? "Mesaj içeriği"
            : mockReport.contentType === "flare"
              ? "Flare içeriği"
              : "Topluluk gönderisi",
        contentPreviewBody: mockMessagePreview,
        severityRecommendation: mockSeverityReason,
      },
      usingMockData: true,
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const reportResult = await supabase
      .from("reports")
      .select("id, content_type, content_id, reason, status, created_at, description, action_taken, reporter_profile:profiles!reports_reporter_id_fkey(username, display_name)")
      .eq("id", id)
      .maybeSingle();

    if (reportResult.error || !reportResult.data) {
      return { data: null, usingMockData: false };
    }

    const report = reportResult.data as unknown as ReportDetailRecord;
    let targetUserId: string | null = null;
    let targetLabel = "İçerik sahibi bulunamadı";
    let contentPreviewTitle = "Raporlanan içerik";
    let contentPreviewBody = "Bu içerik için önizleme bilgisi bulunmuyor.";
    let targetStatus: "active" | "suspended" | "unknown" = "unknown";
    let priorReportsCount = 0;

    if (report.content_type === "message") {
      const messageResult = await supabase
        .from("messages")
        .select("id, sender_id, body, is_deleted, sender_profile:profiles!messages_sender_id_fkey(username, display_name)")
        .eq("id", report.content_id)
        .maybeSingle();
      const message = messageResult.data as unknown as MessageContentRecord | null;
      if (message) {
        targetUserId = message.sender_id;
        targetLabel = profileLabel(message.sender_profile, shortenId(message.sender_id));
        contentPreviewTitle = message.is_deleted ? "Silinmiş mesaj" : "Mesaj içeriği";
        contentPreviewBody = message.body;
      }
    } else if (report.content_type === "flare") {
      const flareResult = await supabase
        .from("flares")
        .select("id, creator_id, title, description, status, creator_profile:profiles!flares_creator_id_fkey(username, display_name)")
        .eq("id", report.content_id)
        .maybeSingle();
      const flare = flareResult.data as unknown as FlareContentRecord | null;
      if (flare) {
        targetUserId = flare.creator_id;
        targetLabel = profileLabel(flare.creator_profile, shortenId(flare.creator_id));
        contentPreviewTitle = flare.title;
        contentPreviewBody = flare.description ?? `Flare durumu: ${flare.status}`;
      }
    } else if (report.content_type === "community") {
      const communityResult = await supabase
        .from("communities")
        .select("id, owner_id, name, description, owner_profile:profiles!communities_owner_id_fkey(username, display_name)")
        .eq("id", report.content_id)
        .maybeSingle();
      const community = communityResult.data as unknown as CommunityContentRecord | null;
      if (community) {
        targetUserId = community.owner_id;
        targetLabel = profileLabel(community.owner_profile, shortenId(community.owner_id));
        contentPreviewTitle = community.name;
        contentPreviewBody = community.description ?? "Topluluk açıklaması bulunmuyor.";
      }
    } else if (report.content_type === "business_pin") {
      const pinResult = await supabase
        .from("business_pins")
        .select("id, owner_id, name, address, category, owner_profile:profiles!business_pins_owner_id_fkey(username, display_name)")
        .eq("id", report.content_id)
        .maybeSingle();
      const pin = pinResult.data as unknown as BusinessPinContentRecord | null;
      if (pin) {
        targetUserId = pin.owner_id;
        targetLabel = profileLabel(pin.owner_profile, shortenId(pin.owner_id));
        contentPreviewTitle = pin.name;
        contentPreviewBody = `${pin.category} · ${pin.address ?? "Adres yok"}`;
      }
    } else if (report.content_type === "profile") {
      const profileResult = await supabase.from("profiles").select("id, username, display_name, bio").eq("id", report.content_id).maybeSingle();
      const profile = profileResult.data as unknown as ProfileContentRecord | null;
      if (profile) {
        targetUserId = profile.id;
        targetLabel = profile.display_name ?? profile.username ?? shortenId(profile.id);
        contentPreviewTitle = "Profil raporu";
        contentPreviewBody = profile.bio ?? "Profil biyografisi bulunmuyor.";
      }
    } else if (report.content_type === "post") {
      const postResult = await supabase
        .from("posts")
        .select("id, author_id, caption, visibility, deleted_at")
        .eq("id", report.content_id)
        .maybeSingle();
      const post = postResult.data as unknown as PostContentRecord | null;
      if (post) {
        targetUserId = post.author_id;
        targetLabel = shortenId(post.author_id);
        contentPreviewTitle = post.deleted_at ? "Kaldırılmış gönderi" : "Gönderi içeriği";
        contentPreviewBody = post.caption ?? `Visibility: ${post.visibility}`;
      }
    } else if (report.content_type === "comment") {
      const commentResult = await supabase
        .from("comments")
        .select("id, post_id, author_id, body, is_deleted")
        .eq("id", report.content_id)
        .maybeSingle();
      const comment = commentResult.data as unknown as CommentContentPreviewRecord | null;
      if (comment) {
        targetUserId = comment.author_id;
        targetLabel = shortenId(comment.author_id);
        contentPreviewTitle = comment.is_deleted ? "Kaldırılmış yorum" : "Yorum içeriği";
        contentPreviewBody = comment.body;
      }
    }

    if (targetUserId) {
      const [profileStateResult, priorReportsResult] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", targetUserId).maybeSingle(),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("content_type", "profile").eq("content_id", targetUserId),
      ]);

      const targetProfile = profileStateResult.data as Pick<ProfileRow, "role"> | null;
      targetStatus = targetProfile?.role === "banned" ? "suspended" : targetProfile ? "active" : "unknown";
      priorReportsCount = priorReportsResult.count ?? 0;
    }

    const severity = deriveReportSeverity(report.reason);
    const mappedReport: MockReport = {
      id: report.id,
      contentType: mapContentType(report.content_type),
      reason: mapReason(report.reason),
      reporter: report.reporter_profile?.username ?? report.reporter_profile?.display_name ?? "anonim",
      createdAt: formatDateTime(report.created_at),
      severity,
      status: report.status === "pending" ? "pending" : "reviewing",
    };

    return {
      data: {
        report: mappedReport,
        status: report.status,
        actionTaken: report.action_taken ?? "none",
        contentType: report.content_type,
        description: report.description,
        reporterLabel: mappedReport.reporter,
        targetUserId,
        targetLabel,
        contentPreviewTitle,
        contentPreviewBody,
        severityRecommendation: deriveSeverityRecommendation({
          reason: report.reason,
          contentType: report.content_type,
          contentPreviewBody,
          priorReportsCount,
          targetStatus,
        }),
      },
      usingMockData: false,
    };
  } catch {
    return { data: null, usingMockData: false };
  }
}
