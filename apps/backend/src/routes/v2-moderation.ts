import { Hono } from 'hono';
import { serviceUnavailable } from '../lib/http.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2AdminModerationRoutes = new Hono<AppEnv>();

const REPORT_SELECT = 'id,reporter_id,content_type,content_id,reason,description,status,created_at';
const MEDIA_SELECT =
  'id,uploader_id,asset_type,storage_key,cf_image_id,cf_moderation_status,cf_moderation_score,cf_moderation_labels,status,created_at';

v2AdminModerationRoutes.get('/media', async (c) => {
  const actorId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const admin = await requireAdmin(supabase, actorId);
  if (admin.error) return c.json({ code: 'INTERNAL_ERROR', error: admin.error.message }, 500);
  if (!admin.allowed) return c.json({ code: 'FORBIDDEN', error: 'Admin role required' }, 403);

  const { data: reports, error } = await supabase
    .from('reports')
    .select(REPORT_SELECT)
    .eq('content_type', 'media_asset')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  const mediaIds = reports.map((report) => report.content_id);
  if (mediaIds.length === 0) return c.json({ data: [] });

  const { data: mediaAssets, error: mediaError } = await supabase
    .from('media_assets')
    .select(MEDIA_SELECT)
    .in('id', mediaIds);

  if (mediaError) return c.json({ code: 'INTERNAL_ERROR', error: mediaError.message }, 500);
  const mediaById = new Map(mediaAssets.map((asset) => [asset.id, asset]));
  const data = reports.map((report) => ({
    ...report,
    media: mediaById.get(report.content_id) ?? null,
  }));

  return c.json({ data });
});

async function requireAdmin(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,role')
    .eq('id', userId)
    .maybeSingle();

  if (error) return { allowed: false, error };
  return { allowed: data?.role === 'admin' };
}
