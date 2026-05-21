import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceSupabaseClient } from '../services/supabase.js';

const DEFAULT_LIMIT = 100;

type DueProfile = {
  id: string;
  delete_after: string | null;
};

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

type CountableQuery = {
  count: number | null;
  error: { message: string } | null;
};

export interface ProfileDeletionCleanupResult {
  processed_profiles: number;
  anonymized_profiles: number;
  deleted_push_devices: number;
  deleted_vehicles: number;
  deleted_notifications: number;
  deleted_blocks: number;
  deleted_community_memberships: number;
  deleted_flare_rsvps: number;
}

export function buildDeletedProfileUsername(userId: string): string {
  return `deleted_${userId.replaceAll('-', '').slice(0, 12)}`;
}

export async function runProfileDeletionCleanup(input: {
  supabase?: SupabaseClient | null;
  now?: Date;
  limit?: number;
} = {}): Promise<ProfileDeletionCleanupResult> {
  const supabase = input.supabase ?? getServiceSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase service client is not configured');
  }

  const nowIso = (input.now ?? new Date()).toISOString();
  const limit = input.limit ?? DEFAULT_LIMIT;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,delete_after')
    .not('delete_after', 'is', null)
    .lte('delete_after', nowIso)
    .limit(limit) as QueryResult<DueProfile[]>;

  if (error) throw new Error(error.message);

  const result: ProfileDeletionCleanupResult = {
    processed_profiles: data?.length ?? 0,
    anonymized_profiles: 0,
    deleted_push_devices: 0,
    deleted_vehicles: 0,
    deleted_notifications: 0,
    deleted_blocks: 0,
    deleted_community_memberships: 0,
    deleted_flare_rsvps: 0,
  };

  for (const profile of data ?? []) {
    const [
      deletedPushDevices,
      deletedVehicles,
      deletedNotifications,
      deletedBlocks,
      deletedCommunityMemberships,
      deletedFlareRsvps,
    ] = await Promise.all([
      deleteRowsByUser(supabase, 'push_devices', 'user_id', profile.id),
      deleteRowsByUser(supabase, 'vehicles', 'user_id', profile.id),
      deleteRowsByUser(supabase, 'notifications', 'user_id', profile.id),
      deleteRowsForEitherUserColumn(supabase, 'blocks', 'blocker_id', 'blocked_id', profile.id),
      deleteRowsByUser(supabase, 'community_members', 'user_id', profile.id),
      deleteRowsByUser(supabase, 'flare_rsvps', 'user_id', profile.id),
    ]);

    await anonymizeProfile(supabase, profile.id);

    result.anonymized_profiles += 1;
    result.deleted_push_devices += deletedPushDevices;
    result.deleted_vehicles += deletedVehicles;
    result.deleted_notifications += deletedNotifications;
    result.deleted_blocks += deletedBlocks;
    result.deleted_community_memberships += deletedCommunityMemberships;
    result.deleted_flare_rsvps += deletedFlareRsvps;
  }

  return result;
}

async function anonymizeProfile(supabase: SupabaseClient, userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      username: buildDeletedProfileUsername(userId),
      display_name: null,
      avatar_url: null,
      bio: null,
      ghost_mode: true,
      is_verified: false,
      notification_prefs: {},
      deletion_requested_at: null,
      delete_after: null,
      deletion_reason: null,
      deletion_cancel_token_hash: null,
      deletion_cancel_token_expires_at: null,
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
}

async function deleteRowsByUser(
  supabase: SupabaseClient,
  table: string,
  column: string,
  userId: string,
): Promise<number> {
  const count = await countRows(
    supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(column, userId) as PromiseLike<CountableQuery>,
  );

  if (count === 0) return 0;

  const { error } = await supabase
    .from(table)
    .delete()
    .eq(column, userId);

  if (error) throw new Error(error.message);
  return count;
}

async function deleteRowsForEitherUserColumn(
  supabase: SupabaseClient,
  table: string,
  firstColumn: string,
  secondColumn: string,
  userId: string,
): Promise<number> {
  const filter = `${firstColumn}.eq.${userId},${secondColumn}.eq.${userId}`;
  const count = await countRows(
    supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .or(filter) as PromiseLike<CountableQuery>,
  );

  if (count === 0) return 0;

  const { error } = await supabase
    .from(table)
    .delete()
    .or(filter);

  if (error) throw new Error(error.message);
  return count;
}

async function countRows(query: PromiseLike<CountableQuery>): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}
