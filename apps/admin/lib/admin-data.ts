import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { MockCommunity, MockPin, MockReport, MockUser } from "@/lib/mock-data";
import type {
  BusinessPinRow,
  CommunityMemberRow,
  CommunityRow,
  FlareRow,
  ProfileRow,
  ReportRow,
  VehicleRow,
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

interface UserRecord extends Pick<ProfileRow, "id" | "username" | "display_name" | "bio" | "role" | "created_at" | "updated_at"> {}

interface VehicleRecord extends Pick<VehicleRow, "id" | "user_id" | "type" | "make" | "model" | "year" | "is_primary"> {}

interface CommunityMembershipRecord extends Pick<CommunityMemberRow, "community_id" | "user_id" | "role"> {
  community: Pick<CommunityRow, "id" | "name" | "city"> | null;
}

interface UserReportRecord extends Pick<ReportRow, "id" | "reason" | "status" | "created_at"> {}

interface CommunityRecord
  extends Pick<CommunityRow, "id" | "name" | "slug" | "city" | "member_count" | "type" | "vehicle_type" | "description" | "created_at"> {
  owner_profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface CommunityMemberDetailRecord extends Pick<CommunityMemberRow, "community_id" | "user_id" | "role"> {
  profile: Pick<ProfileRow, "username" | "display_name"> | null;
}

interface CommunityFlareRecord extends Pick<FlareRow, "id" | "community_id" | "title" | "starts_at" | "rsvp_count" | "status"> {}

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

function shortenId(id: string): string {
  return id.slice(0, 8);
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

function buildMockUser(
  user: UserRecord,
  vehicles: VehicleRecord[],
  memberships: CommunityMembershipRecord[],
  reportHistory: UserReportRecord[],
): MockUser {
  const displayName = user.display_name ?? user.username ?? shortenId(user.id);
  const username = user.username ?? user.id.slice(0, 8);
  const city = memberships.find((membership) => membership.community?.city)?.community?.city ?? "Belirtilmedi";

  return {
    id: user.id,
    username,
    displayName,
    role: mapUserRole(user.role),
    city,
    reports: reportHistory.length,
    createdAt: formatDate(user.created_at),
    status: "active",
    bio: user.bio ?? "Profil biyografisi henüz girilmemiş.",
    phone: "Kayıtlı değil",
    lastSeenAt: formatDateTime(user.updated_at),
    supportNote: deriveSupportNote(user, memberships, reportHistory.length),
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
  };
}

function buildMockCommunity(
  community: CommunityRecord,
  memberList: CommunityMemberDetailRecord[],
  activeFlares: CommunityFlareRecord[],
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
    memberList: memberList.map((member) => ({
      id: member.user_id,
      name: profileLabel(member.profile, shortenId(member.user_id)),
      role: member.role,
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

    return { data, usingMockData: false };
  } catch {
    return { data: mockReports, usingMockData: true };
  }
}

export async function getAdminUsersOrMock(mockUsers: MockUser[]): Promise<AdminDataResult<MockUser[]>> {
  try {
    const supabase = createAdminSupabaseClient();
    const [{ data: profiles, error: profilesError }, { data: vehicles, error: vehiclesError }, { data: memberships, error: membershipsError }] =
      await Promise.all([
        supabase.from("profiles").select("id, username, display_name, bio, role, created_at, updated_at").order("created_at", { ascending: false }),
        supabase.from("vehicles").select("id, user_id, type, make, model, year, is_primary"),
        supabase.from("community_members").select("community_id, user_id, role, community:communities(id, name, city)"),
      ]);

    if (profilesError || vehiclesError || membershipsError || !profiles || !vehicles || !memberships) {
      return { data: mockUsers, usingMockData: true };
    }

    const profileIds = (profiles as unknown as UserRecord[]).map((profile) => profile.id);
    const reportsResult = await supabase
      .from("reports")
      .select("id, content_id, reason, status, created_at")
      .eq("content_type", "profile")
      .in("content_id", profileIds);

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

    return {
      data: (profiles as unknown as UserRecord[]).map((profile) =>
        buildMockUser(
          profile,
          vehiclesByUser.get(profile.id) ?? [],
          membershipsByUser.get(profile.id) ?? [],
          reportsByUser.get(profile.id) ?? [],
        ),
      ),
      usingMockData: false,
    };
  } catch {
    return { data: mockUsers, usingMockData: true };
  }
}

export async function getAdminUserByIdOrMock(id: string, mockUsers: MockUser[]): Promise<AdminDataResult<MockUser | null>> {
  const mockUser = mockUsers.find((user) => user.id === id);
  if (mockUser) {
    return { data: mockUser, usingMockData: true };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const [{ data: profile, error: profileError }, { data: vehicles, error: vehiclesError }, { data: memberships, error: membershipsError }, { data: reports, error: reportsError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, bio, role, created_at, updated_at")
          .eq("id", id)
          .maybeSingle(),
        supabase.from("vehicles").select("id, user_id, type, make, model, year, is_primary").eq("user_id", id),
        supabase.from("community_members").select("community_id, user_id, role, community:communities(id, name, city)").eq("user_id", id),
        supabase.from("reports").select("id, reason, status, created_at").eq("content_type", "profile").eq("content_id", id).order("created_at", { ascending: false }),
      ]);

    if (profileError || vehiclesError || membershipsError || reportsError || !profile) {
      return { data: null, usingMockData: false };
    }

    return {
      data: buildMockUser(
        profile as unknown as UserRecord,
        (vehicles as unknown as VehicleRecord[]) ?? [],
        (memberships as unknown as CommunityMembershipRecord[]) ?? [],
        (reports as unknown as UserReportRecord[]) ?? [],
      ),
      usingMockData: false,
    };
  } catch {
    return { data: null, usingMockData: false };
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

    return {
      data: (communities as unknown as CommunityRecord[]).map((community) =>
        buildMockCommunity(
          community,
          membersByCommunity.get(community.id) ?? [],
          flaresByCommunity.get(community.id) ?? [],
        ),
      ),
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
    const [{ data: community, error: communityError }, { data: members, error: membersError }, { data: flares, error: flaresError }] = await Promise.all([
      supabase
        .from("communities")
        .select("id, name, slug, city, member_count, type, vehicle_type, description, created_at, owner_profile:profiles!communities_owner_id_fkey(username, display_name)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("community_members")
        .select("community_id, user_id, role, profile:profiles!community_members_user_id_fkey(username, display_name)")
        .eq("community_id", id),
      supabase.from("flares").select("id, community_id, title, starts_at, rsvp_count, status").eq("community_id", id).order("starts_at", { ascending: true }),
    ]);

    if (communityError || membersError || flaresError || !community) {
      return { data: null, usingMockData: false };
    }

    return {
      data: buildMockCommunity(
        community as unknown as CommunityRecord,
        (members as unknown as CommunityMemberDetailRecord[]) ?? [],
        (flares as unknown as CommunityFlareRecord[]) ?? [],
      ),
      usingMockData: false,
    };
  } catch {
    return { data: null, usingMockData: false };
  }
}
