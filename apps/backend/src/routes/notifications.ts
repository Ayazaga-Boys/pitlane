import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  ListNotificationsQuerySchema,
  NotificationIdParamSchema,
  PushDeviceTokenParamSchema,
  RegisterDeviceSchema,
} from '../schemas/notification.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const notificationRoutes = new Hono<AppEnv>();

const NOTIFICATION_SELECT = 'id,user_id,type,title,body,data,is_read,created_at';

notificationRoutes.get('/', async (c) => {
  const parsed = ListNotificationsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const end = parsed.data.offset + parsed.data.limit - 1;
  const { data, count, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(parsed.data.offset, end);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  return c.json({
    data,
    meta: {
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      total: count ?? 0,
    },
  });
});

notificationRoutes.patch('/read-all', async (c) => {
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data: { updated: true } });
});

notificationRoutes.patch('/:id/read', async (c) => {
  const params = NotificationIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', params.data.id)
    .eq('user_id', userId)
    .select(NOTIFICATION_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Notification not found' }, 404);
  return c.json({ data });
});

notificationRoutes.post('/devices', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = RegisterDeviceSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('push_devices')
    .upsert(
      {
        user_id: userId,
        platform: parsed.data.platform,
        token: parsed.data.token,
        app_build: parsed.data.app_build,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' },
    )
    .select('id,user_id,platform,token,app_build,last_seen_at,created_at')
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

notificationRoutes.delete('/devices/:token', async (c) => {
  const params = PushDeviceTokenParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { error } = await supabase
    .from('push_devices')
    .delete()
    .eq('user_id', userId)
    .eq('token', params.data.token);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data: { deleted: true } });
});
