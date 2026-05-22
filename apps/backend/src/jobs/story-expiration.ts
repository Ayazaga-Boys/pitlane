import type { SupabaseClient } from '@supabase/supabase-js';
import {
  deleteCloudflareImage,
  deleteCloudflareStream,
  isCloudflareImagesConfigured,
  isCloudflareStreamConfigured,
} from '../services/cloudflare-media.js';
import { deleteR2Object, isR2Configured } from '../services/r2.js';
import { getServiceSupabaseClient } from '../services/supabase.js';

interface MediaAssetRow {
  id: string;
  storage_key: string;
  cf_image_id: string | null;
  cf_stream_id: string | null;
}

interface ExpiredStoryQueryRow {
  id: string;
  media_id: string;
  media: MediaAssetRow | MediaAssetRow[] | null;
}

interface ExpiredStoryRow {
  id: string;
  media_id: string;
  media: MediaAssetRow | null;
}

export interface StoryExpirationResult {
  expired_stories: number;
  cleaned_media_assets: number;
  cleanup_errors: number;
  expired_at: string;
}

export async function runStoryExpiration(input: {
  supabase?: SupabaseClient | null;
  now?: Date;
  limit?: number;
} = {}): Promise<StoryExpirationResult> {
  const supabase = input.supabase === undefined ? getServiceSupabaseClient() : input.supabase;
  if (!supabase) throw new Error('Supabase service client is not configured');

  const expiredAt = (input.now ?? new Date()).toISOString();
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 500);

  const { data, error } = await supabase
    .from('stories')
    .select('id,media_id,media:media_assets!stories_media_id_fkey(id,storage_key,cf_image_id,cf_stream_id)')
    .lt('expires_at', expiredAt)
    .is('deleted_at', null)
    .order('expires_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  const stories = ((data ?? []) as unknown as ExpiredStoryQueryRow[]).map((story) => ({
    id: story.id,
    media_id: story.media_id,
    media: Array.isArray(story.media) ? (story.media[0] ?? null) : story.media,
  }));
  if (stories.length === 0) {
    return { expired_stories: 0, cleaned_media_assets: 0, cleanup_errors: 0, expired_at: expiredAt };
  }

  const storyIds = stories.map((story) => story.id);
  const { error: storyError } = await supabase
    .from('stories')
    .update({ deleted_at: expiredAt })
    .in('id', storyIds)
    .is('deleted_at', null);

  if (storyError) throw new Error(storyError.message);

  let cleanedMediaAssets = 0;
  let cleanupErrors = 0;
  for (const story of stories) {
    if (!story.media) continue;
    let mediaCleanupStatus: 'deleted' | 'failed' = 'deleted';
    try {
      await cleanupStoryMediaAsset(story.media);
      cleanedMediaAssets += 1;
    } catch {
      cleanupErrors += 1;
      mediaCleanupStatus = 'failed';
    }

    const { error: mediaError } = await supabase
      .from('media_assets')
      .update({
        owner_type: null,
        owner_id: null,
        cf_image_id: null,
        cf_stream_id: null,
        status: mediaCleanupStatus,
      })
      .eq('id', story.media.id)
      .eq('owner_type', 'story')
      .eq('owner_id', story.id);

    if (mediaError) cleanupErrors += 1;
  }

  return {
    expired_stories: stories.length,
    cleaned_media_assets: cleanedMediaAssets,
    cleanup_errors: cleanupErrors,
    expired_at: expiredAt,
  };
}

async function cleanupStoryMediaAsset(media: MediaAssetRow): Promise<void> {
  const cleanupTasks: Array<Promise<void>> = [];
  if (media.storage_key && isR2Configured()) cleanupTasks.push(deleteR2Object(media.storage_key));
  if (media.cf_image_id && isCloudflareImagesConfigured()) cleanupTasks.push(deleteCloudflareImage(media.cf_image_id));
  if (media.cf_stream_id && isCloudflareStreamConfigured()) cleanupTasks.push(deleteCloudflareStream(media.cf_stream_id));

  const results = await Promise.allSettled(cleanupTasks);
  const rejected = results.find((result) => result.status === 'rejected');
  if (rejected) throw rejected.reason instanceof Error ? rejected.reason : new Error('Story media cleanup failed');
}
