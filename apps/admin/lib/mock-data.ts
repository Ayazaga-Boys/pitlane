export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  role: "user" | "moderator" | "admin";
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
  contentType: "message" | "flare" | "community_post";
  reason: string;
  reporter: string;
  createdAt: string;
  severity: "low" | "medium" | "high";
  status: "pending" | "reviewing";
}

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export const mockUsers: MockUser[] = [
  {
    id: "usr_01",
    username: "aygaz",
    displayName: "Ayga Zengin",
    role: "moderator",
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
  },
  {
    id: "usr_02",
    username: "alpdrive",
    displayName: "Alp Koc",
    role: "user",
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
  },
  {
    id: "usr_03",
    username: "pitqueen",
    displayName: "Ece Karaca",
    role: "user",
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
  },
];

export const mockCommunities: MockCommunity[] = [
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

export function getMockUserById(id: string): MockUser | undefined {
  return mockUsers.find((user) => user.id === id);
}

export function getMockCommunityById(id: string): MockCommunity | undefined {
  return mockCommunities.find((community) => community.id === id);
}
