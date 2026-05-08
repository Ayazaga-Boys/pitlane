import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';
import { z } from 'zod';

export const helpRequestRoutes = new Hono<AppEnv>();

const HR_SELECT =
  'id,requester_id,h3_cell,issue_type,description,status,helper_id,expires_at,created_at';

const CreateHelpRequestSchema = z.object({
  h3_cell: z.string().regex(/^[0-9a-f]{15}$/, 'Invalid H3 cell'),
  issue_type: z.enum(['breakdown', 'flat_tire', 'fuel', 'accident', 'other']),
  description: z.string().max(300).optional(),
  vehicle_id: z.string().uuid().optional(),
});

// POST /v1/help-requests — yardım isteği oluştur
helpRequestRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateHelpRequestSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  // Kullanıcının açık isteği varsa yenisini açmasın
  const { count } = await supabase
    .from('help_requests')
    .select('id', { count: 'exact', head: true })
    .eq('requester_id', userId)
    .eq('status', 'open')
    .gt('expires_at', new Date().toISOString());

  if ((count ?? 0) > 0) {
    return c.json({ code: 'CONFLICT', error: 'Zaten açık bir yardım isteğin var' }, 409);
  }

  const { data, error } = await supabase
    .from('help_requests')
    .insert({ ...parsed.data, requester_id: userId })
    .select(HR_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

// GET /v1/help-requests/mine — kendi isteğim
helpRequestRoutes.get('/mine', async (c) => {
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('help_requests')
    .select(HR_SELECT)
    .eq('requester_id', userId)
    .eq('status', 'open')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

// DELETE /v1/help-requests/:id — isteği iptal et
helpRequestRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('help_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('requester_id', userId)
    .select(HR_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Help request not found' }, 404);
  return c.json({ data });
});
