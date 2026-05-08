import { gridDisk, isValidCell } from 'h3-js';
import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  CreateFlareSchema,
  FlareIdParamSchema,
  ListFlaresQuerySchema,
  RsvpFlareSchema,
  UpdateFlareSchema,
} from '../schemas/flare.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const flareRoutes = new Hono<AppEnv>();

const FLARE_SELECT =
  'id,creator_id,community_id,title,description,h3_cell,cover_url,starts_at,ends_at,rsvp_count,status,created_at,updated_at,creator:profiles!flares_creator_id_fkey(username,display_name,avatar_url,is_verified)';

function cellsForQuery(h3cell: string | undefined, k: number): string[] | null {
  if (!h3cell) return [];
  if (!isValidCell(h3cell)) return null;
  return gridDisk(h3cell, k);
}

async function getDailyFlareLimit(): Promise<number> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return 5;

  const { data } = await supabase
    .from('remote_configs')
    .select('value')
    .eq('key', 'max_flares_per_user_day')
    .maybeSingle();

  const value = data?.value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 5;
}

flareRoutes.get('/', async (c) => {
  const parsed = ListFlaresQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  const cells = cellsForQuery(parsed.data.h3cell, parsed.data.k);
  if (!cells) return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  let query = supabase
    .from('flares')
    .select(FLARE_SELECT)
    .eq('status', 'active')
    .gte('starts_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .order('starts_at', { ascending: true })
    .limit(50);

  if (cells.length > 0) query = query.in('h3_cell', cells);
  if (parsed.data.community_id) query = query.eq('community_id', parsed.data.community_id);

  const { data, error } = await query;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

flareRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateFlareSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  if (!isValidCell(parsed.data.h3_cell)) {
    return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);
  }

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count, error: countError } = await supabase
    .from('flares')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', userId)
    .gte('created_at', startOfDay.toISOString());

  if (countError) return c.json({ code: 'INTERNAL_ERROR', error: countError.message }, 500);

  const limit = await getDailyFlareLimit();
  if ((count ?? 0) >= limit) {
    return c.json({ code: 'RATE_LIMITED', error: 'Daily flare limit reached' }, 429);
  }

  const { data, error } = await supabase
    .from('flares')
    .insert({ ...parsed.data, creator_id: userId })
    .select(FLARE_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

flareRoutes.get('/:id/attendees', async (c) => {
  const params = FlareIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('flare_rsvps')
    .select('flare_id,user_id,status,created_at,profiles(username,display_name,avatar_url,is_verified)')
    .eq('flare_id', params.data.id)
    .neq('status', 'not_going')
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

flareRoutes.get('/:id', async (c) => {
  const params = FlareIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('flares')
    .select(FLARE_SELECT)
    .eq('id', params.data.id)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Flare not found' }, 404);
  return c.json({ data });
});

flareRoutes.patch('/:id', async (c) => {
  const params = FlareIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const body = await c.req.json().catch(() => null);
  const parsed = UpdateFlareSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('flares')
    .update(parsed.data)
    .eq('id', params.data.id)
    .eq('creator_id', userId)
    .neq('status', 'cancelled')
    .select(FLARE_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Flare not found' }, 404);
  return c.json({ data });
});

flareRoutes.delete('/:id', async (c) => {
  const params = FlareIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('flares')
    .update({ status: 'cancelled' })
    .eq('id', params.data.id)
    .eq('creator_id', userId)
    .select('id,status')
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Flare not found' }, 404);
  return c.json({ data });
});

flareRoutes.post('/:id/rsvp', async (c) => {
  const params = FlareIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const body = await c.req.json().catch(() => ({}));
  const parsed = RsvpFlareSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: flare, error: flareError } = await supabase
    .from('flares')
    .select('id,status')
    .eq('id', params.data.id)
    .eq('status', 'active')
    .maybeSingle();

  if (flareError) return c.json({ code: 'INTERNAL_ERROR', error: flareError.message }, 500);
  if (!flare) return c.json({ code: 'NOT_FOUND', error: 'Flare not found' }, 404);

  const { data, error } = await supabase
    .from('flare_rsvps')
    .upsert(
      { flare_id: params.data.id, user_id: userId, status: parsed.data.status },
      { onConflict: 'flare_id,user_id' },
    )
    .select('flare_id,user_id,status,created_at')
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  const { count } = await supabase
    .from('flare_rsvps')
    .select('user_id', { count: 'exact', head: true })
    .eq('flare_id', params.data.id)
    .eq('status', 'going');

  await supabase.from('flares').update({ rsvp_count: count ?? 0 }).eq('id', params.data.id);

  return c.json({ data });
});

flareRoutes.delete('/:id/rsvp', async (c) => {
  const params = FlareIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { error } = await supabase
    .from('flare_rsvps')
    .delete()
    .eq('flare_id', params.data.id)
    .eq('user_id', userId);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  const { count } = await supabase
    .from('flare_rsvps')
    .select('user_id', { count: 'exact', head: true })
    .eq('flare_id', params.data.id)
    .eq('status', 'going');

  await supabase.from('flares').update({ rsvp_count: count ?? 0 }).eq('id', params.data.id);

  return c.json({ data: { deleted: true } });
});
