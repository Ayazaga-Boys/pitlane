import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { V2PresenceSchema } from '../schemas/v2-social.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2PresenceRoutes = new Hono<AppEnv>();

const PRESENCE_SELECT = 'id,presence_status,presence_visible,presence_updated_at';

v2PresenceRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = V2PresenceSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const update = {
    presence_status: parsed.data.status,
    presence_updated_at: new Date().toISOString(),
    ...(parsed.data.visible !== undefined ? { presence_visible: parsed.data.visible } : {}),
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select(PRESENCE_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Profile not found' }, 404);
  return c.json({ data: toPresenceResponse(data, true) });
});

export function toPresenceResponse(
  row: { id: string; presence_status?: string | null; presence_visible?: boolean | null; presence_updated_at?: string | null },
  visible: boolean,
) {
  const status = visible && row.presence_visible !== false ? row.presence_status ?? 'offline' : 'offline';
  return {
    user_id: row.id,
    status,
    visible: visible && row.presence_visible !== false,
    updated_at: visible && row.presence_visible !== false ? row.presence_updated_at ?? null : null,
  };
}
