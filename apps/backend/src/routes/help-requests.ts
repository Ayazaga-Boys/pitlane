import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import { notifyRealtimeHelpEvent } from '../services/realtime.js';
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
  void notifyRealtimeHelpEvent({
    type: 'help_created',
    help_request_id: data.id,
    h3_cell: data.h3_cell,
    requester_id: data.requester_id,
    issue_type: data.issue_type,
  });
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

// POST /v1/help-requests/:id/respond — yardım etmek istiyorum
helpRequestRoutes.post('/:id/respond', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  // İsteğin açık olduğunu ve requester'ın kendisi olmadığını kontrol et
  const { data: existing, error: fetchError } = await supabase
    .from('help_requests')
    .select('id,status,requester_id,helper_id')
    .eq('id', id)
    .eq('status', 'open')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (fetchError) return c.json({ code: 'INTERNAL_ERROR', error: fetchError.message }, 500);
  if (!existing) return c.json({ code: 'NOT_FOUND', error: 'Open help request not found' }, 404);
  if (existing.requester_id === userId) {
    return c.json({ code: 'FORBIDDEN', error: 'Kendi isteğine yardım edemezsin' }, 403);
  }
  if (existing.helper_id) {
    return c.json({ code: 'CONFLICT', error: 'Bu isteğe zaten yardım eden var' }, 409);
  }

  const { data, error } = await supabase
    .from('help_requests')
    .update({ status: 'helper_found', helper_id: userId })
    .eq('id', id)
    .select(HR_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  void notifyRealtimeHelpEvent({
    type: 'help_assigned',
    help_request_id: data.id,
    h3_cell: data.h3_cell,
    requester_id: data.requester_id,
    helper_id: data.helper_id,
  });
  return c.json({ data });
});

// POST /v1/help-requests/:id/resolve — çözüldü olarak işaretle
helpRequestRoutes.post('/:id/resolve', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('help_requests')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .or(`requester_id.eq.${userId},helper_id.eq.${userId}`)
    .select(HR_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Help request not found' }, 404);
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
