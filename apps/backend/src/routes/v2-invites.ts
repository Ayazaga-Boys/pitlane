import { randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  V2CommunityIdParamSchema,
  V2CommunityInviteIdParamSchema,
  V2CreateCommunityInviteSchema,
  V2InviteSlugParamSchema,
  V2InviteUserSchema,
  V2RespondCommunityInviteSchema,
} from '../schemas/v2-social.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2PublicInviteRoutes = new Hono();
export const v2InviteRoutes = new Hono<AppEnv>();
export const v2CommunityInviteRoutes = new Hono<AppEnv>();
export const v2CommunityInviteResponseRoutes = new Hono<AppEnv>();

const COMMUNITY_PREVIEW_SELECT = 'id,name,slug,cover_url,type,vehicle_type,city,member_count,is_verified';
const INVITE_SELECT = 'id,community_id,creator_id,link_slug,code,mode,uses_count,max_uses,expires_at,created_at';
const DIRECT_INVITE_SELECT =
  'id,community_id,inviter_id,invitee_id,status,created_at,responded_at,communities(id,name,slug,cover_url,type,vehicle_type,city,member_count,is_verified),profiles!community_direct_invites_inviter_id_fkey(username,display_name,avatar_url)';

type RolePermissions = {
  can_invite?: boolean;
  can_moderate?: boolean;
};

type CommunityInviteRow = {
  id: string;
  community_id: string;
  creator_id: string;
  link_slug: string | null;
  code: string | null;
  mode: 'instant' | 'request';
  uses_count: number;
  max_uses: number | null;
  expires_at: string | null;
  created_at: string;
};

v2PublicInviteRoutes.get('/:slug', async (c) => {
  const params = V2InviteSlugParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const inviteResult = await findCommunityInvite(supabase, params.data.slug);
  if (inviteResult.error) return c.json({ code: 'INTERNAL_ERROR', error: inviteResult.error.message }, 500);
  if (!inviteResult.data) return c.json({ code: 'NOT_FOUND', error: 'Invite not found' }, 404);

  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select(COMMUNITY_PREVIEW_SELECT)
    .eq('id', inviteResult.data.community_id)
    .maybeSingle();

  if (communityError) return c.json({ code: 'INTERNAL_ERROR', error: communityError.message }, 500);
  if (!community) return c.json({ code: 'NOT_FOUND', error: 'Community not found' }, 404);

  return c.json({
    data: {
      invite: sanitizeInvite(inviteResult.data),
      community,
      available: isInviteAvailable(inviteResult.data),
      action: inviteResult.data.mode === 'instant' ? 'join' : 'request',
    },
  });
});

v2CommunityInviteRoutes.post('/:id/invites', async (c) => {
  const params = V2CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreateCommunityInviteSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const permission = await canInvite(supabase, params.data.id, actorId);
  if (permission.error) return c.json({ code: 'INTERNAL_ERROR', error: permission.error.message }, 500);
  if (!permission.allowed) return c.json({ code: 'FORBIDDEN', error: 'Community invite permission required' }, 403);

  const identity = parsed.data.type === 'code'
    ? { code: generateInviteCode() }
    : { link_slug: generateInviteSlug() };

  const { data, error } = await supabase
    .from('community_invites')
    .insert({
      community_id: params.data.id,
      creator_id: actorId,
      mode: parsed.data.mode,
      expires_at: parsed.data.expires_at,
      max_uses: parsed.data.max_uses,
      ...identity,
    })
    .select(INVITE_SELECT)
    .single();

  if (error?.code === '23505') return c.json({ code: 'CONFLICT', error: 'Invite token already exists' }, 409);
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data: sanitizeInvite(data as CommunityInviteRow) }, 201);
});

v2CommunityInviteRoutes.post('/:id/invite-user', async (c) => {
  const params = V2CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2InviteUserSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  if (actorId === parsed.data.user_id) {
    return c.json({ code: 'VALIDATION_ERROR', error: 'Cannot invite yourself' }, 422);
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const permission = await canInvite(supabase, params.data.id, actorId);
  if (permission.error) return c.json({ code: 'INTERNAL_ERROR', error: permission.error.message }, 500);
  if (!permission.allowed) return c.json({ code: 'FORBIDDEN', error: 'Community invite permission required' }, 403);

  const { data: existingMember, error: memberError } = await supabase
    .from('community_members')
    .select('user_id')
    .eq('community_id', params.data.id)
    .eq('user_id', parsed.data.user_id)
    .maybeSingle();

  if (memberError) return c.json({ code: 'INTERNAL_ERROR', error: memberError.message }, 500);
  if (existingMember) return c.json({ code: 'CONFLICT', error: 'User is already a community member' }, 409);

  const { data, error } = await supabase
    .from('community_direct_invites')
    .insert({
      community_id: params.data.id,
      inviter_id: actorId,
      invitee_id: parsed.data.user_id,
      status: 'pending',
    })
    .select(DIRECT_INVITE_SELECT)
    .single();

  if (error?.code === '23505') return c.json({ code: 'CONFLICT', error: 'User already has a pending invite' }, 409);
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  await supabase.from('notifications').insert({
    user_id: parsed.data.user_id,
    type: 'community_invite',
    title: 'Topluluk daveti',
    body: 'Bir topluluğa davet edildin.',
    data: {
      community_id: params.data.id,
      invite_id: data.id,
      inviter_id: actorId,
    },
  });

  return c.json({ data }, 201);
});

v2InviteRoutes.post('/:slug/accept', async (c) => {
  const params = V2InviteSlugParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const inviteResult = await findCommunityInvite(supabase, params.data.slug);
  if (inviteResult.error) return c.json({ code: 'INTERNAL_ERROR', error: inviteResult.error.message }, 500);
  if (!inviteResult.data) return c.json({ code: 'NOT_FOUND', error: 'Invite not found' }, 404);
  if (!isInviteAvailable(inviteResult.data)) return c.json({ code: 'GONE', error: 'Invite is no longer available' }, 410);

  if (inviteResult.data.mode === 'request') {
    const { data, error } = await supabase
      .from('community_join_requests')
      .insert({
        community_id: inviteResult.data.community_id,
        requester_id: userId,
        source_invite_id: inviteResult.data.id,
        status: 'pending',
      })
      .select('id,community_id,requester_id,source_invite_id,status,created_at,responded_at')
      .single();

    if (error?.code === '23505') return c.json({ code: 'CONFLICT', error: 'Join request already pending' }, 409);
    if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
    await incrementInviteUsage(supabase, inviteResult.data);
    return c.json({ data: { status: 'requested', request: data } }, 201);
  }

  const { error } = await supabase
    .from('community_members')
    .upsert({ community_id: inviteResult.data.community_id, user_id: userId, role: 'member' }, { onConflict: 'community_id,user_id' });

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  await incrementInviteUsage(supabase, inviteResult.data);
  await updateMemberCount(supabase, inviteResult.data.community_id);

  return c.json({ data: { status: 'joined', community_id: inviteResult.data.community_id } });
});

v2CommunityInviteResponseRoutes.post('/:id/respond', async (c) => {
  const params = V2CommunityInviteIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2RespondCommunityInviteSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: invite, error: inviteError } = await supabase
    .from('community_direct_invites')
    .select('id,community_id,invitee_id,status')
    .eq('id', params.data.id)
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (inviteError) return c.json({ code: 'INTERNAL_ERROR', error: inviteError.message }, 500);
  if (!invite) return c.json({ code: 'NOT_FOUND', error: 'Community invite not found' }, 404);

  const nextStatus = parsed.data.response === 'accept' ? 'accepted' : 'rejected';
  if (nextStatus === 'accepted') {
    const { error: memberError } = await supabase
      .from('community_members')
      .upsert({ community_id: invite.community_id, user_id: userId, role: 'member' }, { onConflict: 'community_id,user_id' });

    if (memberError) return c.json({ code: 'INTERNAL_ERROR', error: memberError.message }, 500);
    await updateMemberCount(supabase, invite.community_id);
  }

  const { data, error } = await supabase
    .from('community_direct_invites')
    .update({ status: nextStatus, responded_at: new Date().toISOString() })
    .eq('id', params.data.id)
    .select(DIRECT_INVITE_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

async function findCommunityInvite(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  slug: string,
) {
  const normalizedCode = slug.toUpperCase();
  return supabase
    .from('community_invites')
    .select(INVITE_SELECT)
    .or(`link_slug.eq.${slug},code.eq.${normalizedCode}`)
    .maybeSingle<CommunityInviteRow>();
}

function sanitizeInvite(invite: CommunityInviteRow) {
  return {
    id: invite.id,
    token: invite.link_slug ?? invite.code,
    type: invite.link_slug ? 'link' : 'code',
    mode: invite.mode,
    uses_count: invite.uses_count,
    max_uses: invite.max_uses,
    expires_at: invite.expires_at,
    created_at: invite.created_at,
  };
}

function isInviteAvailable(invite: CommunityInviteRow): boolean {
  if (invite.expires_at && Date.parse(invite.expires_at) <= Date.now()) return false;
  if (invite.max_uses !== null && invite.uses_count >= invite.max_uses) return false;
  return true;
}

async function incrementInviteUsage(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  invite: CommunityInviteRow,
) {
  await supabase
    .from('community_invites')
    .update({ uses_count: invite.uses_count + 1 })
    .eq('id', invite.id)
    .eq('uses_count', invite.uses_count);
}

async function updateMemberCount(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  communityId: string,
) {
  const { count } = await supabase
    .from('community_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('community_id', communityId);

  await supabase.from('communities').update({ member_count: count ?? 0 }).eq('id', communityId);
}

async function canInvite(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  communityId: string,
  actorId: string,
) {
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('id,owner_id')
    .eq('id', communityId)
    .maybeSingle();

  if (communityError) return { allowed: false, error: communityError };
  if (!community) return { allowed: false };
  if (community.owner_id === actorId) return { allowed: true };

  const { data: membership, error: membershipError } = await supabase
    .from('community_members')
    .select('role,community_roles(permissions)')
    .eq('community_id', communityId)
    .eq('user_id', actorId)
    .maybeSingle();

  if (membershipError) return { allowed: false, error: membershipError };
  const role = membership?.role;
  if (role === 'captain' || role === 'moderator') return { allowed: true };

  const permissions = extractRolePermissions(membership?.community_roles);
  return { allowed: Boolean(permissions.can_invite || permissions.can_moderate) };
}

function extractRolePermissions(role: unknown): RolePermissions {
  if (!role || typeof role !== 'object') return {};
  const permissions = Array.isArray(role)
    ? (role[0] as { permissions?: unknown } | undefined)?.permissions
    : (role as { permissions?: unknown }).permissions;

  if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) return {};
  const parsed: RolePermissions = {};
  for (const key of ['can_invite', 'can_moderate'] as const) {
    const value = (permissions as Record<string, unknown>)[key];
    if (typeof value === 'boolean') parsed[key] = value;
  }
  return parsed;
}

function generateInviteSlug(): string {
  return randomBytes(12).toString('base64url');
}

function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('');
}
