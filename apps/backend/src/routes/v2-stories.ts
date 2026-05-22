import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  V2CreateStorySchema,
  V2CursorQuerySchema,
  V2StoryIdParamSchema,
} from '../schemas/v2-social.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2StoryRoutes = new Hono<AppEnv>();

const PROFILE_SELECT = 'id,username,display_name,avatar_url,is_private,is_verified';
const MEDIA_SELECT = 'id,asset_type,storage_key,cf_image_id,cf_stream_id,width,height,duration_sec,size_bytes,status';
const STORY_SELECT = `id,author_id,media_id,audience,expires_at,created_at,author:profiles!stories_author_id_fkey(${PROFILE_SELECT}),media:media_assets!stories_media_id_fkey(${MEDIA_SELECT})`;
const STORY_VIEW_SELECT = `story_id,viewer_id,viewed_at,viewer:profiles!story_views_viewer_id_fkey(${PROFILE_SELECT})`;

type Supabase = NonNullable<ReturnType<typeof getServiceSupabaseClient>>;

type StoryAccessRow = {
  id: string;
  author_id: string;
  audience: 'public' | 'followers' | 'private';
  expires_at: string;
  author?: { is_private?: boolean | null } | null;
};

type FeedStoryRow = StoryAccessRow & {
  media_id: string;
  created_at: string;
};

v2StoryRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreateStorySchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const media = await assertOwnedReadyMedia(supabase, userId, parsed.data.media_id);
  if (media.error) return c.json({ code: 'INTERNAL_ERROR', error: media.error.message }, 500);
  if (!media.data) return c.json({ code: 'NOT_FOUND', error: 'Media asset not found' }, 404);
  if (media.data.status !== 'ready') return c.json({ code: 'MEDIA_NOT_READY', error: 'Media asset is not ready' }, 409);
  if (media.data.owner_type) {
    return c.json({ code: 'MEDIA_ALREADY_ATTACHED', error: 'Media asset is already attached' }, 409);
  }

  const expiresAt = parsed.data.expires_at ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: story, error } = await supabase
    .from('stories')
    .insert({
      author_id: userId,
      media_id: parsed.data.media_id,
      audience: parsed.data.audience,
      expires_at: expiresAt,
    })
    .select(STORY_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  const { error: mediaError } = await supabase
    .from('media_assets')
    .update({ owner_type: 'story', owner_id: story.id })
    .eq('id', parsed.data.media_id)
    .eq('uploader_id', userId);

  if (mediaError) return c.json({ code: 'INTERNAL_ERROR', error: mediaError.message }, 500);
  return c.json({ data: story }, 201);
});

v2StoryRoutes.get('/feed', async (c) => {
  const query = V2CursorQuerySchema.safeParse(c.req.query());
  if (!query.success) return validationError(c, query.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const [followingResult, mutedResult] = await Promise.all([
    supabase.from('follows').select('followee_id').eq('follower_id', userId).limit(500),
    supabase.from('story_mutes').select('muted_id').eq('muter_id', userId).limit(500),
  ]);

  if (followingResult.error) return c.json({ code: 'INTERNAL_ERROR', error: followingResult.error.message }, 500);
  if (mutedResult.error) return c.json({ code: 'INTERNAL_ERROR', error: mutedResult.error.message }, 500);

  const mutedIds = new Set((mutedResult.data ?? []).map((row) => row.muted_id as string));
  const authorIds = [
    userId,
    ...(followingResult.data ?? [])
      .map((row) => row.followee_id as string)
      .filter((id) => !mutedIds.has(id)),
  ];

  if (authorIds.length === 0) return c.json({ data: [] });

  let storiesQuery = supabase
    .from('stories')
    .select(STORY_SELECT)
    .in('author_id', authorIds)
    .gt('expires_at', new Date().toISOString())
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(Math.min(query.data.limit * 3, 100));

  if (query.data.cursor) storiesQuery = storiesQuery.lt('created_at', query.data.cursor);

  const { data, error } = await storiesQuery;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  const visibleStories = [];
  for (const story of (data ?? []) as FeedStoryRow[]) {
    const access = await canViewStoryRow(supabase, userId, story);
    if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
    if (access.allowed) visibleStories.push(story);
    if (visibleStories.length >= query.data.limit) break;
  }

  return c.json({ data: visibleStories });
});

v2StoryRoutes.post('/:id/view', async (c) => {
  const params = V2StoryIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const access = await canViewStory(supabase, userId, params.data.id);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (access.status === 'not_found') return c.json({ code: 'NOT_FOUND', error: 'Story not found' }, 404);
  if (access.status === 'forbidden') return c.json({ code: 'FORBIDDEN', error: 'Story is private' }, 403);

  const { data, error } = await supabase
    .from('story_views')
    .upsert({ story_id: params.data.id, viewer_id: userId, viewed_at: new Date().toISOString() }, { onConflict: 'story_id,viewer_id' })
    .select('story_id,viewer_id,viewed_at')
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2StoryRoutes.get('/:id/views', async (c) => {
  const params = V2StoryIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const query = V2CursorQuerySchema.safeParse(c.req.query());
  if (!query.success) return validationError(c, query.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: story, error: storyError } = await supabase
    .from('stories')
    .select('id,author_id')
    .eq('id', params.data.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (storyError) return c.json({ code: 'INTERNAL_ERROR', error: storyError.message }, 500);
  if (!story) return c.json({ code: 'NOT_FOUND', error: 'Story not found' }, 404);
  if (story.author_id !== userId) return c.json({ code: 'FORBIDDEN', error: 'Only the author can view story viewers' }, 403);

  let viewsQuery = supabase
    .from('story_views')
    .select(STORY_VIEW_SELECT)
    .eq('story_id', params.data.id)
    .order('viewed_at', { ascending: false })
    .limit(query.data.limit);

  if (query.data.cursor) viewsQuery = viewsQuery.lt('viewed_at', query.data.cursor);

  const { data, error } = await viewsQuery;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2StoryRoutes.delete('/:id', async (c) => {
  const params = V2StoryIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const deletedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('stories')
    .update({ deleted_at: deletedAt })
    .eq('id', params.data.id)
    .eq('author_id', userId)
    .is('deleted_at', null)
    .select('id,deleted_at')
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Story not found' }, 404);

  await supabase
    .from('media_assets')
    .update({ owner_type: null, owner_id: null })
    .eq('owner_type', 'story')
    .eq('owner_id', params.data.id);

  return c.json({ data: { deleted: true, deleted_at: data.deleted_at } });
});

async function canViewStory(supabase: Supabase, viewerId: string, storyId: string) {
  const { data: story, error } = await supabase
    .from('stories')
    .select('id,author_id,audience,expires_at,author:profiles!stories_author_id_fkey(is_private)')
    .eq('id', storyId)
    .gt('expires_at', new Date().toISOString())
    .is('deleted_at', null)
    .maybeSingle<StoryAccessRow>();

  if (error) return { status: 'error' as const, error };
  if (!story) return { status: 'not_found' as const };

  const access = await canViewStoryRow(supabase, viewerId, story);
  if (access.error) return { status: 'error' as const, error: access.error };
  return { status: access.allowed ? 'allowed' as const : 'forbidden' as const };
}

async function canViewStoryRow(supabase: Supabase, viewerId: string, story: StoryAccessRow) {
  if (viewerId === story.author_id) return { allowed: true, isFollower: false };
  if (story.audience === 'private') return { allowed: false, isFollower: false };

  const authorAccess = await canViewAuthor(supabase, viewerId, story.author_id, Boolean(story.author?.is_private));
  if (authorAccess.error) return { allowed: false, error: authorAccess.error };
  if (!authorAccess.allowed) return { allowed: false };

  if (story.audience === 'followers' && !authorAccess.isFollower) return { allowed: false, isFollower: false };
  return { allowed: true, isFollower: authorAccess.isFollower };
}

async function canViewAuthor(
  supabase: Supabase,
  viewerId: string,
  authorId: string,
  authorIsPrivate: boolean,
) {
  if (viewerId === authorId) return { allowed: true, isFollower: false };

  const blocked = await hasBlockBetween(supabase, viewerId, authorId);
  if (blocked.error) return { allowed: false, error: blocked.error };
  if (blocked.data) return { allowed: false, isFollower: false };

  const muted = await supabase
    .from('story_mutes')
    .select('muter_id')
    .eq('muter_id', viewerId)
    .eq('muted_id', authorId)
    .maybeSingle();
  if (muted.error) return { allowed: false, error: muted.error };
  if (muted.data) return { allowed: false, isFollower: false };

  const follower = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', viewerId)
    .eq('followee_id', authorId)
    .maybeSingle();
  if (follower.error) return { allowed: false, error: follower.error };

  if (authorIsPrivate && !follower.data) return { allowed: false, isFollower: false };
  return { allowed: true, isFollower: Boolean(follower.data) };
}

async function assertOwnedReadyMedia(supabase: Supabase, userId: string, mediaId: string) {
  return supabase
    .from('media_assets')
    .select('id,status,owner_type')
    .eq('id', mediaId)
    .eq('uploader_id', userId)
    .maybeSingle<{ id: string; status: string; owner_type: string | null }>();
}

async function hasBlockBetween(supabase: Supabase, leftUserId: string, rightUserId: string) {
  return supabase
    .from('blocks')
    .select('blocker_id')
    .or(`and(blocker_id.eq.${leftUserId},blocked_id.eq.${rightUserId}),and(blocker_id.eq.${rightUserId},blocked_id.eq.${leftUserId})`)
    .limit(1)
    .maybeSingle();
}
