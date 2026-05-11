import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { CreateReportSchema } from '../schemas/moderation.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const reportRoutes = new Hono<AppEnv>();

const REPORT_SELECT =
  'id,reporter_id,content_type,content_id,reason,description,status,reviewed_by,reviewed_at,action_taken,created_at';

reportRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateReportSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const reporterId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('reports')
    .insert({ ...parsed.data, reporter_id: reporterId })
    .select(REPORT_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

reportRoutes.get('/my', async (c) => {
  const reporterId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_SELECT)
    .eq('reporter_id', reporterId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});
