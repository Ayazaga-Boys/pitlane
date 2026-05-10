import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  CommunityIdParamSchema,
  CommunityMemberParamSchema,
  CommunitySlugParamSchema,
  CreateCommunitySchema,
  ListCommunitiesQuerySchema,
  UpdateCommunityMemberSchema,
  UpdateCommunitySchema,
} from '../schemas/community.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const communityRoutes = new Hono<AppEnv>();

const COMMUNITY_SELECT =
  'id,owner_id,name,slug,description,cover_url,type,vehicle_type,city,member_count,is_verified,created_at,updated_at';

const MEMBER_SELECT =
  'community_id,user_id,role,joined_at,profiles(username,display_name,avatar_url)';

type MembershipRole = 'captain' | 'moderator' | 'member';

function sanitizeSearch(value: string): string {
  return value.replace(/[%_,]/g, '').trim();
}

async function updateMemberCount(communityId: string) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return;

  const { count } = await supabase
    .from('community_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('community_id', communityId);

  await supabase.from('communities').update({ member_count: count ?? 0 }).eq('id', communityId);
}

async function getMembershipRole(communityId: string, userId: string): Promise<MembershipRole | null> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();

  const role = data?.role;
  return role === 'captain' || role === 'moderator' || role === 'member' ? role : null;
}

communityRoutes.get('/', async (c) => {
  const parsed = ListCommunitiesQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const end = parsed.data.offset + parsed.data.limit - 1;
  let query = supabase
    .from('communities')
    .select(COMMUNITY_SELECT, { count: 'exact' })
    .order('member_count', { ascending: false })
    .range(parsed.data.offset, end);

  if (parsed.data.city) query = query.ilike('city', `%${sanitizeSearch(parsed.data.city)}%`);
  if (parsed.data.vehicle_type && parsed.data.vehicle_type !== 'all') {
    query = query.in('vehicle_type', [parsed.data.vehicle_type, 'all']);
  }
  if (parsed.data.type) query = query.eq('type', parsed.data.type);
  if (parsed.data.q) {
    const q = sanitizeSearch(parsed.data.q);
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data, count, error } = await query;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  return c.json({
    data,
    meta: {
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      total: count ?? 0,
    },
  });
});

communityRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateCommunitySchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('communities')
    .insert({ ...parsed.data, owner_id: userId, member_count: 1 })
    .select(COMMUNITY_SELECT)
    .single();

  if (error?.code === '23505') return c.json({ code: 'CONFLICT', error: 'Community slug already exists' }, 409);
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  const { error: memberError } = await supabase.from('community_members').insert({
    community_id: data.id,
    user_id: userId,
    role: 'captain',
  });

  if (memberError) return c.json({ code: 'INTERNAL_ERROR', error: memberError.message }, 500);
  return c.json({ data }, 201);
});

communityRoutes.post('/:id/join', async (c) => {
  const params = CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('id,type')
    .eq('id', params.data.id)
    .neq('type', 'secret')
    .maybeSingle();

  if (communityError) return c.json({ code: 'INTERNAL_ERROR', error: communityError.message }, 500);
  if (!community) return c.json({ code: 'NOT_FOUND', error: 'Community not found' }, 404);

  const { error } = await supabase
    .from('community_members')
    .upsert({ community_id: params.data.id, user_id: userId, role: 'member' }, { onConflict: 'community_id,user_id' });

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  await updateMemberCount(params.data.id);

  return c.json({ data: { joined: true } });
});

communityRoutes.delete('/:id/leave', async (c) => {
  const params = CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const role = await getMembershipRole(params.data.id, userId);
  if (role === 'captain') {
    return c.json({ code: 'CONFLICT', error: 'Captain cannot leave community before transferring ownership' }, 409);
  }

  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', params.data.id)
    .eq('user_id', userId);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  await updateMemberCount(params.data.id);

  return c.json({ data: { left: true } });
});

communityRoutes.get('/:id/members', async (c) => {
  const params = CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('community_members')
    .select(MEMBER_SELECT)
    .eq('community_id', params.data.id)
    .order('joined_at', { ascending: true })
    .limit(200);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

communityRoutes.patch('/:id/members/:userId', async (c) => {
  const params = CommunityMemberParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const body = await c.req.json().catch(() => null);
  const parsed = UpdateCommunityMemberSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const actorId = c.get('userId') as string;
  const actorRole = await getMembershipRole(params.data.id, actorId);
  if (actorRole !== 'captain') return c.json({ code: 'FORBIDDEN', error: 'Captain role required' }, 403);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('community_members')
    .update({ role: parsed.data.role })
    .eq('community_id', params.data.id)
    .eq('user_id', params.data.userId)
    .select(MEMBER_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Community member not found' }, 404);
  return c.json({ data });
});

communityRoutes.delete('/:id/members/:userId', async (c) => {
  const params = CommunityMemberParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const actorId = c.get('userId') as string;
  const actorRole = await getMembershipRole(params.data.id, actorId);
  if (actorRole !== 'captain' && actorRole !== 'moderator') {
    return c.json({ code: 'FORBIDDEN', error: 'Moderator role required' }, 403);
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', params.data.id)
    .eq('user_id', params.data.userId)
    .neq('role', 'captain');

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  await updateMemberCount(params.data.id);

  return c.json({ data: { removed: true } });
});

communityRoutes.get('/:slug', async (c) => {
  const params = CommunitySlugParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: community, error } = await supabase
    .from('communities')
    .select(COMMUNITY_SELECT)
    .eq('slug', params.data.slug)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!community) return c.json({ code: 'NOT_FOUND', error: 'Community not found' }, 404);

  const [{ data: members, error: membersError }, { data: flares, error: flaresError }, role] = await Promise.all([
    supabase
      .from('community_members')
      .select(MEMBER_SELECT)
      .eq('community_id', community.id)
      .order('joined_at', { ascending: true })
      .limit(20),
    supabase
      .from('flares')
      .select('id,title,starts_at,rsvp_count')
      .eq('community_id', community.id)
      .eq('status', 'active')
      .order('starts_at', { ascending: true })
      .limit(10),
    getMembershipRole(community.id, userId),
  ]);

  if (membersError) return c.json({ code: 'INTERNAL_ERROR', error: membersError.message }, 500);
  if (flaresError) return c.json({ code: 'INTERNAL_ERROR', error: flaresError.message }, 500);

  return c.json({
    data: {
      ...community,
      members,
      flares,
      is_joined: Boolean(role),
    },
  });
});

communityRoutes.patch('/:id', async (c) => {
  const params = CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const body = await c.req.json().catch(() => null);
  const parsed = UpdateCommunitySchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('communities')
    .update(parsed.data)
    .eq('id', params.data.id)
    .eq('owner_id', userId)
    .select(COMMUNITY_SELECT)
    .maybeSingle();

  if (error?.code === '23505') return c.json({ code: 'CONFLICT', error: 'Community slug already exists' }, 409);
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Community not found' }, 404);
  return c.json({ data });
});

communityRoutes.delete('/:id', async (c) => {
  const params = CommunityIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('communities')
    .delete()
    .eq('id', params.data.id)
    .eq('owner_id', userId)
    .select('id')
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Community not found' }, 404);
  return c.json({ data: { deleted: true } });
});
