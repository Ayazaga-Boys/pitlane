import { createHash, randomBytes } from 'node:crypto';
import { Hono } from 'hono';
import {
  CreateVehicleSchema,
  DeleteProfileSchema,
  ProfileDeletionCancelTokenParamSchema,
  UpdateProfileSchema,
  UpdateVehicleSchema,
  UsernameParamSchema,
  VehicleIdParamSchema,
} from '../schemas/profile.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { buildUserExportArchive, uploadUserExportArchive } from '../services/user-export.js';
import type { AppEnv } from '../types/hono.js';

export const profileRoutes = new Hono<AppEnv>();
export const publicProfileRoutes = new Hono();

const PROFILE_PRIVATE_SELECT =
  'id,username,display_name,avatar_url,bio,ghost_mode,is_verified,role,notification_prefs,deletion_requested_at,delete_after,deletion_reason,created_at,updated_at';

const PROFILE_DELETION_CANCEL_SELECT = 'id,deletion_requested_at,delete_after,ghost_mode';

publicProfileRoutes.post('/deletion/cancel/:token', async (c) => {
  const params = ProfileDeletionCancelTokenParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const tokenHash = hashDeletionCancelToken(params.data.token);
  const { data, error } = await supabase
    .from('profiles')
    .update({
      deletion_requested_at: null,
      delete_after: null,
      deletion_reason: null,
      deletion_cancel_token_hash: null,
      deletion_cancel_token_expires_at: null,
    })
    .eq('deletion_cancel_token_hash', tokenHash)
    .gt('deletion_cancel_token_expires_at', new Date().toISOString())
    .select(PROFILE_DELETION_CANCEL_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Deletion cancel token not found or expired' }, 404);
  return c.json({ data });
});

profileRoutes.get('/me', async (c) => {
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_PRIVATE_SELECT)
    .eq('id', userId)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Profile not found' }, 404);
  return c.json({ data });
});

profileRoutes.get('/me/export', async (c) => {
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  try {
    const generatedAt = new Date();
    const archive = await buildUserExportArchive(supabase, userId, generatedAt);
    const delivery = await uploadUserExportArchive({ archive, generatedAt });
    return c.json({ data: delivery });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    if (message === 'Cloudflare R2 is not configured') return serviceUnavailable(c);
    if (message.startsWith('R2 put failed')) {
      return c.json({ code: 'DOWNSTREAM_ERROR', error: message }, 502);
    }
    return c.json({ code: 'INTERNAL_ERROR', error: message }, 500);
  }
});

profileRoutes.get('/:username', async (c) => {
  const parsed = UsernameParamSchema.safeParse(c.req.param());
  if (!parsed.success) return validationError(c, parsed.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,display_name,avatar_url,bio,is_verified,created_at,vehicles(id,type,make,model,year,color,photo_url,is_primary)')
    .eq('username', parsed.data.username)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Profile not found' }, 404);

  return c.json({ data });
});

profileRoutes.patch('/me', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', userId)
    .select(PROFILE_PRIVATE_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

profileRoutes.delete('/me', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = DeleteProfileSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const now = new Date();
  const deleteAfter = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const cancelToken = generateDeletionCancelToken();
  const cancelUrl = buildDeletionCancelUrl(cancelToken);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ghost_mode: true,
      deletion_requested_at: now.toISOString(),
      delete_after: deleteAfter.toISOString(),
      deletion_reason: parsed.data.reason,
      deletion_cancel_token_hash: hashDeletionCancelToken(cancelToken),
      deletion_cancel_token_expires_at: deleteAfter.toISOString(),
    })
    .eq('id', userId)
    .select(PROFILE_DELETION_CANCEL_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Profile not found' }, 404);

  await supabase.from('push_devices').delete().eq('user_id', userId);

  return c.json({
    data: {
      ...data,
      deletion_cancel_token: cancelToken,
      deletion_cancel_url: cancelUrl,
    },
  });
});

profileRoutes.post('/me/deletion/cancel', async (c) => {
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      deletion_requested_at: null,
      delete_after: null,
      deletion_reason: null,
      deletion_cancel_token_hash: null,
      deletion_cancel_token_expires_at: null,
    })
    .eq('id', userId)
    .select(PROFILE_DELETION_CANCEL_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Profile not found' }, 404);

  return c.json({ data });
});

function generateDeletionCancelToken(): string {
  return randomBytes(32).toString('base64url');
}

function hashDeletionCancelToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function buildDeletionCancelUrl(token: string): string {
  const baseUrl = process.env.APP_PUBLIC_URL ?? 'https://rollpit.com';
  return new URL(`/undelete?token=${encodeURIComponent(token)}`, baseUrl).toString();
}

profileRoutes.post('/me/ghost-mode', async (c) => {
  const body = await c.req.json().catch(() => null);
  const enabled = typeof body?.enabled === 'boolean' ? body.enabled : undefined;
  if (enabled === undefined) {
    return c.json({
      code: 'VALIDATION_ERROR',
      error: 'Validation failed',
      details: { fieldErrors: { enabled: ['Required boolean'] } },
    }, 422);
  }

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('profiles')
    .update({ ghost_mode: enabled })
    .eq('id', userId)
    .select('id,ghost_mode')
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

profileRoutes.get('/me/vehicles', async (c) => {
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('vehicles')
    .select('id,type,make,model,year,color,photo_url,is_primary,created_at')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

profileRoutes.post('/me/vehicles', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateVehicleSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  if (parsed.data.is_primary) {
    await supabase.from('vehicles').update({ is_primary: false }).eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert({ ...parsed.data, user_id: userId })
    .select('id,type,make,model,year,color,photo_url,is_primary,created_at')
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

profileRoutes.patch('/me/vehicles/:id', async (c) => {
  const params = VehicleIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const body = await c.req.json().catch(() => null);
  const parsed = UpdateVehicleSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  if (parsed.data.is_primary) {
    await supabase.from('vehicles').update({ is_primary: false }).eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('vehicles')
    .update(parsed.data)
    .eq('id', params.data.id)
    .eq('user_id', userId)
    .select('id,type,make,model,year,color,photo_url,is_primary,created_at')
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Vehicle not found' }, 404);
  return c.json({ data });
});

profileRoutes.delete('/me/vehicles/:id', async (c) => {
  const params = VehicleIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', params.data.id)
    .eq('user_id', userId);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data: { deleted: true } });
});
