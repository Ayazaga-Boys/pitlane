import { getServiceSupabaseClient } from '../services/supabase.js';

export async function refreshDiscoverFeedScores(): Promise<{ refreshed: true; refreshed_at: string }> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase.rpc('refresh_post_discovery_scores');
  if (error) throw new Error(error.message);

  return {
    refreshed: true,
    refreshed_at: new Date().toISOString(),
  };
}
