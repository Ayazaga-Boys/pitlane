import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  V2AdminCompetitionsQuerySchema,
  V2AdminRejectCompetitionEntrySchema,
  V2CompetitionEntryVoteParamSchema,
  V2CompetitionIdParamSchema,
  V2CreateCompetitionEntrySchema,
  V2CreateCompetitionSchema,
} from '../schemas/v2-social.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2CompetitionRoutes = new Hono<AppEnv>();
export const v2AdminCompetitionRoutes = new Hono<AppEnv>();

const COMPETITION_SELECT =
  'id,community_id,creator_id,title,description,filters,voting_starts_at,voting_ends_at,status,created_at,updated_at,communities(id,name,slug,cover_url,type,vehicle_type,city),profiles!competitions_creator_id_fkey(username,display_name,avatar_url)';
const ENTRY_SELECT =
  'id,competition_id,entrant_id,media_id,vehicle_id,caption,status,created_at,updated_at,profiles!competition_entries_entrant_id_fkey(username,display_name,avatar_url),media_assets(id,asset_type,status,cf_image_id,cf_stream_id,width,height,duration_sec),vehicles(id,type,make,model,year,color)';
const VOTE_SELECT = 'competition_id,entry_id,voter_id,created_at,updated_at';

type RolePermissions = {
  can_create_event?: boolean;
  can_moderate?: boolean;
};

type ActorAccess = {
  isOwner: boolean;
  legacyRole: 'captain' | 'moderator' | 'member' | null;
  permissions: Required<RolePermissions>;
};

v2CompetitionRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreateCompetitionSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const access = await getActorAccess(supabase, parsed.data.community_id, actorId);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (!access.data) return c.json({ code: 'NOT_FOUND', error: 'Community not found' }, 404);
  if (!canCreateCompetition(access.data)) {
    return c.json({ code: 'FORBIDDEN', error: 'Community competition creation permission required' }, 403);
  }

  const { data, error } = await supabase
    .from('competitions')
    .insert({
      community_id: parsed.data.community_id,
      creator_id: actorId,
      title: parsed.data.title,
      description: parsed.data.description,
      filters: parsed.data.filters,
      voting_starts_at: parsed.data.voting_starts_at,
      voting_ends_at: parsed.data.voting_ends_at,
      status: 'open',
    })
    .select(COMPETITION_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

v2CompetitionRoutes.post('/:id/entries', async (c) => {
  const params = V2CompetitionIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreateCompetitionEntrySchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const competitionAccess = await canEnterCompetition(supabase, params.data.id, actorId);
  if (competitionAccess.error) return c.json({ code: 'INTERNAL_ERROR', error: competitionAccess.error.message }, 500);
  if (!competitionAccess.exists) return c.json({ code: 'NOT_FOUND', error: 'Competition not found' }, 404);
  if (!competitionAccess.allowed) return c.json({ code: 'FORBIDDEN', error: 'Community membership required' }, 403);
  if (competitionAccess.competition?.status === 'canceled' || competitionAccess.competition?.status === 'closed') {
    return c.json({ code: 'CONFLICT', error: 'Competition is not accepting entries' }, 409);
  }

  const media = await getOwnedMedia(supabase, parsed.data.media_id, actorId);
  if (media.error) return c.json({ code: 'INTERNAL_ERROR', error: media.error.message }, 500);
  if (!media.data) return c.json({ code: 'NOT_FOUND', error: 'Media asset not found' }, 404);
  if (media.data.status !== 'ready') return c.json({ code: 'CONFLICT', error: 'Media asset is not ready' }, 409);

  const filters = normalizeCompetitionFilters(competitionAccess.competition?.filters);
  if (filters.media_type !== 'any' && media.data.asset_type !== filters.media_type) {
    return c.json({ code: 'UNPROCESSABLE_ENTITY', error: 'Media asset does not match competition filters' }, 422);
  }

  let vehicleId: string | null = parsed.data.vehicle_id ?? null;
  if (filters.vehicle_type !== 'any' || vehicleId) {
    const vehicle = await getOwnedVehicle(supabase, vehicleId, actorId);
    if (vehicle.error) return c.json({ code: 'INTERNAL_ERROR', error: vehicle.error.message }, 500);
    if (!vehicle.data) return c.json({ code: 'NOT_FOUND', error: 'Vehicle not found' }, 404);
    vehicleId = vehicle.data.id;
    if (filters.vehicle_type !== 'any' && vehicle.data.type !== filters.vehicle_type) {
      return c.json({ code: 'UNPROCESSABLE_ENTITY', error: 'Vehicle does not match competition filters' }, 422);
    }
  }

  const { data, error } = await supabase
    .from('competition_entries')
    .insert({
      competition_id: params.data.id,
      entrant_id: actorId,
      media_id: parsed.data.media_id,
      vehicle_id: vehicleId,
      caption: parsed.data.caption,
      status: 'approved',
    })
    .select(ENTRY_SELECT)
    .single();

  if (error?.code === '23505') return c.json({ code: 'CONFLICT', error: 'Competition entry already exists' }, 409);
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

v2CompetitionRoutes.post('/:id/entries/:entryId/vote', async (c) => {
  const params = V2CompetitionEntryVoteParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const entryAccess = await canVoteForEntry(supabase, params.data.id, params.data.entryId, actorId);
  if (entryAccess.error) return c.json({ code: 'INTERNAL_ERROR', error: entryAccess.error.message }, 500);
  if (!entryAccess.exists) return c.json({ code: 'NOT_FOUND', error: 'Competition entry not found' }, 404);
  if (!entryAccess.allowed) return c.json({ code: 'FORBIDDEN', error: 'Community membership required' }, 403);
  if (!entryAccess.votingOpen) return c.json({ code: 'CONFLICT', error: 'Competition voting is not open' }, 409);
  if (entryAccess.ownEntry) return c.json({ code: 'CONFLICT', error: 'Cannot vote for your own entry' }, 409);

  const { data, error } = await supabase
    .from('competition_votes')
    .upsert({
      competition_id: params.data.id,
      entry_id: params.data.entryId,
      voter_id: actorId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'competition_id,voter_id' })
    .select(VOTE_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2AdminCompetitionRoutes.get('/', async (c) => {
  const query = V2AdminCompetitionsQuerySchema.safeParse(c.req.query());
  if (!query.success) return validationError(c, query.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const admin = await requireAdmin(supabase, actorId);
  if (admin.error) return c.json({ code: 'INTERNAL_ERROR', error: admin.error.message }, 500);
  if (!admin.allowed) return c.json({ code: 'FORBIDDEN', error: 'Admin role required' }, 403);

  let competitionsQuery = supabase
    .from('competitions')
    .select(COMPETITION_SELECT)
    .order('created_at', { ascending: false })
    .limit(query.data.limit);

  if (query.data.status) competitionsQuery = competitionsQuery.eq('status', query.data.status);
  if (query.data.community_id) competitionsQuery = competitionsQuery.eq('community_id', query.data.community_id);
  if (query.data.cursor) competitionsQuery = competitionsQuery.lt('created_at', query.data.cursor);

  const { data, error } = await competitionsQuery;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data, next_cursor: data.at(-1)?.created_at ?? null });
});

v2AdminCompetitionRoutes.get('/:id', async (c) => {
  const params = V2CompetitionIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const admin = await requireAdmin(supabase, actorId);
  if (admin.error) return c.json({ code: 'INTERNAL_ERROR', error: admin.error.message }, 500);
  if (!admin.allowed) return c.json({ code: 'FORBIDDEN', error: 'Admin role required' }, 403);

  const { data: competition, error: competitionError } = await supabase
    .from('competitions')
    .select(COMPETITION_SELECT)
    .eq('id', params.data.id)
    .maybeSingle();

  if (competitionError) return c.json({ code: 'INTERNAL_ERROR', error: competitionError.message }, 500);
  if (!competition) return c.json({ code: 'NOT_FOUND', error: 'Competition not found' }, 404);

  const { data: entries, error: entriesError } = await supabase
    .from('competition_entries')
    .select(ENTRY_SELECT)
    .eq('competition_id', params.data.id)
    .order('created_at', { ascending: false });

  if (entriesError) return c.json({ code: 'INTERNAL_ERROR', error: entriesError.message }, 500);

  const { data: votes, error: votesError } = await supabase
    .from('competition_votes')
    .select(VOTE_SELECT)
    .eq('competition_id', params.data.id);

  if (votesError) return c.json({ code: 'INTERNAL_ERROR', error: votesError.message }, 500);

  return c.json({ data: { competition, entries, votes } });
});

v2AdminCompetitionRoutes.post('/:id/cancel', async (c) => {
  const params = V2CompetitionIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const admin = await requireAdmin(supabase, actorId);
  if (admin.error) return c.json({ code: 'INTERNAL_ERROR', error: admin.error.message }, 500);
  if (!admin.allowed) return c.json({ code: 'FORBIDDEN', error: 'Admin role required' }, 403);

  const { data, error } = await supabase
    .from('competitions')
    .update({ status: 'canceled' })
    .eq('id', params.data.id)
    .neq('status', 'canceled')
    .select(COMPETITION_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Active competition not found' }, 404);
  return c.json({ data });
});

v2AdminCompetitionRoutes.post('/:id/entries/:entryId/reject', async (c) => {
  const params = V2CompetitionEntryVoteParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => ({}));
  const parsed = V2AdminRejectCompetitionEntrySchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const admin = await requireAdmin(supabase, actorId);
  if (admin.error) return c.json({ code: 'INTERNAL_ERROR', error: admin.error.message }, 500);
  if (!admin.allowed) return c.json({ code: 'FORBIDDEN', error: 'Admin role required' }, 403);

  const { data, error } = await supabase
    .from('competition_entries')
    .update({ status: 'rejected' })
    .eq('id', params.data.entryId)
    .eq('competition_id', params.data.id)
    .select(ENTRY_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Competition entry not found' }, 404);

  await supabase
    .from('reports')
    .insert({
      reporter_id: actorId,
      content_type: 'media_asset',
      content_id: data.media_id,
      reason: 'inappropriate',
      description: parsed.data.reason ?? 'Competition entry rejected by admin',
      status: 'reviewed',
      reviewed_by: actorId,
      reviewed_at: new Date().toISOString(),
      action_taken: 'content_deleted',
    });

  return c.json({ data });
});

function canCreateCompetition(access: ActorAccess): boolean {
  return access.isOwner || access.legacyRole === 'captain' || access.permissions.can_create_event || access.permissions.can_moderate;
}

async function requireAdmin(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,role')
    .eq('id', userId)
    .maybeSingle();

  if (error) return { allowed: false, error };
  return { allowed: data?.role === 'admin' };
}

async function getActorAccess(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  communityId: string,
  actorId: string,
) {
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('id,owner_id')
    .eq('id', communityId)
    .maybeSingle();

  if (communityError) return { error: communityError };
  if (!community) return { data: null };

  const { data: membership, error: membershipError } = await supabase
    .from('community_members')
    .select('role,community_roles(permissions)')
    .eq('community_id', communityId)
    .eq('user_id', actorId)
    .maybeSingle();

  if (membershipError) return { error: membershipError };

  const legacyRole = toLegacyRole(membership?.role);
  const rolePermissions = extractRolePermissions(membership?.community_roles);
  const data: ActorAccess = {
    isOwner: community.owner_id === actorId,
    legacyRole,
    permissions: {
      ...legacyRolePermissions(legacyRole),
      ...rolePermissions,
    },
  };

  return { data };
}

async function canEnterCompetition(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  competitionId: string,
  actorId: string,
) {
  const { data: competition, error } = await supabase
    .from('competitions')
    .select('id,community_id,filters,status,communities(id,type,owner_id)')
    .eq('id', competitionId)
    .maybeSingle();

  if (error) return { exists: false, allowed: false, competition: null, error };
  if (!competition) return { exists: false, allowed: false, competition: null };
  const visibility = await canViewCommunity(supabase, competition.community_id, actorId);
  return { ...visibility, exists: true, competition };
}

async function canVoteForEntry(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  competitionId: string,
  entryId: string,
  actorId: string,
) {
  const { data: entry, error } = await supabase
    .from('competition_entries')
    .select('id,competition_id,entrant_id,status,competitions(id,community_id,status,voting_starts_at,voting_ends_at)')
    .eq('id', entryId)
    .eq('competition_id', competitionId)
    .maybeSingle();

  if (error) return { exists: false, allowed: false, votingOpen: false, ownEntry: false, error };
  if (!entry) return { exists: false, allowed: false, votingOpen: false, ownEntry: false };
  const competition = Array.isArray(entry.competitions) ? entry.competitions[0] : entry.competitions;
  if (!competition) return { exists: false, allowed: false, votingOpen: false, ownEntry: false };

  const visibility = await canViewCommunity(supabase, competition.community_id, actorId);
  const now = Date.now();
  const votingOpen = entry.status === 'approved'
    && (competition.status === 'open' || competition.status === 'voting')
    && Date.parse(competition.voting_starts_at) <= now
    && Date.parse(competition.voting_ends_at) > now;

  return {
    ...visibility,
    exists: true,
    votingOpen,
    ownEntry: entry.entrant_id === actorId,
  };
}

async function canViewCommunity(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  communityId: string,
  actorId: string,
) {
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('id,owner_id,type')
    .eq('id', communityId)
    .maybeSingle();

  if (communityError) return { exists: false, allowed: false, error: communityError };
  if (!community) return { exists: false, allowed: false };
  if (community.type === 'public' || community.owner_id === actorId) return { exists: true, allowed: true };

  const { data: member, error: memberError } = await supabase
    .from('community_members')
    .select('user_id')
    .eq('community_id', communityId)
    .eq('user_id', actorId)
    .maybeSingle();

  if (memberError) return { exists: true, allowed: false, error: memberError };
  return { exists: true, allowed: Boolean(member) };
}

async function getOwnedMedia(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  mediaId: string,
  actorId: string,
) {
  const { data, error } = await supabase
    .from('media_assets')
    .select('id,asset_type,status')
    .eq('id', mediaId)
    .eq('uploader_id', actorId)
    .maybeSingle();

  return { data, error };
}

async function getOwnedVehicle(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  vehicleId: string | null,
  actorId: string,
) {
  let query = supabase
    .from('vehicles')
    .select('id,type')
    .eq('user_id', actorId);

  query = vehicleId ? query.eq('id', vehicleId) : query.eq('is_primary', true);
  const { data, error } = await query.maybeSingle();
  return { data, error };
}

function normalizeCompetitionFilters(filters: unknown): { vehicle_type: 'any' | 'car' | 'motorcycle'; media_type: 'any' | 'photo' | 'video' } {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    return { vehicle_type: 'any', media_type: 'photo' };
  }
  const vehicleType = (filters as Record<string, unknown>).vehicle_type;
  const mediaType = (filters as Record<string, unknown>).media_type;
  return {
    vehicle_type: vehicleType === 'car' || vehicleType === 'motorcycle' ? vehicleType : 'any',
    media_type: mediaType === 'video' || mediaType === 'any' ? mediaType : 'photo',
  };
}

function toLegacyRole(role: unknown): ActorAccess['legacyRole'] {
  return role === 'captain' || role === 'moderator' || role === 'member' ? role : null;
}

function legacyRolePermissions(role: ActorAccess['legacyRole']): Required<RolePermissions> {
  if (role === 'captain' || role === 'moderator') {
    return {
      can_create_event: true,
      can_moderate: role === 'captain' || role === 'moderator',
    };
  }
  return {
    can_create_event: false,
    can_moderate: false,
  };
}

function extractRolePermissions(role: unknown): RolePermissions {
  if (!role || typeof role !== 'object') return {};
  const permissions = Array.isArray(role)
    ? (role[0] as { permissions?: unknown } | undefined)?.permissions
    : (role as { permissions?: unknown }).permissions;

  if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) return {};
  const parsed: RolePermissions = {};
  for (const key of ['can_create_event', 'can_moderate'] as const) {
    const value = (permissions as Record<string, unknown>)[key];
    if (typeof value === 'boolean') parsed[key] = value;
  }
  return parsed;
}
