import { isValidCell } from 'h3-js';
import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { V2CreateHelpSchema } from '../schemas/v2-help.schema.js';
import { notifyRealtimeHelpEvent, type RealtimeHelpEvent } from '../services/realtime.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2HelpRoutes = new Hono<AppEnv>();

const HELP_SELECT =
  'id,requester_id,h3_cell,vehicle_id,issue_type,description,status,helper_id,target_type,target_id,urgency,resolved_at,expires_at,created_at';

type Supabase = NonNullable<ReturnType<typeof getServiceSupabaseClient>>;

v2HelpRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreateHelpSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);
  if (!isValidCell(parsed.data.h3_cell)) return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);

  const requesterId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  if (parsed.data.vehicle_id) {
    const vehicle = await assertOwnedVehicle(supabase, requesterId, parsed.data.vehicle_id);
    if (vehicle.error) return c.json({ code: 'INTERNAL_ERROR', error: vehicle.error.message }, 500);
    if (!vehicle.exists) return c.json({ code: 'VALIDATION_ERROR', error: 'Vehicle does not belong to user' }, 422);
  }

  if (parsed.data.target_type === 'group') {
    const member = await assertCommunityMember(supabase, requesterId, parsed.data.target_id!);
    if (member.error) return c.json({ code: 'INTERNAL_ERROR', error: member.error.message }, 500);
    if (!member.exists) return c.json({ code: 'FORBIDDEN', error: 'Community membership required' }, 403);
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from('help_requests')
    .select('id', { count: 'exact', head: true })
    .eq('requester_id', requesterId)
    .gte('created_at', oneHourAgo);

  if (countError) return c.json({ code: 'INTERNAL_ERROR', error: countError.message }, 500);
  if ((count ?? 0) >= 2) return c.json({ code: 'RATE_LIMITED', error: 'Hourly help request limit reached' }, 429);

  const helperIds = parsed.data.target_type === 'followers'
    ? await getFollowerIds(supabase, requesterId)
    : { data: [] as string[] };
  if (helperIds.error) return c.json({ code: 'INTERNAL_ERROR', error: helperIds.error.message }, 500);

  const { data, error } = await supabase
    .from('help_requests')
    .insert({
      h3_cell: parsed.data.h3_cell,
      issue_type: parsed.data.issue_type,
      description: parsed.data.description,
      vehicle_id: parsed.data.vehicle_id,
      target_type: parsed.data.target_type,
      target_id: parsed.data.target_id,
      urgency: parsed.data.urgency,
      requester_id: requesterId,
    })
    .select(HELP_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  const event: RealtimeHelpEvent = {
    type: 'help_targeted',
    help_request_id: data.id,
    h3_cell: data.h3_cell,
    requester_id: data.requester_id,
    issue_type: data.issue_type,
    target_type: data.target_type,
    target_id: data.target_id,
    urgency: data.urgency,
  };
  if (data.target_type === 'followers') event.helper_ids = helperIds.data;
  if (data.target_type === 'group' && data.target_id) event.community_id = data.target_id;

  void notifyRealtimeHelpEvent(event);

  return c.json({ data }, 201);
});

async function assertOwnedVehicle(supabase: Supabase, userId: string, vehicleId: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id')
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { exists: false, error };
  return { exists: Boolean(data) };
}

async function assertCommunityMember(supabase: Supabase, userId: string, communityId: string) {
  const { data, error } = await supabase
    .from('community_members')
    .select('user_id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { exists: false, error };
  return { exists: Boolean(data) };
}

async function getFollowerIds(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('followee_id', userId)
    .limit(500);

  if (error) return { data: [] as string[], error };
  return { data: data.map((row) => row.follower_id as string) };
}
