export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  role: "user" | "moderator" | "admin";
  avatarUrl: string | null;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  locationShareMode: "everyone" | "followers" | "none";
  city: string;
  reports: number;
  createdAt: string;
  status: "active" | "suspended";
  bio: string;
  phone: string;
  lastSeenAt: string;
  supportNote: string;
  vehicles: Array<{
    id: string;
    type: "car" | "motorcycle" | "other";
    make: string;
    model: string;
    year: number;
    isPrimary: boolean;
  }>;
  communities: Array<{
    id: string;
    name: string;
    role: "captain" | "moderator" | "member";
  }>;
  reportHistory: Array<{
    id: string;
    reason: string;
    status: "pending" | "reviewing" | "resolved";
    createdAt: string;
  }>;
  followers: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isPrivate: boolean;
    followedAt: string;
  }>;
  following: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isPrivate: boolean;
    followedAt: string;
  }>;
}

export interface MockCommunity {
  id: string;
  name: string;
  slug: string;
  city: string;
  members: number;
  type: "public" | "private" | "secret";
  vehicleType: "car" | "motorcycle" | "all";
  description: string;
  foundedAt: string;
  captain: string;
  moderationNote: string;
  memberList: Array<{
    id: string;
    name: string;
    role: "captain" | "moderator" | "member";
  }>;
  activeFlares: Array<{
    id: string;
    title: string;
    startsAt: string;
    rsvpCount: number;
    status: "active" | "draft" | "cancelled";
  }>;
}

export interface MockPin {
  id: string;
  name: string;
  category: "garage" | "repair" | "parts" | "fuel" | "cafe" | "other";
  owner: string;
  city: string;
  submittedAt: string;
  status: "pending" | "verified" | "rejected";
}

export interface MockReport {
  id: string;
  contentType: "message" | "flare" | "community_post" | "post" | "comment";
  reason: string;
  reporter: string;
  createdAt: string;
  severity: "low" | "medium" | "high";
  status: "pending" | "reviewing";
}

export interface MockModerationPost {
  id: string;
  authorName: string;
  authorUsername: string;
  authorStatus: "active" | "suspended";
  caption: string;
  visibility: "public" | "followers" | "private";
  mediaKind: "image" | "video" | "none";
  mediaPreviewUrl: string | null;
  reportsCount: number;
  commentsCount: number;
  latestReportReason: string | null;
  latestReportAt: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export interface MockModerationComment {
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

export interface MockHelpRequest {
  id: string;
  requester: string;
  city: string;
  issueType: "breakdown" | "flat_tire" | "fuel" | "accident" | "other";
  status: "open" | "matched" | "resolved" | "cancelled";
  createdAt: string;
  note: string;
}

export interface MockInviteCode {
  code: string;
  inviterLabel: string;
  usesCount: number;
  maxUses: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface MockWaitingListEntry {
  id: string;
  email: string;
  vehicleType: "car" | "motorcycle" | "other" | null;
  city: string | null;
  invitedAt: string | null;
  createdAt: string;
}

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export interface MockAuditEntry {
  id: string;
  createdAt: string;
  actorLabel: string;
  actorRole: "admin" | "moderator" | "user" | "unknown";
  action: "user_banned" | "user_unbanned" | "content_deleted" | "content_restored" | "pin_verified" | "pin_rejected" | "config_changed" | "report_resolved";
  targetType: string;
  targetId: string;
  summary: string;
}

export interface MockSystemNotification {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
}

export interface MockStatusComponent {
  key: "api" | "realtime" | "push" | "media" | "admin";
  label: string;
  status: "operational" | "degraded" | "partial_outage" | "major_outage";
  note: string;
}

export interface MockStatusPage {
  publicUrl: string;
  incident: {
    phase: "investigating" | "identified" | "monitoring" | "resolved";
    message: string;
    updatedAt: string;
  };
  components: MockStatusComponent[];
}

export interface MockCommunityRulesConfig {
  version: string;
  publishedUrl: string;
  trText: string;
  enText: string;
  updatedAt: string;
}

export interface MockExportRequest {
  id: string;
  requesterLabel: string;
  channel: "app" | "support";
  status: "queued" | "processing" | "ready" | "expired" | "failed";
  requestedAt: string;
  readyAt: string | null;
  expiresAt: string | null;
}

export const mockUsers: MockUser[] = [
  {
    id: "usr_01",
    username: "aygaz",
    displayName: "Ayga Zengin",
    role: "moderator",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    isPrivate: false,
    followersCount: 2,
    followingCount: 1,
    locationShareMode: "everyone",
    city: "Istanbul",
    reports: 1,
    createdAt: "2026-05-01",
    status: "active",
    bio: "Gece surusleri ve pist gunleriyle ilgileniyor.",
    phone: "+90 532 100 10 10",
    lastSeenAt: "2026-05-07 20:15",
    supportNote: "Topluluk moderasyonunda aktif, hata raporlarina hizli donuyor.",
    vehicles: [
      { id: "veh_01", type: "motorcycle", make: "Yamaha", model: "MT-07", year: 2023, isPrimary: true },
      { id: "veh_02", type: "car", make: "Mini", model: "Cooper S", year: 2020, isPrimary: false },
    ],
    communities: [
      { id: "com_01", name: "Bogaz Night Riders", role: "moderator" },
      { id: "com_03", name: "Route 35 Garage", role: "member" },
    ],
    reportHistory: [
      { id: "rpt_hist_01", reason: "Yanit dili sert", status: "resolved", createdAt: "2026-05-02 12:10" },
    ],
    followers: [
      {
        id: "usr_02",
        username: "alpdrive",
        displayName: "Alp Koc",
        avatarUrl: null,
        isPrivate: true,
        followedAt: "2026-05-05 14:20",
      },
      {
        id: "usr_03",
        username: "pitqueen",
        displayName: "Ece Karaca",
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80",
        isPrivate: false,
        followedAt: "2026-05-04 09:15",
      },
    ],
    following: [
      {
        id: "usr_03",
        username: "pitqueen",
        displayName: "Ece Karaca",
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80",
        isPrivate: false,
        followedAt: "2026-05-06 21:10",
      },
    ],
  },
  {
    id: "usr_02",
    username: "alpdrive",
    displayName: "Alp Koc",
    role: "user",
    avatarUrl: null,
    isPrivate: true,
    followersCount: 0,
    followingCount: 1,
    locationShareMode: "followers",
    city: "Ankara",
    reports: 3,
    createdAt: "2026-04-28",
    status: "active",
    bio: "Track day organizasyonlarina katiliyor ve flare olusturuyor.",
    phone: "+90 533 200 20 20",
    lastSeenAt: "2026-05-07 19:42",
    supportNote: "Son 1 haftada 2 flare iptal etti; tekrar davranisi izlenecek.",
    vehicles: [
      { id: "veh_03", type: "car", make: "Honda", model: "Civic Type R", year: 2022, isPrimary: true },
    ],
    communities: [
      { id: "com_02", name: "Ankara Track Days", role: "member" },
    ],
    reportHistory: [
      { id: "rpt_hist_02", reason: "Yaniltici flare bilgisi", status: "reviewing", createdAt: "2026-05-07 15:05" },
      { id: "rpt_hist_03", reason: "Spam yorum", status: "resolved", createdAt: "2026-05-01 18:45" },
      { id: "rpt_hist_04", reason: "Kurallara aykiri dil", status: "pending", createdAt: "2026-04-30 22:11" },
    ],
    followers: [],
    following: [
      {
        id: "usr_01",
        username: "aygaz",
        displayName: "Ayga Zengin",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
        isPrivate: false,
        followedAt: "2026-05-05 14:20",
      },
    ],
  },
  {
    id: "usr_03",
    username: "pitqueen",
    displayName: "Ece Karaca",
    role: "user",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80",
    isPrivate: false,
    followersCount: 1,
    followingCount: 1,
    locationShareMode: "none",
    city: "Izmir",
    reports: 0,
    createdAt: "2026-04-17",
    status: "suspended",
    bio: "Kafe bulusmalari ve sehir ici kisa rotalara odaklaniyor.",
    phone: "+90 534 300 30 30",
    lastSeenAt: "2026-05-05 09:30",
    supportNote: "7 gunluk gecici askida. Yeniden aktiflestirme once destek onayi isteyecek.",
    vehicles: [
      { id: "veh_04", type: "other", make: "Vespa", model: "Primavera", year: 2021, isPrimary: true },
    ],
    communities: [
      { id: "com_03", name: "Route 35 Garage", role: "member" },
    ],
    reportHistory: [],
    followers: [
      {
        id: "usr_01",
        username: "aygaz",
        displayName: "Ayga Zengin",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
        isPrivate: false,
        followedAt: "2026-05-06 21:10",
      },
    ],
    following: [
      {
        id: "usr_01",
        username: "aygaz",
        displayName: "Ayga Zengin",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
        isPrivate: false,
        followedAt: "2026-05-04 09:15",
      },
    ],
  },
];

export const mockCommunities: MockCommunity[] = [
  {
    id: "com_demo_alfistiler",
    name: "Alfistiler",
    slug: "alfistiler",
    city: "Istanbul",
    members: 47,
    type: "public",
    vehicleType: "car",
    description: "Alfa Romeo odakli topluluk; sehir ici bulusmalar, sahil rotalari ve teknik paylasimlarla ilerliyor.",
    foundedAt: "2026-01-12",
    captain: "Mert Caglar",
    moderationNote: "Yeni buyuyen topluluk. Sohbet tonu sicak ama marka atismalari zaman zaman sertlesiyor.",
    memberList: [
      { id: "usr_demo_01", name: "Mert Caglar", role: "captain" },
      { id: "usr_demo_02", name: "Sena Akin", role: "moderator" },
      { id: "usr_demo_03", name: "Kaan Efe", role: "member" },
    ],
    activeFlares: [
      { id: "flr_demo_01", title: "Pazar sabahi sahil konvoyu", startsAt: "2026-05-18 09:00", rsvpCount: 19, status: "active" },
      { id: "flr_demo_02", title: "Atolye kahve bulusmasi", startsAt: "2026-05-21 20:30", rsvpCount: 11, status: "draft" },
    ],
  },
  {
    id: "com_01",
    name: "Bogaz Night Riders",
    slug: "bogaz-night-riders",
    city: "Istanbul",
    members: 128,
    type: "public",
    vehicleType: "motorcycle",
    description: "Bogaz hattinda gece surusleri ve hafta sonu bulusmalari organize eden motosiklet toplulugu.",
    foundedAt: "2025-11-03",
    captain: "Ayga Zengin",
    moderationNote: "Rota duyurulari net. Son 30 gunde moderasyon aksiyonu gerektirmedi.",
    memberList: [
      { id: "usr_01", name: "Ayga Zengin", role: "moderator" },
      { id: "usr_04", name: "Can Arda", role: "captain" },
      { id: "usr_05", name: "Bora Sener", role: "member" },
    ],
    activeFlares: [
      { id: "flr_01", title: "Cuma gece boğaz turu", startsAt: "2026-05-09 22:00", rsvpCount: 36, status: "active" },
      { id: "flr_02", title: "Pazar kahve molası", startsAt: "2026-05-11 10:30", rsvpCount: 18, status: "active" },
    ],
  },
  {
    id: "com_02",
    name: "Ankara Track Days",
    slug: "ankara-track-days",
    city: "Ankara",
    members: 86,
    type: "private",
    vehicleType: "car",
    description: "Pist gunleri, telemetri paylasimi ve arac hazirlik oturumlari odakli otomobil toplulugu.",
    foundedAt: "2025-12-19",
    captain: "Emir Demir",
    moderationNote: "Uyelik talepleri manuel inceleniyor. Yeni gelen 4 rapor henuz risk olusturmuyor.",
    memberList: [
      { id: "usr_02", name: "Alp Koc", role: "member" },
      { id: "usr_06", name: "Emir Demir", role: "captain" },
      { id: "usr_07", name: "Mina Ates", role: "moderator" },
    ],
    activeFlares: [
      { id: "flr_03", title: "Hafta sonu pist seansı", startsAt: "2026-05-10 08:00", rsvpCount: 24, status: "active" },
      { id: "flr_04", title: "Telemetri workshop", startsAt: "2026-05-14 19:30", rsvpCount: 12, status: "draft" },
    ],
  },
  {
    id: "com_03",
    name: "Route 35 Garage",
    slug: "route-35-garage",
    city: "Izmir",
    members: 214,
    type: "public",
    vehicleType: "all",
    description: "Karma arac toplulugu; sehir ici etkinlikler, kafe bulusmalari ve ortak rota paylasimlari yapiyor.",
    foundedAt: "2025-08-08",
    captain: "Doga Tunc",
    moderationNote: "Mesaj akisi hizli. Yeni moderasyon araclari geldiğinde topluluk sohbeti ilk adaylardan biri.",
    memberList: [
      { id: "usr_03", name: "Ece Karaca", role: "member" },
      { id: "usr_08", name: "Doga Tunc", role: "captain" },
      { id: "usr_09", name: "Selin Ucar", role: "member" },
    ],
    activeFlares: [
      { id: "flr_05", title: "Moda rotası buluşması", startsAt: "2026-05-12 20:00", rsvpCount: 41, status: "active" },
    ],
  },
];

export const mockPins: MockPin[] = [
  {
    id: "pin_01",
    name: "Redline Garage",
    category: "repair",
    owner: "Mert Yildiz",
    city: "Istanbul",
    submittedAt: "2026-05-06",
    status: "pending",
  },
  {
    id: "pin_02",
    name: "Fuel Stop North",
    category: "fuel",
    owner: "Selin Akca",
    city: "Bursa",
    submittedAt: "2026-05-05",
    status: "pending",
  },
  {
    id: "pin_03",
    name: "Pit Cafe Moda",
    category: "cafe",
    owner: "Doga Tunc",
    city: "Istanbul",
    submittedAt: "2026-05-03",
    status: "verified",
  },
];

export const mockReports: MockReport[] = [
  {
    id: "rep_demo_01",
    contentType: "message",
    reason: "Mesaj icinde agir kufur ve hedef gosteren dil kullanimi",
    reporter: "alfaromeosever",
    createdAt: "2026-05-11 18:05",
    severity: "high",
    status: "pending",
  },
  {
    id: "rep_01",
    contentType: "message",
    reason: "Hakaret ve kisisel saldiri",
    reporter: "ecekaraca",
    createdAt: "2026-05-07 17:20",
    severity: "high",
    status: "pending",
  },
  {
    id: "rep_02",
    contentType: "flare",
    reason: "Yaniltici etkinlik bilgisi",
    reporter: "alpdrive",
    createdAt: "2026-05-07 15:05",
    severity: "medium",
    status: "reviewing",
  },
  {
    id: "rep_03",
    contentType: "community_post",
    reason: "Spam ve tekrar icerik",
    reporter: "aygaz",
    createdAt: "2026-05-06 21:40",
    severity: "low",
    status: "pending",
  },
];

export const mockModerationPosts: MockModerationPost[] = [
  {
    id: "post_demo_01",
    authorName: "Ayga Zengin",
    authorUsername: "aygaz",
    authorStatus: "active",
    caption: "Gece surusunden sonra bos otoparkta donut videosu. Acik yolda tekrar denemeyin.",
    visibility: "public",
    mediaKind: "video",
    mediaPreviewUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    reportsCount: 4,
    commentsCount: 7,
    latestReportReason: "Tehlikeli surus davranisini ozendiriyor",
    latestReportAt: "2026-05-21 10:42",
    createdAt: "2026-05-20 23:18",
    deletedAt: null,
  },
  {
    id: "post_demo_02",
    authorName: "Alp Koc",
    authorUsername: "alpdrive",
    authorStatus: "active",
    caption: "Track day kareleri ve setup notlari.",
    visibility: "followers",
    mediaKind: "image",
    mediaPreviewUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
    reportsCount: 1,
    commentsCount: 3,
    latestReportReason: "Marka mentionlariyla gereksiz tartisma cikariyor",
    latestReportAt: "2026-05-20 18:05",
    createdAt: "2026-05-20 15:12",
    deletedAt: null,
  },
  {
    id: "post_demo_03",
    authorName: "Ece Karaca",
    authorUsername: "pitqueen",
    authorStatus: "suspended",
    caption: "Satilik jant duyurusu tekrar tekrar paylasildi.",
    visibility: "public",
    mediaKind: "none",
    mediaPreviewUrl: null,
    reportsCount: 0,
    commentsCount: 1,
    latestReportReason: null,
    latestReportAt: null,
    createdAt: "2026-05-18 12:30",
    deletedAt: "2026-05-19 08:10",
  },
];

export const mockModerationComments: MockModerationComment[] = [
  {
    id: "comment_demo_01",
    postId: "post_demo_01",
    postCaption: "Gece surusunden sonra bos otoparkta donut videosu.",
    authorName: "Kaan Efe",
    authorUsername: "kaane",
    authorStatus: "active",
    body: "Aynisini E5'te dene gorelim :)",
    reportsCount: 3,
    latestReportReason: "Tehlikeli davranis ve tahrik",
    latestReportAt: "2026-05-21 10:55",
    createdAt: "2026-05-21 00:14",
    isDeleted: false,
  },
  {
    id: "comment_demo_02",
    postId: "post_demo_02",
    postCaption: "Track day kareleri ve setup notlari.",
    authorName: "Sena Akin",
    authorUsername: "senaakin",
    authorStatus: "active",
    body: "Bu setup bilgisi eksik, yeni baslayanlari yanlis yonlendiriyor.",
    reportsCount: 1,
    latestReportReason: "Kisileri hedef alan sert uslup",
    latestReportAt: "2026-05-20 19:22",
    createdAt: "2026-05-20 18:40",
    isDeleted: false,
  },
  {
    id: "comment_demo_03",
    postId: "post_demo_03",
    postCaption: "Satilik jant duyurusu tekrar tekrar paylasildi.",
    authorName: "Mert Caglar",
    authorUsername: "mertc",
    authorStatus: "active",
    body: "Ayni ilan ucuncu kez acilmis, kaldiralim.",
    reportsCount: 0,
    latestReportReason: null,
    latestReportAt: null,
    createdAt: "2026-05-18 12:45",
    isDeleted: true,
  },
];

export const mockHelpRequests: MockHelpRequest[] = [
  {
    id: "help_demo_01",
    requester: "Mert Koc",
    city: "Istanbul",
    issueType: "breakdown",
    status: "open",
    createdAt: "2026-05-17 21:40",
    note: "Araç çalışmıyor, sahil yolunda güvenli alana çekilmiş durumda.",
  },
  {
    id: "help_demo_02",
    requester: "Sena Akin",
    city: "Ankara",
    issueType: "flat_tire",
    status: "matched",
    createdAt: "2026-05-17 19:05",
    note: "Lastik patladı, yakındaki kullanıcı ile eşleşme yapıldı.",
  },
  {
    id: "help_demo_03",
    requester: "Kaan Efe",
    city: "Izmir",
    issueType: "fuel",
    status: "resolved",
    createdAt: "2026-05-16 23:18",
    note: "Yakıt desteği sağlandı, talep kapatıldı.",
  },
];

export const mockInviteCodes: MockInviteCode[] = [
  {
    code: "ROLLPIT-ALFA-9K3X",
    inviterLabel: "Mert Çağlar",
    usesCount: 3,
    maxUses: 5,
    expiresAt: "2026-06-01 23:59",
    createdAt: "2026-05-10 18:20",
  },
  {
    code: "ROLLPIT-BETA-2L7Q",
    inviterLabel: "Sena Akın",
    usesCount: 1,
    maxUses: 5,
    expiresAt: null,
    createdAt: "2026-05-12 12:05",
  },
  {
    code: "ROLLPIT-GRID-8M4P",
    inviterLabel: "Admin havuzu",
    usesCount: 0,
    maxUses: 10,
    expiresAt: "2026-06-15 23:59",
    createdAt: "2026-05-16 09:40",
  },
];

export const mockWaitingList: MockWaitingListEntry[] = [
  {
    id: "wait_demo_01",
    email: "alfaistanbul@example.com",
    vehicleType: "car",
    city: "Istanbul",
    invitedAt: null,
    createdAt: "2026-05-13 09:20",
  },
  {
    id: "wait_demo_02",
    email: "riderankara@example.com",
    vehicleType: "motorcycle",
    city: "Ankara",
    invitedAt: "2026-05-16 14:00",
    createdAt: "2026-05-12 18:05",
  },
  {
    id: "wait_demo_03",
    email: "garaj35@example.com",
    vehicleType: "other",
    city: "Izmir",
    invitedAt: null,
    createdAt: "2026-05-11 11:45",
  },
];

export const mockAnalytics = {
  mau: [
    { label: "Ocak", value: 320 },
    { label: "Subat", value: 480 },
    { label: "Mart", value: 710 },
    { label: "Nisan", value: 920 },
    { label: "Mayis", value: 1180 },
  ] satisfies AnalyticsPoint[],
  flares: [
    { label: "Pzt", value: 6 },
    { label: "Sali", value: 8 },
    { label: "Cars", value: 12 },
    { label: "Pers", value: 5 },
    { label: "Cuma", value: 14 },
    { label: "Cmt", value: 18 },
    { label: "Paz", value: 10 },
  ] satisfies AnalyticsPoint[],
  help: [
    { label: "Ariza", value: 8 },
    { label: "Lastik", value: 5 },
    { label: "Yakit", value: 3 },
    { label: "Kaza", value: 1 },
    { label: "Diger", value: 2 },
  ] satisfies AnalyticsPoint[],
  communities: [
    { label: "Ocak", value: 2 },
    { label: "Subat", value: 3 },
    { label: "Mart", value: 4 },
    { label: "Nisan", value: 2 },
    { label: "Mayis", value: 5 },
  ] satisfies AnalyticsPoint[],
  helpResponseTimes: [
    { label: "Ocak", value: 11 },
    { label: "Subat", value: 9 },
    { label: "Mart", value: 7 },
    { label: "Nisan", value: 6 },
    { label: "Mayis", value: 5 },
  ] satisfies AnalyticsPoint[],
  waitingListGrowth: [
    { label: "Ocak", value: 18 },
    { label: "Subat", value: 26 },
    { label: "Mart", value: 34 },
    { label: "Nisan", value: 41 },
    { label: "Mayis", value: 57 },
  ] satisfies AnalyticsPoint[],
};

export const mockFlags = [
  {
    key: "feature_business_pins",
    description: "İşletme pinleri mobil istemcide görünsün mü",
    enabled: true,
  },
  {
    key: "feature_help_requests",
    description: "Yardım talepleri yeni kullanıcılar için açık mı",
    enabled: true,
  },
  {
    key: "feature_waiting_list",
    description: "Bekleme listesi dalga davet akışlarını aç",
    enabled: false,
  },
];

export const mockAuditEntries: MockAuditEntry[] = [
  {
    id: "audit_01",
    createdAt: "11.05.2026 18:34",
    actorLabel: "admin@rollpit.test",
    actorRole: "admin",
    action: "pin_verified",
    targetType: "business_pin",
    targetId: "pin_03",
    summary: "Pit Cafe Moda için doğrulama tamamlandı.",
  },
  {
    id: "audit_02",
    createdAt: "11.05.2026 18:12",
    actorLabel: "admin@rollpit.test",
    actorRole: "admin",
    action: "report_resolved",
    targetType: "report",
    targetId: "rep_demo_01",
    summary: "Küfür içeren mesaj raporu için moderasyon akışı başlatıldı.",
  },
  {
    id: "audit_02b",
    createdAt: "11.05.2026 18:02",
    actorLabel: "admin@rollpit.test",
    actorRole: "admin",
    action: "content_restored",
    targetType: "post",
    targetId: "post_demo_03",
    summary: "Yanlış kaldırılan gönderi moderasyon sonrası geri açıldı.",
  },
  {
    id: "audit_03",
    createdAt: "11.05.2026 17:48",
    actorLabel: "admin@rollpit.test",
    actorRole: "admin",
    action: "config_changed",
    targetType: "support_note",
    targetId: "usr_02",
    summary: "Kullanıcı için destek notu kaydedildi.",
  },
];

export const mockSystemNotifications: MockSystemNotification[] = [
  {
    id: "notif_sys_01",
    title: "Hafta sonu bakım penceresi",
    body: "Pazar 02:00 - 03:00 arasında kısa süreli bakım çalışması yapılacak.",
    audience: "Tüm kullanıcılar",
    createdAt: "11.05.2026 19:10",
  },
  {
    id: "notif_sys_02",
    title: "Topluluk kuralları güncellendi",
    body: "Hakaret ve kişisel saldırı maddesi daha net hale getirildi. Lütfen tekrar gözden geçir.",
    audience: "Tüm kullanıcılar",
    createdAt: "11.05.2026 16:40",
  },
];

export const mockStatusPage: MockStatusPage = {
  publicUrl: "https://status.rollpit.app",
  incident: {
    phase: "investigating",
    message: "API yanıt sürelerinde dalgalanma gözleniyor. Ekip canlı ortamı izliyor ve kalıcı çözümü hazırlıyor.",
    updatedAt: "17.05.2026 15:20",
  },
  components: [
    { key: "api", label: "API", status: "degraded", note: "Bazı isteklerde gecikme artışı var." },
    { key: "realtime", label: "Realtime", status: "operational", note: "WebSocket bağlantıları stabil." },
    { key: "push", label: "Push Bildirimleri", status: "operational", note: "Bildirim kuyruğu normal hızda." },
    { key: "media", label: "Medya Hattı", status: "partial_outage", note: "Yüklenen bazı görseller geç işleniyor." },
    { key: "admin", label: "Admin Panel", status: "operational", note: "Panel giriş ve moderasyon akışları açık." },
  ],
};

export const mockCommunityRulesConfig: MockCommunityRulesConfig = {
  version: "v1.0",
  publishedUrl: "https://rollpit.app/community-guidelines",
  updatedAt: "17.05.2026 15:45",
  trText: `ROLLPIT TOPLULUK KURALLARI

1. SAYGI
- Hakaret, ayrımcılık, taciz ve tehdit yasaktır.
- Aile, din ve siyaset eksenli kavga dili topluluğun parçası değildir.

2. GÜVENLİK
- Sürüş sırasında uygulamayı aktif kullanmak yasaktır.
- Sokak yarışı çağrısı, tehlikeli sürüş özendirmesi ve sahte SOS içerikleri silinir.

3. DOĞRULUK
- Sahte yardım çağrısı, sahte etkinlik ve yanlış işletme bilgisi kalıcı yaptırıma kadar gider.

4. MAHREMİYET
- İzinsiz fotoğraf, plaka, telefon ve canlı konum paylaşımı yasaktır.

5. UYGUNSUZ İÇERİK
- NSFW, şiddet, yasa dışı ürün/hizmet, telif ihlali ve ağır gore içerikleri yasaktır.

6. SPAM VE TİCARİ KULLANIM
- Doğrulanmamış ticari tanıtım ve aynı içeriğin tekrar tekrar paylaşılması yasaktır.

7. SONUÇLAR
- Uyarı → içerik silme → geçici askıya alma → kalıcı ban akışı uygulanır.

8. İTİRAZ
- privacy@rollpit.app üzerinden 30 gün içinde itiraz edebilirsin.`,
  enText: `ROLLPIT COMMUNITY GUIDELINES

1. RESPECT
- No insults, discrimination, harassment, or threats.

2. SAFETY
- No app use while driving and no promotion of unsafe driving or street racing.

3. AUTHENTICITY
- Fake help signals, fake events, and false business claims are prohibited.

4. PRIVACY
- Do not share another person's photo, plate number, phone number, or live location without consent.

5. INAPPROPRIATE CONTENT
- No NSFW, violence, illegal content, or copyright infringement.

6. SPAM AND COMMERCIAL USE
- No repeated spam posting and no commercial promotion outside verified business tools.

7. CONSEQUENCES
- Warning → content removal → temporary suspension → permanent ban.

8. APPEALS
- Contact privacy@rollpit.app within 30 days for an appeal.`,
};

export const mockExportRequests: MockExportRequest[] = [
  {
    id: "exp_01",
    requesterLabel: "alfaromesever",
    channel: "app",
    status: "ready",
    requestedAt: "16.05.2026 11:20",
    readyAt: "16.05.2026 12:05",
    expiresAt: "18.05.2026 12:05",
  },
  {
    id: "exp_02",
    requesterLabel: "gizem.track",
    channel: "support",
    status: "processing",
    requestedAt: "17.05.2026 09:10",
    readyAt: null,
    expiresAt: null,
  },
];

export function getMockUserById(id: string): MockUser | undefined {
  return mockUsers.find((user) => user.id === id);
}

export function getMockCommunityById(id: string): MockCommunity | undefined {
  return mockCommunities.find((community) => community.id === id);
}
