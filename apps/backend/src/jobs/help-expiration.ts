import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceSupabaseClient } from '../services/supabase.js';

type CountableQuery = {
  count: number | null;
  error: { message: string } | null;
};

export interface HelpRequestExpirationResult {
  expired_help_requests: number;
  expired_at: string;
}

export async function runHelpRequestExpiration(input: {
  supabase?: SupabaseClient | null;
  now?: Date;
} = {}): Promise<HelpRequestExpirationResult> {
  const supabase = input.supabase === undefined ? getServiceSupabaseClient() : input.supabase;
  if (!supabase) throw new Error('Supabase service client is not configured');

  const expiredAt = (input.now ?? new Date()).toISOString();
  const expiredHelpRequests = await expireOpenHelpRequests(supabase, expiredAt);

  return {
    expired_help_requests: expiredHelpRequests,
    expired_at: expiredAt,
  };
}

export async function expireOpenHelpRequests(supabase: SupabaseClient, nowIso: string): Promise<number> {
  const count = await countRows(
    supabase
      .from('help_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open')
      .lt('expires_at', nowIso) as PromiseLike<CountableQuery>,
  );

  if (count === 0) return 0;

  const { error } = await supabase
    .from('help_requests')
    .update({ status: 'expired' })
    .eq('status', 'open')
    .lt('expires_at', nowIso);

  if (error) throw new Error(error.message);
  return count;
}

async function countRows(query: PromiseLike<CountableQuery>): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}
