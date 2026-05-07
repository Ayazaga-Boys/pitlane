export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  role: "user" | "moderator" | "admin";
  city: string;
  reports: number;
  createdAt: string;
  status: "active" | "suspended";
}

export interface MockCommunity {
  id: string;
  name: string;
  slug: string;
  city: string;
  members: number;
  type: "public" | "private" | "secret";
  vehicleType: "car" | "motorcycle" | "all";
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
  },
  {
    id: "com_02",
    name: "Ankara Track Days",
    slug: "ankara-track-days",
    city: "Ankara",
    members: 86,
    type: "private",
    vehicleType: "car",
  },
  {
    id: "com_03",
    name: "Route 35 Garage",
    slug: "route-35-garage",
    city: "Izmir",
    members: 214,
    type: "public",
    vehicleType: "all",
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
