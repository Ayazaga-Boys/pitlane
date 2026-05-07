import { Hono } from 'hono';
import {
  CreateVehicleSchema,
  UpdateProfileSchema,
  UpdateVehicleSchema,
  UsernameParamSchema,
  VehicleIdParamSchema,
} from '../schemas/profile.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import { serviceUnavailable, validationError } from '../lib/http.js';
import type { AppEnv } from '../types/hono.js';

export const profileRoutes = new Hono<AppEnv>();

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
    .select('id,username,display_name,avatar_url,bio,ghost_mode,is_verified,role,updated_at')
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

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
