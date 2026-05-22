import type { SupabaseClient } from '@supabase/supabase-js';
import { expireOpenHelpRequests } from './help-expiration.js';
import { getServiceSupabaseClient } from '../services/supabase.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RetentionCutoffs {
  now: string;
  unreadNotifications: string;
  readNotifications: string;
  resolvedHelpRequests: string;
  endedFlares: string;
}

export interface RetentionCleanupResult {
  expired_help_requests: number;
  deleted_unread_notifications: number;
  deleted_read_notifications: number;
  deleted_resolved_help_requests: number;
  deleted_ended_flares: number;
}

type CountableQuery = {
  count: number | null;
  error: { message: string } | null;
};

export function getRetentionCutoffs(now = new Date()): RetentionCutoffs {
  return {
    now: now.toISOString(),
    unreadNotifications: new Date(now.getTime() - 30 * DAY_MS).toISOString(),
    readNotifications: new Date(now.getTime() - 90 * DAY_MS).toISOString(),
    resolvedHelpRequests: new Date(now.getTime() - 180 * DAY_MS).toISOString(),
    endedFlares: new Date(now.getTime() - 365 * DAY_MS).toISOString(),
  };
}

export async function runRetentionCleanup(input: {
  supabase?: SupabaseClient | null;
  now?: Date;
} = {}): Promise<RetentionCleanupResult> {
  const supabase = input.supabase ?? getServiceSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase service client is not configured');
  }

  const cutoffs = getRetentionCutoffs(input.now);
  const [
    expiredHelpRequests,
    deletedUnreadNotifications,
    deletedReadNotifications,
    deletedResolvedHelpRequests,
    deletedEndedFlares,
  ] = await Promise.all([
    expireOpenHelpRequests(supabase, cutoffs.now),
    deleteNotifications(supabase, false, cutoffs.unreadNotifications),
    deleteNotifications(supabase, true, cutoffs.readNotifications),
    deleteResolvedHelpRequests(supabase, cutoffs.resolvedHelpRequests),
    deleteEndedFlares(supabase, cutoffs.endedFlares),
  ]);

  return {
    expired_help_requests: expiredHelpRequests,
    deleted_unread_notifications: deletedUnreadNotifications,
    deleted_read_notifications: deletedReadNotifications,
    deleted_resolved_help_requests: deletedResolvedHelpRequests,
    deleted_ended_flares: deletedEndedFlares,
  };
}

async function deleteNotifications(
  supabase: SupabaseClient,
  isRead: boolean,
  cutoffIso: string,
): Promise<number> {
  const count = await countRows(
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', isRead)
      .lt('created_at', cutoffIso) as PromiseLike<CountableQuery>,
  );

  if (count === 0) return 0;

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('is_read', isRead)
    .lt('created_at', cutoffIso);

  if (error) throw new Error(error.message);
  return count;
}

async function deleteResolvedHelpRequests(supabase: SupabaseClient, cutoffIso: string): Promise<number> {
  const statuses = ['resolved', 'cancelled', 'expired'];
  const count = await countRows(
    supabase
      .from('help_requests')
      .select('id', { count: 'exact', head: true })
      .in('status', statuses)
      .lt('created_at', cutoffIso) as PromiseLike<CountableQuery>,
  );

  if (count === 0) return 0;

  const { error } = await supabase
    .from('help_requests')
    .delete()
    .in('status', statuses)
    .lt('created_at', cutoffIso);

  if (error) throw new Error(error.message);
  return count;
}

async function deleteEndedFlares(supabase: SupabaseClient, cutoffIso: string): Promise<number> {
  const count = await countRows(
    supabase
      .from('flares')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ended')
      .lt('ends_at', cutoffIso) as PromiseLike<CountableQuery>,
  );

  if (count === 0) return 0;

  const { error } = await supabase
    .from('flares')
    .delete()
    .eq('status', 'ended')
    .lt('ends_at', cutoffIso);

  if (error) throw new Error(error.message);
  return count;
}

async function countRows(query: PromiseLike<CountableQuery>): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}
