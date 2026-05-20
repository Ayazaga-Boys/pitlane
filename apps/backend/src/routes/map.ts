import { gridDisk, isValidCell } from 'h3-js';
import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { MapHeatmapQuerySchema, MapNearbyQuerySchema, MapPinsQuerySchema } from '../schemas/map.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import { getHeatmapCells } from '../services/valkey.js';

export const mapRoutes = new Hono();

function cellsForQuery(h3cell: string, k: number): string[] | null {
  if (!isValidCell(h3cell)) return null;
  return gridDisk(h3cell, k);
}

mapRoutes.get('/heatmap', async (c) => {
  const parsed = MapHeatmapQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  try {
    const data = await getHeatmapCells(parsed.data.bounds);
    return c.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Valkey heatmap read failed';
    return c.json({ code: 'DOWNSTREAM_ERROR', error: message }, 502);
  }
});

mapRoutes.get('/flares', async (c) => {
  const parsed = MapNearbyQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  const cells = cellsForQuery(parsed.data.h3cell, parsed.data.k);
  if (!cells) return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('flares')
    .select(
      'id,creator_id,community_id,title,description,h3_cell,cover_url,starts_at,ends_at,rsvp_count,status,created_at,creator:profiles!flares_creator_id_fkey(username,display_name,avatar_url,is_verified)',
    )
    .in('h3_cell', cells)
    .eq('status', 'active')
    .gte('starts_at', oneHourAgo)
    .order('starts_at', { ascending: true })
    .limit(50);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

mapRoutes.get('/pins', async (c) => {
  const parsed = MapPinsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  const cells = cellsForQuery(parsed.data.h3cell, parsed.data.k);
  if (!cells) return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  let query = supabase
    .from('business_pins')
    .select(
      'id,owner_id,name,category,h3_cell,address,phone,website,logo_url,cover_url,is_verified,is_active,campaign_text,campaign_ends_at,created_at',
    )
    .in('h3_cell', cells)
    .eq('is_active', true)
    .order('is_verified', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (parsed.data.category) {
    query = query.eq('category', parsed.data.category);
  }

  const { data, error } = await query;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

mapRoutes.get('/help', async (c) => {
  const parsed = MapNearbyQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  const cells = cellsForQuery(parsed.data.h3cell, parsed.data.k);
  if (!cells) return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('help_requests')
    .select('id,requester_id,h3_cell,vehicle_id,issue_type,description,status,helper_id,expires_at,created_at')
    .in('h3_cell', cells)
    .eq('status', 'open')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});
