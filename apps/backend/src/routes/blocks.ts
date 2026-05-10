import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { UserIdParamSchema } from '../schemas/moderation.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const blockRoutes = new Hono<AppEnv>();

blockRoutes.get('/', async (c) => {
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id,created_at,profiles!blocks_blocked_id_fkey(username,display_name,avatar_url)')
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false });

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

blockRoutes.post('/:userId', async (c) => {
  const params = UserIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const blockerId = c.get('userId') as string;
  if (blockerId === params.data.userId) {
    return c.json({ code: 'VALIDATION_ERROR', error: 'Cannot block yourself' }, 422);
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { error } = await supabase
    .from('blocks')
    .upsert({ blocker_id: blockerId, blocked_id: params.data.userId }, { onConflict: 'blocker_id,blocked_id' });

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data: { blocked: true } }, 201);
});

blockRoutes.delete('/:userId', async (c) => {
  const params = UserIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const blockerId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', params.data.userId);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data: { blocked: false } });
});
