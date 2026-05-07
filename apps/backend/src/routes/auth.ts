import { Hono } from 'hono';
import { JoinWaitingListSchema, ValidateInviteCodeSchema } from '../schemas/auth.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import { serviceUnavailable, validationError } from '../lib/http.js';

export const authRoutes = new Hono();

authRoutes.post('/invite-codes/validate', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = ValidateInviteCodeSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('invite_codes')
    .select('code,uses_count,max_uses,expires_at')
    .eq('code', parsed.data.code)
    .maybeSingle();

  if (error) {
    return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  }

  const expiresAt = data?.expires_at ? new Date(data.expires_at) : null;
  const valid = Boolean(
    data &&
      data.uses_count < data.max_uses &&
      (!expiresAt || expiresAt.getTime() > Date.now()),
  );

  return c.json({
    data: {
      valid,
      remaining_uses: data ? Math.max(data.max_uses - data.uses_count, 0) : 0,
    },
  });
});

authRoutes.post('/waiting-list', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = JoinWaitingListSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('waiting_list')
    .upsert(parsed.data, { onConflict: 'email' })
    .select('id,email,vehicle_type,city,created_at')
    .single();

  if (error) {
    return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  }

  return c.json({ data }, 201);
});
