import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { V2CursorQuerySchema } from '../schemas/v2-social.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2DiscoverRoutes = new Hono<AppEnv>();

const PROFILE_SELECT = 'id,username,display_name,avatar_url,is_private,is_verified';
const MEDIA_SELECT = 'id,asset_type,storage_key,cf_image_id,cf_stream_id,width,height,duration_sec,size_bytes,status';
const POST_SELECT = `id,author_id,caption,media_id,visibility,created_at,updated_at,author:profiles!posts_author_id_fkey(${PROFILE_SELECT}),media:media_assets!posts_media_id_fkey(${MEDIA_SELECT})`;

type DiscoverScoreRow = {
  post_id: string;
  author_id: string;
  author_is_private: boolean;
  visibility: 'public' | 'followers' | 'private';
  created_at: string;
  like_count: number;
  comment_count: number;
  engagement_rate: number | string;
  recency_decay: number | string;
  base_score: number | string;
  refreshed_at: string;
};

type PostRow = {
  id: string;
  author_id: string;
  visibility: 'public' | 'followers' | 'private';
  created_at: string;
};

v2DiscoverRoutes.get('/feed', async (c) => {
  const query = V2CursorQuerySchema.safeParse(c.req.query());
  if (!query.success) return validationError(c, query.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const [followingResult, blockedResult] = await Promise.all([
    supabase.from('follows').select('followee_id').eq('follower_id', userId).limit(1000),
    supabase
      .from('blocks')
      .select('blocker_id,blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
      .limit(1000),
  ]);

  if (followingResult.error) return c.json({ code: 'INTERNAL_ERROR', error: followingResult.error.message }, 500);
  if (blockedResult.error) return c.json({ code: 'INTERNAL_ERROR', error: blockedResult.error.message }, 500);

  const followingIds = new Set((followingResult.data ?? []).map((row) => row.followee_id as string));
  const blockedIds = new Set(
    (blockedResult.data ?? [])
      .map((row) => (row.blocker_id === userId ? row.blocked_id : row.blocker_id) as string)
      .filter(Boolean),
  );

  let scoreQuery = supabase
    .from('post_discovery_scores')
    .select('post_id,author_id,author_is_private,visibility,created_at,like_count,comment_count,engagement_rate,recency_decay,base_score,refreshed_at')
    .order('base_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(Math.min(query.data.limit * 5, 150));

  if (query.data.cursor) scoreQuery = scoreQuery.lt('created_at', query.data.cursor);

  const { data: scoreRows, error: scoreError } = await scoreQuery;
  if (scoreError) return c.json({ code: 'INTERNAL_ERROR', error: scoreError.message }, 500);

  const visibleScores = ((scoreRows ?? []) as DiscoverScoreRow[])
    .filter((row) => canIncludeScoreRow({ row, userId, followingIds, blockedIds }))
    .map((row) => {
      const followSignal = followingIds.has(row.author_id) ? 1 : 0;
      const score = Number(row.base_score) + (0.2 * followSignal);
      return {
        row,
        score,
        follow_signal: followSignal,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return Date.parse(right.row.created_at) - Date.parse(left.row.created_at);
    })
    .slice(0, query.data.limit);

  if (visibleScores.length === 0) return c.json({ data: [] });

  const postIds = visibleScores.map((entry) => entry.row.post_id);
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .in('id', postIds)
    .is('deleted_at', null);

  if (postsError) return c.json({ code: 'INTERNAL_ERROR', error: postsError.message }, 500);

  const postsById = new Map((posts ?? []).map((post) => [(post as PostRow).id, post]));
  const feed = visibleScores
    .map((entry) => {
      const post = postsById.get(entry.row.post_id);
      if (!post) return null;

      return {
        post,
        score: {
          value: Number(entry.score.toFixed(6)),
          engagement_rate: Number(entry.row.engagement_rate),
          recency_decay: Number(entry.row.recency_decay),
          follow_signal: entry.follow_signal,
          like_count: entry.row.like_count,
          comment_count: entry.row.comment_count,
          refreshed_at: entry.row.refreshed_at,
        },
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return c.json({ data: feed });
});

function canIncludeScoreRow(input: {
  row: DiscoverScoreRow;
  userId: string;
  followingIds: Set<string>;
  blockedIds: Set<string>;
}): boolean {
  if (input.row.author_id === input.userId) return true;
  if (input.blockedIds.has(input.row.author_id)) return false;
  if (input.row.author_is_private && !input.followingIds.has(input.row.author_id)) return false;
  if (input.row.visibility === 'private') return false;
  if (input.row.visibility === 'followers' && !input.followingIds.has(input.row.author_id)) return false;
  return true;
}
