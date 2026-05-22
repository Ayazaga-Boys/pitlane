import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { FinalizeMediaSchema, MediaIdParamSchema, UploadUrlSchema } from '../schemas/media.schema.js';
import {
  getCloudflareStreamAssetReference,
  getCloudflareStreamAssetStatus,
  parseCloudflareStreamWebhook,
  toMediaAssetMetrics,
  verifyCloudflareStreamSignature,
} from '../services/cloudflare-stream.js';
import {
  type CloudflareImageModeration,
  copyCloudflareStreamFromUrl,
  deleteCloudflareImage,
  deleteCloudflareStream,
  isCloudflareImagesConfigured,
  isCloudflareStreamConfigured,
  uploadCloudflareImageFromUrl,
} from '../services/cloudflare-media.js';
import {
  createMediaStorageKey,
  deleteR2Object,
  generateR2ReadUrl,
  generateR2UploadUrl,
  headR2Object,
  isR2Configured,
} from '../services/r2.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const mediaRoutes = new Hono<AppEnv>();
export const mediaWebhookRoutes = new Hono();

const MEDIA_ASSET_SELECT =
  'id,uploader_id,asset_type,storage_key,cf_image_id,cf_stream_id,cf_moderation_status,cf_moderation_score,cf_moderation_labels,width,height,duration_sec,size_bytes,status,created_at';
const DEFAULT_IMAGE_MODERATION_THRESHOLD = 0.85;

interface MediaAssetRow {
  id: string;
  asset_type: 'photo' | 'video';
  storage_key: string;
  cf_image_id?: string | null;
  cf_stream_id?: string | null;
  size_bytes?: number | null;
}

mediaWebhookRoutes.post('/webhook/stream', async (c) => {
  const secret = process.env.CF_STREAM_WEBHOOK_SECRET;
  if (!secret) return serviceUnavailable(c);

  const signature = c.req.header('Webhook-Signature');
  const body = await c.req.text();
  if (!verifyCloudflareStreamSignature({ body, header: signature, secret })) {
    return c.json({ code: 'UNAUTHORIZED', error: 'Invalid Cloudflare Stream signature' }, 401);
  }

  const event = parseCloudflareStreamWebhook(body);
  if (!event) return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid Cloudflare Stream payload' }, 422);

  const reference = getCloudflareStreamAssetReference(event);
  if (!reference) {
    return c.json({ data: { processed: false, reason: 'missing_media_reference' } });
  }

  const status = getCloudflareStreamAssetStatus(event);
  if (status === 'pending') {
    return c.json({ data: { processed: false, state: event.status?.state ?? 'pending' } });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const update = Object.fromEntries(
    Object.entries({
      status,
      cf_stream_id: event.uid,
      ...toMediaAssetMetrics(event),
    }).filter(([, value]) => value !== undefined),
  );

  let query = supabase
    .from('media_assets')
    .update(update)
    .select(MEDIA_ASSET_SELECT);

  query = reference.type === 'id'
    ? query.eq('id', reference.value)
    : query.eq('storage_key', reference.value);

  const { data, error } = await query.maybeSingle();
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Media asset not found' }, 404);

  return c.json({ data });
});

mediaRoutes.post('/upload-url', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = UploadUrlSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  if (!isR2Configured()) {
    return c.json({ code: 'SERVICE_UNAVAILABLE', error: 'Cloudflare R2 is not configured' }, 503);
  }

  const storageKey = createMediaStorageKey({
    userId,
    assetType: parsed.data.asset_type,
    contentType: parsed.data.content_type,
  });

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      uploader_id: userId,
      asset_type: parsed.data.asset_type,
      storage_key: storageKey,
      size_bytes: parsed.data.size_bytes,
      status: 'pending',
    })
    .select('id,storage_key')
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  const asset = data as { id: string; storage_key: string };
  return c.json({
    data: {
      upload_url: generateR2UploadUrl({ storageKey: asset.storage_key }),
      asset_id: asset.id,
      storage_key: asset.storage_key,
    },
  }, 201);
});

mediaRoutes.post('/finalize', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = FinalizeMediaSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: asset, error } = await supabase
    .from('media_assets')
    .select(MEDIA_ASSET_SELECT)
    .eq('id', parsed.data.asset_id)
    .eq('uploader_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!asset) return c.json({ code: 'NOT_FOUND', error: 'Media asset not found' }, 404);

  if (!isR2Configured()) {
    return c.json({ code: 'SERVICE_UNAVAILABLE', error: 'Cloudflare R2 is not configured' }, 503);
  }

  const mediaAsset = asset as MediaAssetRow;
  let objectMetadata;
  try {
    objectMetadata = await headR2Object(mediaAsset.storage_key);
  } catch (headError) {
    const message = headError instanceof Error ? headError.message : 'R2 head failed';
    return c.json({ code: 'DOWNSTREAM_ERROR', error: message }, 502);
  }

  if (!objectMetadata) {
    return c.json({ code: 'UPLOAD_NOT_FOUND', error: 'Uploaded object was not found in R2' }, 409);
  }

  const update: Record<string, unknown> = {
    status: 'ready',
    ...(objectMetadata.sizeBytes ? { size_bytes: objectMetadata.sizeBytes } : {}),
  };

  if (mediaAsset.asset_type === 'photo' && isCloudflareImagesConfigured()) {
    try {
      const image = await uploadCloudflareImageFromUrl({
        url: generateR2ReadUrl(mediaAsset.storage_key),
        assetId: mediaAsset.id,
        storageKey: mediaAsset.storage_key,
      });
      update.cf_image_id = image.id;
      const moderation = normalizeImageModeration(image.moderation);
      if (moderation) {
        update.cf_moderation_status = isModerationFlagged(moderation) ? 'flagged' : 'clean';
        update.cf_moderation_score = moderation.score;
        update.cf_moderation_labels = moderation.labels;
      }
    } catch (cloudflareError) {
      const message = cloudflareError instanceof Error ? cloudflareError.message : 'Cloudflare Images import failed';
      return c.json({ code: 'DOWNSTREAM_ERROR', error: message }, 502);
    }
  }

  if (mediaAsset.asset_type === 'video' && isCloudflareStreamConfigured()) {
    try {
      const maxSizeBytes = objectMetadata.sizeBytes ?? mediaAsset.size_bytes ?? undefined;
      const streamInput = {
        url: generateR2ReadUrl(mediaAsset.storage_key),
        assetId: mediaAsset.id,
        storageKey: mediaAsset.storage_key,
        ...(maxSizeBytes ? { maxSizeBytes } : {}),
      };
      const stream = await copyCloudflareStreamFromUrl(streamInput);
      update.cf_stream_id = stream.uid;
      update.status = stream.readyToStream || stream.status?.state === 'ready' ? 'ready' : 'processing';
    } catch (cloudflareError) {
      const message = cloudflareError instanceof Error ? cloudflareError.message : 'Cloudflare Stream ingest failed';
      return c.json({ code: 'DOWNSTREAM_ERROR', error: message }, 502);
    }
  }

  const { data, error: updateError } = await supabase
    .from('media_assets')
    .update(update)
    .eq('id', parsed.data.asset_id)
    .eq('uploader_id', userId)
    .eq('status', 'pending')
    .select(MEDIA_ASSET_SELECT)
    .maybeSingle();

  if (updateError) return c.json({ code: 'INTERNAL_ERROR', error: updateError.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Media asset not found' }, 404);
  await enqueueImageModerationReport(supabase, data as { id: string; uploader_id: string; cf_moderation_status?: string; cf_moderation_score?: number | null });

  return c.json({ data });
});

mediaRoutes.get('/:id', async (c) => {
  const params = MediaIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('media_assets')
    .select(MEDIA_ASSET_SELECT)
    .eq('id', params.data.id)
    .eq('uploader_id', userId)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Media asset not found' }, 404);

  return c.json({ data });
});

mediaRoutes.delete('/:id', async (c) => {
  const params = MediaIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: asset, error: findError } = await supabase
    .from('media_assets')
    .select(MEDIA_ASSET_SELECT)
    .eq('id', params.data.id)
    .eq('uploader_id', userId)
    .maybeSingle();

  if (findError) return c.json({ code: 'INTERNAL_ERROR', error: findError.message }, 500);
  if (!asset) return c.json({ code: 'NOT_FOUND', error: 'Media asset not found' }, 404);

  if (!isR2Configured()) {
    return c.json({ code: 'SERVICE_UNAVAILABLE', error: 'Cloudflare R2 is not configured' }, 503);
  }

  try {
    const mediaAsset = asset as MediaAssetRow;
    await deleteR2Object(mediaAsset.storage_key);
    if (mediaAsset.cf_image_id && isCloudflareImagesConfigured()) {
      await deleteCloudflareImage(mediaAsset.cf_image_id);
    }
    if (mediaAsset.cf_stream_id && isCloudflareStreamConfigured()) {
      await deleteCloudflareStream(mediaAsset.cf_stream_id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Media delete failed';
    return c.json({ code: 'DOWNSTREAM_ERROR', error: message }, 502);
  }

  const { error: deleteError } = await supabase
    .from('media_assets')
    .delete()
    .eq('id', params.data.id)
    .eq('uploader_id', userId);

  if (deleteError) return c.json({ code: 'INTERNAL_ERROR', error: deleteError.message }, 500);

  return c.json({ data: { id: params.data.id, deleted: true } });
});

function normalizeImageModeration(moderation: CloudflareImageModeration | undefined): {
  score: number;
  labels: Record<string, number>;
} | null {
  if (!moderation || typeof moderation !== 'object') return null;
  const labels = moderation.labels && typeof moderation.labels === 'object' && !Array.isArray(moderation.labels)
    ? moderation.labels
    : {};
  const highestLabelScore = Object.values(labels)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .reduce((highest, value) => Math.max(highest, value), 0);
  const rawScore = typeof moderation.score === 'number' && Number.isFinite(moderation.score)
    ? moderation.score
    : highestLabelScore;
  const score = Math.max(0, Math.min(1, rawScore));
  if (!moderation.flagged && score === 0 && Object.keys(labels).length === 0) return null;
  return { score, labels };
}

function isModerationFlagged(moderation: { score: number }): boolean {
  const threshold = Number(process.env.CF_IMAGES_MODERATION_THRESHOLD ?? DEFAULT_IMAGE_MODERATION_THRESHOLD);
  const safeThreshold = Number.isFinite(threshold) && threshold >= 0 && threshold <= 1
    ? threshold
    : DEFAULT_IMAGE_MODERATION_THRESHOLD;
  return moderation.score >= safeThreshold;
}

async function enqueueImageModerationReport(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  media: { id: string; uploader_id: string; cf_moderation_status?: string; cf_moderation_score?: number | null },
): Promise<void> {
  if (media.cf_moderation_status !== 'flagged') return;

  const { data: existing, error: existingError } = await supabase
    .from('reports')
    .select('id')
    .eq('content_type', 'media_asset')
    .eq('content_id', media.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingError || existing) return;

  await supabase
    .from('reports')
    .insert({
      reporter_id: media.uploader_id,
      content_type: 'media_asset',
      content_id: media.id,
      reason: 'inappropriate',
      description: `Auto-flagged by Cloudflare Images moderation score ${media.cf_moderation_score ?? 'unknown'}`,
      status: 'pending',
    });
}
