import { getServiceSupabaseClient } from '../services/supabase.js';

const OFFLINE_AFTER_MS = 5 * 60 * 1000;

export async function runPresenceOfflineCleanup(now = new Date()) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) throw new Error('Supabase service client is not configured');

  const cutoff = new Date(now.getTime() - OFFLINE_AFTER_MS).toISOString();
  const { data, error } = await supabase
    .from('profiles')
    .update({
      presence_status: 'offline',
      presence_updated_at: now.toISOString(),
    })
    .in('presence_status', ['online', 'dnd'])
    .lt('presence_updated_at', cutoff)
    .select('id,presence_status,presence_updated_at');

  if (error) throw new Error(error.message);

  return {
    cutoff,
    updated: data?.length ?? 0,
    profiles: data ?? [],
  };
}
