import { Hono, type Context } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  V2FollowListQuerySchema,
  V2FollowRequestIdParamSchema,
  V2UserIdParamSchema,
} from '../schemas/v2-social.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import { addFollowCache, removeFollowCache } from '../services/valkey.js';
import type { AppEnv } from '../types/hono.js';

export const v2FollowRoutes = new Hono<AppEnv>();
export const v2FollowRequestRoutes = new Hono<AppEnv>();

const FOLLOW_PROFILE_SELECT = 'id,username,display_name,avatar_url,is_private,is_verified';

type TargetProfile = {
  id: string;
  is_private: boolean | null;
};

v2FollowRoutes.get('/followers', async (c) => {
  const parsed = V2FollowListQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  let query = supabase
    .from('follows')
    .select(`created_at,follower:profiles!follows_follower_id_fkey(${FOLLOW_PROFILE_SELECT})`)
    .eq('followee_id', parsed.data.user_id)
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit);

  if (parsed.data.cursor) query = query.lt('created_at', parsed.data.cursor);

  const { data, error } = await query;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  return c.json({ data });
});

v2FollowRoutes.get('/following', async (c) => {
  const parsed = V2FollowListQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  let query = supabase
    .from('follows')
    .select(`created_at,followee:profiles!follows_followee_id_fkey(${FOLLOW_PROFILE_SELECT})`)
    .eq('follower_id', parsed.data.user_id)
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit);

  if (parsed.data.cursor) query = query.lt('created_at', parsed.data.cursor);

  const { data, error } = await query;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  return c.json({ data });
});

v2FollowRoutes.post('/:userId', async (c) => {
  const parsed = V2UserIdParamSchema.safeParse(c.req.param());
  if (!parsed.success) return validationError(c, parsed.error);

  const requesterId = c.get('userId') as string;
  const targetId = parsed.data.userId;
  if (requesterId === targetId) {
    return c.json({ code: 'VALIDATION_ERROR', error: 'Cannot follow yourself' }, 422);
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const target = await getTargetProfile(supabase, targetId);
  if (target.error) return c.json({ code: 'INTERNAL_ERROR', error: target.error.message }, 500);
  if (!target.data) return c.json({ code: 'NOT_FOUND', error: 'Profile not found' }, 404);

  const blocked = await hasFollowBlock(supabase, requesterId, targetId);
  if (blocked.error) return c.json({ code: 'INTERNAL_ERROR', error: blocked.error.message }, 500);
  if (blocked.data) return c.json({ code: 'FORBIDDEN', error: 'Follow is blocked' }, 403);

  const { data: existingFollow, error: existingFollowError } = await supabase
    .from('follows')
    .select('follower_id,followee_id,created_at')
    .eq('follower_id', requesterId)
    .eq('followee_id', targetId)
    .maybeSingle();

  if (existingFollowError) {
    return c.json({ code: 'INTERNAL_ERROR', error: existingFollowError.message }, 500);
  }
  if (existingFollow) {
    await syncFollowCache('add', requesterId, targetId);
    return c.json({ data: { status: 'following', follow: existingFollow } });
  }

  if (target.data.is_private) {
    const { data: request, error } = await supabase
      .from('follow_requests')
      .insert({ requester_id: requesterId, target_id: targetId, status: 'pending' })
      .select('id,requester_id,target_id,status,created_at')
      .single();

    if (error && error.code !== '23505') return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
    if (error?.code === '23505') {
      const { data: existingRequest, error: existingRequestError } = await supabase
        .from('follow_requests')
        .select('id,requester_id,target_id,status,created_at')
        .eq('requester_id', requesterId)
        .eq('target_id', targetId)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequestError) {
        return c.json({ code: 'INTERNAL_ERROR', error: existingRequestError.message }, 500);
      }
      return c.json({ data: { status: 'requested', request: existingRequest } });
    }

    return c.json({ data: { status: 'requested', request } }, 201);
  }

  const { data: follow, error } = await supabase
    .from('follows')
    .insert({ follower_id: requesterId, followee_id: targetId })
    .select('follower_id,followee_id,created_at')
    .single();

  if (error && error.code !== '23505') return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  await syncFollowCache('add', requesterId, targetId);
  return c.json({ data: { status: 'following', follow } }, error?.code === '23505' ? 200 : 201);
});

v2FollowRoutes.delete('/:userId', async (c) => {
  const parsed = V2UserIdParamSchema.safeParse(c.req.param());
  if (!parsed.success) return validationError(c, parsed.error);

  const requesterId = c.get('userId') as string;
  const targetId = parsed.data.userId;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', requesterId)
    .eq('followee_id', targetId);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  await syncFollowCache('remove', requesterId, targetId);

  await supabase
    .from('follow_requests')
    .update({ status: 'canceled', responded_at: new Date().toISOString() })
    .eq('requester_id', requesterId)
    .eq('target_id', targetId)
    .eq('status', 'pending');

  return c.json({ data: { deleted: true } });
});

v2FollowRequestRoutes.get('/incoming', async (c) => {
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('follow_requests')
    .select(`id,status,created_at,requester:profiles!follow_requests_requester_id_fkey(${FOLLOW_PROFILE_SELECT})`)
    .eq('target_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2FollowRequestRoutes.post('/:id/accept', async (c) => {
  return respondToFollowRequest(c, 'accepted');
});

v2FollowRequestRoutes.post('/:id/reject', async (c) => {
  return respondToFollowRequest(c, 'rejected');
});

async function respondToFollowRequest(c: Context<AppEnv>, status: 'accepted' | 'rejected') {
  const parsed = V2FollowRequestIdParamSchema.safeParse(c.req.param());
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: request, error: requestError } = await supabase
    .from('follow_requests')
    .select('id,requester_id,target_id,status')
    .eq('id', parsed.data.id)
    .eq('target_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (requestError) return c.json({ code: 'INTERNAL_ERROR', error: requestError.message }, 500);
  if (!request) return c.json({ code: 'NOT_FOUND', error: 'Follow request not found' }, 404);

  if (status === 'accepted') {
    const { error: followError } = await supabase
      .from('follows')
      .upsert({ follower_id: request.requester_id, followee_id: request.target_id }, { onConflict: 'follower_id,followee_id' });

    if (followError) return c.json({ code: 'INTERNAL_ERROR', error: followError.message }, 500);
    await syncFollowCache('add', request.requester_id, request.target_id);
  }

  const { data, error } = await supabase
    .from('follow_requests')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .select('id,requester_id,target_id,status,created_at,responded_at')
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
}

async function syncFollowCache(action: 'add' | 'remove', followerId: string, followeeId: string) {
  try {
    if (action === 'add') {
      await addFollowCache(followerId, followeeId);
      return;
    }
    await removeFollowCache(followerId, followeeId);
  } catch {
    // Follow cache is best-effort; Supabase remains the source of truth.
  }
}

async function getTargetProfile(supabase: ReturnType<typeof getServiceSupabaseClient>, targetId: string) {
  return supabase!
    .from('profiles')
    .select('id,is_private')
    .eq('id', targetId)
    .maybeSingle<TargetProfile>();
}

async function hasFollowBlock(
  supabase: ReturnType<typeof getServiceSupabaseClient>,
  requesterId: string,
  targetId: string,
) {
  return supabase!
    .from('blocks')
    .select('blocker_id')
    .or(`and(blocker_id.eq.${requesterId},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${requesterId})`)
    .limit(1)
    .maybeSingle();
}
