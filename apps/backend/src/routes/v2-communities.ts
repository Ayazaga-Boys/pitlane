import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  V2AssignCommunityRoleSchema,
  V2CommunityEventsQuerySchema,
  V2CommunityIdParamSchema,
  V2CommunityMemberRoleParamSchema,
  V2CommunityNeedsQuerySchema,
  V2CommunityRoleParamSchema,
  V2CreateCommunityEventSchema,
  V2CreateCommunityNeedSchema,
  V2CreateCommunityPollSchema,
  V2CreateCommunityRoleSchema,
  V2EventIdParamSchema,
  V2EventRsvpSchema,
  V2UpdateCommunityRoleSchema,
} from '../schemas/v2-social.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2CommunityRoutes = new Hono<AppEnv>();
export const v2EventRoutes = new Hono<AppEnv>();

const ROLE_SELECT = 'id,community_id,name,permissions,rank_order,created_at,updated_at';
const MEMBER_ROLE_SELECT =
  'community_id,user_id,role,role_id,joined_at,profiles(username,display_name,avatar_url),community_roles(id,name,permissions,rank_order)';
const EVENT_SELECT =
  'id,community_id,creator_id,title,description,starts_at,location_h3,status,created_at,updated_at,profiles!community_events_creator_id_fkey(username,display_name,avatar_url)';
const RSVP_SELECT = 'event_id,user_id,response,created_at,updated_at';
const POLL_SELECT = 'id,event_id,creator_id,question,options,created_at,updated_at';
const NEED_SELECT =
  'id,community_id,creator_id,type,urgency_color,body,status,created_at,updated_at,profiles!community_needs_creator_id_fkey(username,display_name,avatar_url)';

const ROLE_PRESETS = {
  motorcycle: [
    createPreset('Ride Lead', { can_invite: true, can_kick: true, can_create_event: true, can_pin: true, can_moderate: true }, 10),
    createPreset('Route Marshal', { can_invite: true, can_create_event: true, can_pin: true }, 30),
    createPreset('Member', {}, 100),
  ],
  car: [
    createPreset('Crew Lead', { can_invite: true, can_kick: true, can_create_event: true, can_pin: true, can_moderate: true }, 10),
    createPreset('Meet Host', { can_invite: true, can_create_event: true, can_pin: true }, 30),
    createPreset('Member', {}, 100),
  ],
  all: [
    createPreset('Captain', { can_invite: true, can_kick: true, can_create_event: true, can_pin: true, can_moderate: true }, 10),
    createPreset('Moderator', { can_invite: true, can_kick: true, can_create_event: true, can_moderate: true }, 30),
    createPreset('Member', {}, 100),
  ],
} as const;

type RolePermissions = {
  can_invite?: boolean;
  can_kick?: boolean;
  can_create_event?: boolean;
  can_pin?: boolean;
  can_moderate?: boolean;
};

type ActorAccess = {
  isOwner: boolean;
  legacyRole: 'captain' | 'moderator' | 'member' | null;
  permissions: Required<RolePermissions>;
};

v2CommunityRoutes.get('/role-presets', (c) => c.json({ data: ROLE_PRESETS }));

v2CommunityRoutes.get('/:id/roles', async (c) => {
  const params = V2CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('community_roles')
    .select(ROLE_SELECT)
    .eq('community_id', params.data.id)
    .order('rank_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2CommunityRoutes.post('/:id/roles', async (c) => {
  const params = V2CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreateCommunityRoleSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const access = await getActorAccess(supabase, params.data.id, actorId);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (!access.data?.isOwner && access.data?.legacyRole !== 'captain' && !access.data?.permissions.can_moderate) {
    return c.json({ code: 'FORBIDDEN', error: 'Community role management permission required' }, 403);
  }

  const { data, error } = await supabase
    .from('community_roles')
    .insert({
      community_id: params.data.id,
      name: parsed.data.name,
      permissions: parsed.data.permissions,
      rank_order: parsed.data.rank_order,
    })
    .select(ROLE_SELECT)
    .single();

  if (error?.code === '23505') return c.json({ code: 'CONFLICT', error: 'Community role already exists' }, 409);
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

v2CommunityRoutes.patch('/:id/roles/:roleId', async (c) => {
  const params = V2CommunityRoleParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2UpdateCommunityRoleSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const access = await getActorAccess(supabase, params.data.id, actorId);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (!access.data?.isOwner && access.data?.legacyRole !== 'captain' && !access.data?.permissions.can_moderate) {
    return c.json({ code: 'FORBIDDEN', error: 'Community role management permission required' }, 403);
  }

  const { data, error } = await supabase
    .from('community_roles')
    .update(parsed.data)
    .eq('id', params.data.roleId)
    .eq('community_id', params.data.id)
    .select(ROLE_SELECT)
    .maybeSingle();

  if (error?.code === '23505') return c.json({ code: 'CONFLICT', error: 'Community role already exists' }, 409);
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Community role not found' }, 404);
  return c.json({ data });
});

v2CommunityRoutes.post('/:id/members/:userId/role', async (c) => {
  const params = V2CommunityMemberRoleParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2AssignCommunityRoleSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const access = await getActorAccess(supabase, params.data.id, actorId);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (!access.data?.isOwner && access.data?.legacyRole !== 'captain' && !access.data?.permissions.can_moderate) {
    return c.json({ code: 'FORBIDDEN', error: 'Community role assignment permission required' }, 403);
  }

  const { data: role, error: roleError } = await supabase
    .from('community_roles')
    .select('id')
    .eq('id', parsed.data.role_id)
    .eq('community_id', params.data.id)
    .maybeSingle();

  if (roleError) return c.json({ code: 'INTERNAL_ERROR', error: roleError.message }, 500);
  if (!role) return c.json({ code: 'NOT_FOUND', error: 'Community role not found' }, 404);

  const { data, error } = await supabase
    .from('community_members')
    .update({ role_id: parsed.data.role_id })
    .eq('community_id', params.data.id)
    .eq('user_id', params.data.userId)
    .select(MEMBER_ROLE_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Community member not found' }, 404);
  return c.json({ data });
});

v2CommunityRoutes.post('/:id/needs', async (c) => {
  const params = V2CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreateCommunityNeedSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const access = await getActorAccess(supabase, params.data.id, actorId);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (!access.data) return c.json({ code: 'NOT_FOUND', error: 'Community not found' }, 404);
  if (!access.data.isOwner && !access.data.legacyRole) {
    return c.json({ code: 'FORBIDDEN', error: 'Community membership required' }, 403);
  }

  const { data, error } = await supabase
    .from('community_needs')
    .insert({
      community_id: params.data.id,
      creator_id: actorId,
      type: parsed.data.type,
      urgency_color: parsed.data.urgency_color,
      body: parsed.data.body,
      status: 'open',
    })
    .select(NEED_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

v2CommunityRoutes.get('/:id/needs', async (c) => {
  const params = V2CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const query = V2CommunityNeedsQuerySchema.safeParse(c.req.query());
  if (!query.success) return validationError(c, query.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const visibility = await canViewCommunity(supabase, params.data.id, actorId);
  if (visibility.error) return c.json({ code: 'INTERNAL_ERROR', error: visibility.error.message }, 500);
  if (!visibility.exists) return c.json({ code: 'NOT_FOUND', error: 'Community not found' }, 404);
  if (!visibility.allowed) return c.json({ code: 'FORBIDDEN', error: 'Community membership required' }, 403);

  let needsQuery = supabase
    .from('community_needs')
    .select(NEED_SELECT)
    .eq('community_id', params.data.id)
    .eq('status', query.data.status)
    .order('created_at', { ascending: false })
    .limit(query.data.limit);

  if (query.data.cursor) needsQuery = needsQuery.lt('created_at', query.data.cursor);

  const { data, error } = await needsQuery;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data, next_cursor: data.at(-1)?.created_at ?? null });
});

v2CommunityRoutes.post('/:id/events', async (c) => {
  const params = V2CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreateCommunityEventSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const access = await getActorAccess(supabase, params.data.id, actorId);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (!access.data) return c.json({ code: 'NOT_FOUND', error: 'Community not found' }, 404);
  if (!canCreateEvent(access.data)) {
    return c.json({ code: 'FORBIDDEN', error: 'Community event creation permission required' }, 403);
  }

  const { data, error } = await supabase
    .from('community_events')
    .insert({
      community_id: params.data.id,
      creator_id: actorId,
      title: parsed.data.title,
      description: parsed.data.description,
      starts_at: parsed.data.starts_at,
      location_h3: parsed.data.location_h3,
      status: 'scheduled',
    })
    .select(EVENT_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

v2CommunityRoutes.get('/:id/events', async (c) => {
  const params = V2CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const query = V2CommunityEventsQuerySchema.safeParse(c.req.query());
  if (!query.success) return validationError(c, query.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const visibility = await canViewCommunity(supabase, params.data.id, actorId);
  if (visibility.error) return c.json({ code: 'INTERNAL_ERROR', error: visibility.error.message }, 500);
  if (!visibility.exists) return c.json({ code: 'NOT_FOUND', error: 'Community not found' }, 404);
  if (!visibility.allowed) return c.json({ code: 'FORBIDDEN', error: 'Community membership required' }, 403);

  let eventsQuery = supabase
    .from('community_events')
    .select(EVENT_SELECT)
    .eq('community_id', params.data.id)
    .order('starts_at', { ascending: true })
    .limit(query.data.limit);

  if (query.data.status) eventsQuery = eventsQuery.eq('status', query.data.status);
  if (query.data.cursor) eventsQuery = eventsQuery.gt('starts_at', query.data.cursor);

  const { data, error } = await eventsQuery;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data, next_cursor: data.at(-1)?.starts_at ?? null });
});

v2EventRoutes.post('/:id/rsvp', async (c) => {
  const params = V2EventIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2EventRsvpSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const eventAccess = await canViewEvent(supabase, params.data.id, actorId);
  if (eventAccess.error) return c.json({ code: 'INTERNAL_ERROR', error: eventAccess.error.message }, 500);
  if (!eventAccess.exists) return c.json({ code: 'NOT_FOUND', error: 'Community event not found' }, 404);
  if (!eventAccess.allowed) return c.json({ code: 'FORBIDDEN', error: 'Community membership required' }, 403);

  const { data, error } = await supabase
    .from('event_rsvps')
    .upsert({
      event_id: params.data.id,
      user_id: actorId,
      response: parsed.data.response,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'event_id,user_id' })
    .select(RSVP_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2EventRoutes.post('/:id/polls', async (c) => {
  const params = V2EventIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreateCommunityPollSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const eventAccess = await canManageEvent(supabase, params.data.id, actorId);
  if (eventAccess.error) return c.json({ code: 'INTERNAL_ERROR', error: eventAccess.error.message }, 500);
  if (!eventAccess.exists) return c.json({ code: 'NOT_FOUND', error: 'Community event not found' }, 404);
  if (!eventAccess.allowed) {
    return c.json({ code: 'FORBIDDEN', error: 'Community event creation permission required' }, 403);
  }

  const { data, error } = await supabase
    .from('community_polls')
    .insert({
      event_id: params.data.id,
      creator_id: actorId,
      question: parsed.data.question,
      options: parsed.data.options,
    })
    .select(POLL_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

function createPreset(name: string, permissions: RolePermissions, rankOrder: number) {
  return {
    name,
    permissions,
    rank_order: rankOrder,
  };
}

function canCreateEvent(access: ActorAccess): boolean {
  return access.isOwner || access.legacyRole === 'captain' || access.permissions.can_create_event || access.permissions.can_moderate;
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

async function canViewEvent(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  eventId: string,
  actorId: string,
) {
  const { data: event, error } = await supabase
    .from('community_events')
    .select('id,community_id')
    .eq('id', eventId)
    .maybeSingle();

  if (error) return { exists: false, allowed: false, error };
  if (!event) return { exists: false, allowed: false };
  const visibility = await canViewCommunity(supabase, event.community_id, actorId);
  return { ...visibility, exists: true };
}

async function canManageEvent(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  eventId: string,
  actorId: string,
) {
  const { data: event, error } = await supabase
    .from('community_events')
    .select('id,community_id,creator_id')
    .eq('id', eventId)
    .maybeSingle();

  if (error) return { exists: false, allowed: false, error };
  if (!event) return { exists: false, allowed: false };
  if (event.creator_id === actorId) return { exists: true, allowed: true };

  const access = await getActorAccess(supabase, event.community_id, actorId);
  if (access.error) return { exists: true, allowed: false, error: access.error };
  return { exists: true, allowed: Boolean(access.data && canCreateEvent(access.data)) };
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

function toLegacyRole(role: unknown): ActorAccess['legacyRole'] {
  return role === 'captain' || role === 'moderator' || role === 'member' ? role : null;
}

function legacyRolePermissions(role: ActorAccess['legacyRole']): Required<RolePermissions> {
  if (role === 'captain') {
    return {
      can_invite: true,
      can_kick: true,
      can_create_event: true,
      can_pin: true,
      can_moderate: true,
    };
  }
  if (role === 'moderator') {
    return {
      can_invite: true,
      can_kick: true,
      can_create_event: true,
      can_pin: false,
      can_moderate: true,
    };
  }
  return {
    can_invite: false,
    can_kick: false,
    can_create_event: false,
    can_pin: false,
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
  for (const key of ['can_invite', 'can_kick', 'can_create_event', 'can_pin', 'can_moderate'] as const) {
    const value = (permissions as Record<string, unknown>)[key];
    if (typeof value === 'boolean') parsed[key] = value;
  }
  return parsed;
}
