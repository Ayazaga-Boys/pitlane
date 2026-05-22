import { Hono, type Context } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  V2CommentIdParamSchema,
  V2CreateCommentSchema,
  V2CreatePostSchema,
  V2CursorQuerySchema,
  V2PostIdParamSchema,
  V2UserIdParamSchema,
  V2UsernameParamSchema,
} from '../schemas/v2-social.schema.js';
import { toPresenceResponse } from './v2-presence.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2PostRoutes = new Hono<AppEnv>();
export const v2CommentRoutes = new Hono<AppEnv>();
export const v2UserRoutes = new Hono<AppEnv>();

const PROFILE_SELECT = 'id,username,display_name,avatar_url,is_private,is_verified';
const MEDIA_SELECT = 'id,asset_type,storage_key,cf_image_id,cf_stream_id,width,height,duration_sec,size_bytes,status';
const POST_SELECT = `id,author_id,caption,media_id,visibility,created_at,updated_at,author:profiles!posts_author_id_fkey(${PROFILE_SELECT}),media:media_assets!posts_media_id_fkey(${MEDIA_SELECT})`;
const COMMENT_SELECT = `id,post_id,author_id,parent_id,body,created_at,updated_at,author:profiles!comments_author_id_fkey(${PROFILE_SELECT})`;

type Supabase = NonNullable<ReturnType<typeof getServiceSupabaseClient>>;

type PostAccessRow = {
  id: string;
  author_id: string;
  visibility: 'public' | 'followers' | 'private';
  author?: { is_private?: boolean | null } | null;
};

v2PostRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreatePostSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  if (parsed.data.media_id) {
    const media = await assertOwnedReadyMedia(supabase, userId, parsed.data.media_id);
    if (media.error) return c.json({ code: 'INTERNAL_ERROR', error: media.error.message }, 500);
    if (!media.data) return c.json({ code: 'NOT_FOUND', error: 'Media asset not found' }, 404);
    if (media.data.status !== 'ready') return c.json({ code: 'MEDIA_NOT_READY', error: 'Media asset is not ready' }, 409);
    if (media.data.owner_type) {
      return c.json({ code: 'MEDIA_ALREADY_ATTACHED', error: 'Media asset is already attached' }, 409);
    }
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: userId,
      caption: parsed.data.caption,
      media_id: parsed.data.media_id,
      visibility: parsed.data.visibility,
    })
    .select(POST_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  if (parsed.data.media_id) {
    const { error: mediaError } = await supabase
      .from('media_assets')
      .update({ owner_type: 'post', owner_id: post.id })
      .eq('id', parsed.data.media_id)
      .eq('uploader_id', userId);

    if (mediaError) return c.json({ code: 'INTERNAL_ERROR', error: mediaError.message }, 500);
  }

  return c.json({ data: post }, 201);
});

v2PostRoutes.get('/:id/comments', async (c) => {
  const params = V2PostIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const query = V2CursorQuerySchema.safeParse(c.req.query());
  if (!query.success) return validationError(c, query.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const access = await canViewPost(supabase, userId, params.data.id);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (access.status === 'not_found') return c.json({ code: 'NOT_FOUND', error: 'Post not found' }, 404);
  if (access.status === 'forbidden') return c.json({ code: 'FORBIDDEN', error: 'Post is private' }, 403);

  let commentsQuery = supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('post_id', params.data.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(query.data.limit);

  if (query.data.cursor) commentsQuery = commentsQuery.lt('created_at', query.data.cursor);

  const { data, error } = await commentsQuery;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2PostRoutes.post('/:id/comments', async (c) => {
  const params = V2PostIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreateCommentSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const access = await canViewPost(supabase, userId, params.data.id);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (access.status === 'not_found') return c.json({ code: 'NOT_FOUND', error: 'Post not found' }, 404);
  if (access.status === 'forbidden') return c.json({ code: 'FORBIDDEN', error: 'Post is private' }, 403);

  if (parsed.data.parent_id) {
    const { data: parent, error: parentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', parsed.data.parent_id)
      .eq('post_id', params.data.id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (parentError) return c.json({ code: 'INTERNAL_ERROR', error: parentError.message }, 500);
    if (!parent) return c.json({ code: 'NOT_FOUND', error: 'Parent comment not found' }, 404);
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: params.data.id,
      author_id: userId,
      parent_id: parsed.data.parent_id,
      body: parsed.data.body,
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

v2PostRoutes.post('/:id/like', async (c) => {
  return setPostLike(c, true);
});

v2PostRoutes.delete('/:id/like', async (c) => {
  return setPostLike(c, false);
});

v2PostRoutes.get('/:id/likes', async (c) => {
  const params = V2PostIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const query = V2CursorQuerySchema.safeParse(c.req.query());
  if (!query.success) return validationError(c, query.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const access = await canViewPost(supabase, userId, params.data.id);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (access.status === 'not_found') return c.json({ code: 'NOT_FOUND', error: 'Post not found' }, 404);
  if (access.status === 'forbidden') return c.json({ code: 'FORBIDDEN', error: 'Post is private' }, 403);

  let likesQuery = supabase
    .from('post_likes')
    .select(`created_at,user:profiles!post_likes_user_id_fkey(${PROFILE_SELECT})`)
    .eq('post_id', params.data.id)
    .order('created_at', { ascending: false })
    .limit(query.data.limit);

  if (query.data.cursor) likesQuery = likesQuery.lt('created_at', query.data.cursor);

  const { data, error } = await likesQuery;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2PostRoutes.get('/:id', async (c) => {
  const params = V2PostIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: post, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', params.data.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!post) return c.json({ code: 'NOT_FOUND', error: 'Post not found' }, 404);

  const access = await canViewPostRow(supabase, userId, post as PostAccessRow);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (!access.allowed) return c.json({ code: 'FORBIDDEN', error: 'Post is private' }, 403);

  return c.json({ data: post });
});

v2PostRoutes.delete('/:id', async (c) => {
  const params = V2PostIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const deletedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('posts')
    .update({ deleted_at: deletedAt })
    .eq('id', params.data.id)
    .eq('author_id', userId)
    .is('deleted_at', null)
    .select('id,deleted_at')
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Post not found' }, 404);

  await supabase
    .from('media_assets')
    .update({ owner_type: null, owner_id: null })
    .eq('owner_type', 'post')
    .eq('owner_id', params.data.id);

  return c.json({ data: { deleted: true, deleted_at: data.deleted_at } });
});

v2CommentRoutes.post('/:id/like', async (c) => {
  const params = V2CommentIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .select('id,post_id')
    .eq('id', params.data.id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (commentError) return c.json({ code: 'INTERNAL_ERROR', error: commentError.message }, 500);
  if (!comment) return c.json({ code: 'NOT_FOUND', error: 'Comment not found' }, 404);

  const access = await canViewPost(supabase, userId, comment.post_id);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (access.status === 'forbidden') return c.json({ code: 'FORBIDDEN', error: 'Post is private' }, 403);

  const { data, error } = await supabase
    .from('comment_likes')
    .upsert({ comment_id: params.data.id, user_id: userId }, { onConflict: 'comment_id,user_id' })
    .select('comment_id,user_id,created_at')
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2UserRoutes.get('/:username/posts', async (c) => {
  const params = V2UsernameParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const query = V2CursorQuerySchema.safeParse(c.req.query());
  if (!query.success) return validationError(c, query.error);

  const viewerId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,is_private')
    .eq('username', params.data.username)
    .maybeSingle();

  if (profileError) return c.json({ code: 'INTERNAL_ERROR', error: profileError.message }, 500);
  if (!profile) return c.json({ code: 'NOT_FOUND', error: 'Profile not found' }, 404);

  const access = await canViewAuthor(supabase, viewerId, profile.id, Boolean(profile.is_private));
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (!access.allowed) return c.json({ code: 'FORBIDDEN', error: 'Profile is private' }, 403);

  let postsQuery = supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('author_id', profile.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(query.data.limit);

  if (viewerId !== profile.id) {
    postsQuery = postsQuery.in('visibility', access.isFollower ? ['public', 'followers'] : ['public']);
  }
  if (query.data.cursor) postsQuery = postsQuery.lt('created_at', query.data.cursor);

  const { data, error } = await postsQuery;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2UserRoutes.get('/:userId/presence', async (c) => {
  const params = V2UserIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const viewerId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id,presence_status,presence_visible,presence_updated_at')
    .eq('id', params.data.userId)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!profile) return c.json({ code: 'NOT_FOUND', error: 'Profile not found' }, 404);

  const visible = viewerId === params.data.userId || await isFollowing(supabase, viewerId, params.data.userId);
  return c.json({ data: toPresenceResponse(profile, visible) });
});

v2UserRoutes.get('/:userId/active-vehicle-icon', async (c) => {
  const params = V2UserIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const viewerId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,is_private')
    .eq('id', params.data.userId)
    .maybeSingle();

  if (profileError) return c.json({ code: 'INTERNAL_ERROR', error: profileError.message }, 500);
  if (!profile) return c.json({ code: 'NOT_FOUND', error: 'Profile not found' }, 404);

  const access = await canViewAuthor(supabase, viewerId, profile.id, Boolean(profile.is_private));
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (!access.allowed) return c.json({ code: 'FORBIDDEN', error: 'Profile is private' }, 403);

  const { data, error } = await supabase
    .from('vehicles')
    .select('id,type,make,model,icon_slug,is_primary')
    .eq('user_id', params.data.userId)
    .eq('is_primary', true)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ data: null });
  return c.json({ data });
});

async function setPostLike(c: Context<AppEnv>, shouldLike: boolean) {
  const params = V2PostIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const access = await canViewPost(supabase, userId, params.data.id);
  if (access.error) return c.json({ code: 'INTERNAL_ERROR', error: access.error.message }, 500);
  if (access.status === 'not_found') return c.json({ code: 'NOT_FOUND', error: 'Post not found' }, 404);
  if (access.status === 'forbidden') return c.json({ code: 'FORBIDDEN', error: 'Post is private' }, 403);

  if (!shouldLike) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', params.data.id)
      .eq('user_id', userId);

    if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
    return c.json({ data: { liked: false } });
  }

  const { data, error } = await supabase
    .from('post_likes')
    .upsert({ post_id: params.data.id, user_id: userId }, { onConflict: 'post_id,user_id' })
    .select('post_id,user_id,created_at')
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data: { liked: true, like: data } });
}

async function canViewPost(supabase: Supabase, viewerId: string, postId: string) {
  const { data: post, error } = await supabase
    .from('posts')
    .select('id,author_id,visibility,author:profiles!posts_author_id_fkey(is_private)')
    .eq('id', postId)
    .is('deleted_at', null)
    .maybeSingle<PostAccessRow>();

  if (error) return { status: 'error' as const, error };
  if (!post) return { status: 'not_found' as const };

  const access = await canViewPostRow(supabase, viewerId, post);
  if (access.error) return { status: 'error' as const, error: access.error };
  return { status: access.allowed ? 'allowed' as const : 'forbidden' as const };
}

async function canViewPostRow(supabase: Supabase, viewerId: string, post: PostAccessRow) {
  if (viewerId === post.author_id) return { allowed: true, isFollower: false };

  const authorIsPrivate = Boolean(post.author?.is_private);
  const authorAccess = await canViewAuthor(supabase, viewerId, post.author_id, authorIsPrivate);
  if (authorAccess.error) return { allowed: false, error: authorAccess.error };
  if (!authorAccess.allowed) return { allowed: false };

  if (post.visibility === 'private') return { allowed: false, isFollower: authorAccess.isFollower };
  if (post.visibility === 'followers' && !authorAccess.isFollower) return { allowed: false, isFollower: false };

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

  const follower = await isFollower(supabase, viewerId, authorId);
  if (follower.error) return { allowed: false, error: follower.error };

  if (authorIsPrivate && !follower.data) return { allowed: false, isFollower: false };
  return { allowed: true, isFollower: Boolean(follower.data) };
}

async function isFollowing(supabase: Supabase, viewerId: string, targetId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', viewerId)
    .eq('followee_id', targetId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

async function assertOwnedReadyMedia(supabase: Supabase, userId: string, mediaId: string) {
  return supabase
    .from('media_assets')
    .select('id,status,owner_type')
    .eq('id', mediaId)
    .eq('uploader_id', userId)
    .maybeSingle<{ id: string; status: string; owner_type: string | null }>();
}

async function isFollower(supabase: Supabase, followerId: string, followeeId: string) {
  return supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();
}

async function hasBlockBetween(supabase: Supabase, leftUserId: string, rightUserId: string) {
  return supabase
    .from('blocks')
    .select('blocker_id')
    .or(`and(blocker_id.eq.${leftUserId},blocked_id.eq.${rightUserId}),and(blocker_id.eq.${rightUserId},blocked_id.eq.${leftUserId})`)
    .limit(1)
    .maybeSingle();
}
