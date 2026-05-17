import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceSupabaseClient } from './supabase.js';

export type DatabaseHealth =
  | { status: 'not_configured' }
  | { status: 'ok' }
  | { status: 'error'; error: string };

export async function checkDatabaseHealth(
  supabase: SupabaseClient | null = getServiceSupabaseClient(),
): Promise<DatabaseHealth> {
  if (!supabase) return { status: 'not_configured' };

  const { error } = await supabase
    .from('remote_configs')
    .select('key', { count: 'exact', head: true })
    .limit(1);

  if (error) return { status: 'error', error: error.message };
  return { status: 'ok' };
}
