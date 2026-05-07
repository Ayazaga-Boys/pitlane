import { createClient } from '@supabase/supabase-js';
import type { Context, Next } from 'hono';
import type { AppEnv } from '../types/hono.js';

export async function requireAuth(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const devUserId = c.req.header('x-dev-user-id');
  if (process.env.NODE_ENV === 'development' && devUserId) {
    c.set('userId', devUserId);
    c.set('userEmail', c.req.header('x-dev-user-email') ?? '');
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ code: 'UNAUTHORIZED', error: 'Missing bearer token' }, 401);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return c.json({ code: 'SERVICE_UNAVAILABLE', error: 'Auth is not configured' }, 503);
  }

  const token = authHeader.slice(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return c.json({ code: 'UNAUTHORIZED', error: 'Invalid token' }, 401);
  }

  c.set('userId', data.user.id);
  await next();
}
