import { isValidCell } from 'h3-js';
import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { CreateHelpSchema, HelpIdParamSchema } from '../schemas/help.schema.js';
import { notifyRealtimeHelpEvent } from '../services/realtime.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const helpRoutes = new Hono<AppEnv>();

const HELP_SELECT =
  'id,requester_id,h3_cell,vehicle_id,issue_type,description,status,helper_id,resolved_at,expires_at,created_at';

async function getHourlyHelpLimit(): Promise<number> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return 2;

  const { data } = await supabase
    .from('remote_configs')
    .select('value')
    .eq('key', 'max_help_per_user_hour')
    .maybeSingle();

  const value = data?.value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 2;
}

helpRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateHelpSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  if (!isValidCell(parsed.data.h3_cell)) {
    return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);
  }

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  if (parsed.data.vehicle_id) {
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', parsed.data.vehicle_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (vehicleError) return c.json({ code: 'INTERNAL_ERROR', error: vehicleError.message }, 500);
    if (!vehicle) return c.json({ code: 'VALIDATION_ERROR', error: 'Vehicle does not belong to user' }, 422);
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from('help_requests')
    .select('id', { count: 'exact', head: true })
    .eq('requester_id', userId)
    .gte('created_at', oneHourAgo);

  if (countError) return c.json({ code: 'INTERNAL_ERROR', error: countError.message }, 500);

  const limit = await getHourlyHelpLimit();
  if ((count ?? 0) >= limit) {
    return c.json({ code: 'RATE_LIMITED', error: 'Hourly help request limit reached' }, 429);
  }

  const { data, error } = await supabase
    .from('help_requests')
    .insert({ ...parsed.data, requester_id: userId })
    .select(HELP_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  void notifyRealtimeHelpEvent({
    type: 'help_created',
    help_request_id: data.id,
    h3_cell: data.h3_cell,
    requester_id: data.requester_id,
    issue_type: data.issue_type,
  });
  return c.json({ data }, 201);
});

helpRoutes.get('/my', async (c) => {
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('help_requests')
    .select(HELP_SELECT)
    .or(`requester_id.eq.${userId},helper_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

helpRoutes.get('/:id', async (c) => {
  const params = HelpIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('help_requests')
    .select(HELP_SELECT)
    .eq('id', params.data.id)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Help request not found' }, 404);
  return c.json({ data });
});

// Flutter POST ile çağırıyor — hem PATCH hem POST kabul et
helpRoutes.on(['PATCH', 'POST'], '/:id/respond', async (c) => {
  const params = HelpIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('help_requests')
    .update({ helper_id: userId, status: 'helper_found' })
    .eq('id', params.data.id)
    .eq('status', 'open')
    .neq('requester_id', userId)
    .gt('expires_at', new Date().toISOString())
    .select(HELP_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'CONFLICT', error: 'Help request is no longer open' }, 409);
  void notifyRealtimeHelpEvent({
    type: 'help_assigned',
    help_request_id: data.id,
    h3_cell: data.h3_cell,
    requester_id: data.requester_id,
    helper_id: data.helper_id,
  });
  return c.json({ data });
});

helpRoutes.on(['PATCH', 'POST'], '/:id/resolve', async (c) => {
  const params = HelpIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('help_requests')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', params.data.id)
    .eq('requester_id', userId)
    .in('status', ['open', 'helper_found'])
    .select(HELP_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Help request not found' }, 404);
  return c.json({ data });
});

helpRoutes.on(['PATCH', 'POST', 'DELETE'], '/:id/cancel', async (c) => {
  const params = HelpIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('help_requests')
    .update({ status: 'cancelled' })
    .eq('id', params.data.id)
    .eq('requester_id', userId)
    .in('status', ['open', 'helper_found'])
    .select(HELP_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Help request not found' }, 404);
  return c.json({ data });
});
