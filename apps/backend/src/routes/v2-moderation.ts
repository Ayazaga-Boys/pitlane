import { Hono } from 'hono';
import { z } from 'zod';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2AdminModerationRoutes = new Hono<AppEnv>();

const REPORT_SELECT = 'id,reporter_id,content_type,content_id,reason,description,status,created_at';
const MEDIA_SELECT =
  'id,uploader_id,asset_type,storage_key,cf_image_id,cf_moderation_status,cf_moderation_score,cf_moderation_labels,status,created_at';
const ContentIdParamSchema = z.object({ id: z.string().uuid() });

type ModeratedContentType = 'post' | 'comment' | 'story';

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

v2AdminModerationRoutes.post('/posts/:id/delete', async (c) => {
  const params = ContentIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  return moderatePost(c.get('userId') as string, params.data.id, 'delete');
});

v2AdminModerationRoutes.post('/posts/:id/restore', async (c) => {
  const params = ContentIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  return moderatePost(c.get('userId') as string, params.data.id, 'restore');
});

v2AdminModerationRoutes.post('/comments/:id/delete', async (c) => {
  const params = ContentIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  return moderateComment(c.get('userId') as string, params.data.id, 'delete');
});

v2AdminModerationRoutes.post('/comments/:id/restore', async (c) => {
  const params = ContentIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  return moderateComment(c.get('userId') as string, params.data.id, 'restore');
});

v2AdminModerationRoutes.post('/stories/:id/delete', async (c) => {
  const params = ContentIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  return moderateStory(c.get('userId') as string, params.data.id, 'delete');
});

v2AdminModerationRoutes.post('/stories/:id/restore', async (c) => {
  const params = ContentIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  return moderateStory(c.get('userId') as string, params.data.id, 'restore');
});

async function moderatePost(actorId: string, postId: string, action: 'delete' | 'restore') {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return new Response(JSON.stringify({ code: 'SERVICE_UNAVAILABLE', error: 'Supabase service client is not configured' }), { status: 503 });

  const admin = await requireAdmin(supabase, actorId);
  if (admin.error) return jsonError('INTERNAL_ERROR', admin.error.message, 500);
  if (!admin.allowed) return jsonError('FORBIDDEN', 'Admin role required', 403);

  const deletedAt = action === 'delete' ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from('posts')
    .update({ deleted_at: deletedAt })
    .eq('id', postId)
    .select('id,author_id,caption,media_id,deleted_at')
    .maybeSingle();

  if (error) return jsonError('INTERNAL_ERROR', error.message, 500);
  if (!data) return jsonError('NOT_FOUND', 'Post not found', 404);

  if (action === 'delete' && data.media_id) {
    await supabase.from('media_assets').update({ owner_type: null, owner_id: null }).eq('id', data.media_id);
  }

  const auditError = await writeContentAuditLog(supabase, actorId, action, 'post', postId, {
    author_id: data.author_id,
    caption: data.caption,
    media_id: data.media_id,
  });
  if (auditError) return jsonError('INTERNAL_ERROR', auditError.message, 500);

  return Response.json({ data });
}

async function moderateComment(actorId: string, commentId: string, action: 'delete' | 'restore') {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return new Response(JSON.stringify({ code: 'SERVICE_UNAVAILABLE', error: 'Supabase service client is not configured' }), { status: 503 });

  const admin = await requireAdmin(supabase, actorId);
  if (admin.error) return jsonError('INTERNAL_ERROR', admin.error.message, 500);
  if (!admin.allowed) return jsonError('FORBIDDEN', 'Admin role required', 403);

  const { data, error } = await supabase
    .from('comments')
    .update({ is_deleted: action === 'delete' })
    .eq('id', commentId)
    .select('id,author_id,post_id,is_deleted')
    .maybeSingle();

  if (error) return jsonError('INTERNAL_ERROR', error.message, 500);
  if (!data) return jsonError('NOT_FOUND', 'Comment not found', 404);

  const auditError = await writeContentAuditLog(supabase, actorId, action, 'comment', commentId, {
    author_id: data.author_id,
    post_id: data.post_id,
  });
  if (auditError) return jsonError('INTERNAL_ERROR', auditError.message, 500);

  return Response.json({ data });
}

async function moderateStory(actorId: string, storyId: string, action: 'delete' | 'restore') {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return new Response(JSON.stringify({ code: 'SERVICE_UNAVAILABLE', error: 'Supabase service client is not configured' }), { status: 503 });

  const admin = await requireAdmin(supabase, actorId);
  if (admin.error) return jsonError('INTERNAL_ERROR', admin.error.message, 500);
  if (!admin.allowed) return jsonError('FORBIDDEN', 'Admin role required', 403);

  const deletedAt = action === 'delete' ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from('stories')
    .update({ deleted_at: deletedAt })
    .eq('id', storyId)
    .select('id,author_id,media_id,deleted_at')
    .maybeSingle();

  if (error) return jsonError('INTERNAL_ERROR', error.message, 500);
  if (!data) return jsonError('NOT_FOUND', 'Story not found', 404);

  if (action === 'delete') {
    await supabase.from('media_assets').update({ owner_type: null, owner_id: null }).eq('id', data.media_id);
  }

  const auditError = await writeContentAuditLog(supabase, actorId, action, 'story', storyId, {
    author_id: data.author_id,
    media_id: data.media_id,
  });
  if (auditError) return jsonError('INTERNAL_ERROR', auditError.message, 500);

  return Response.json({ data });
}

async function writeContentAuditLog(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  actorId: string,
  action: 'delete' | 'restore',
  targetType: ModeratedContentType,
  targetId: string,
  metadata: Record<string, unknown>,
) {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: actorId,
    action: action === 'delete' ? 'content_deleted' : 'content_restored',
    target_type: targetType,
    target_id: targetId,
    metadata: {
      ...metadata,
      source: 'backend_v2_admin',
    },
  });

  return error;
}

function jsonError(code: string, error: string, status: number) {
  return Response.json({ code, error }, { status });
}

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
