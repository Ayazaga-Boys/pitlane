import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  V2AssignCommunityRoleSchema,
  V2CommunityIdParamSchema,
  V2CommunityMemberRoleParamSchema,
  V2CommunityRoleParamSchema,
  V2CreateCommunityRoleSchema,
  V2UpdateCommunityRoleSchema,
} from '../schemas/v2-social.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2CommunityRoutes = new Hono<AppEnv>();

const ROLE_SELECT = 'id,community_id,name,permissions,rank_order,created_at,updated_at';
const MEMBER_ROLE_SELECT =
  'community_id,user_id,role,role_id,joined_at,profiles(username,display_name,avatar_url),community_roles(id,name,permissions,rank_order)';

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

function createPreset(name: string, permissions: RolePermissions, rankOrder: number) {
  return {
    name,
    permissions,
    rank_order: rankOrder,
  };
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
