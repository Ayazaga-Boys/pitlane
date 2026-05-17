import type { SupabaseClient } from '@supabase/supabase-js';

const PROFILE_EXPORT_SELECT =
  'id,username,display_name,avatar_url,bio,ghost_mode,is_verified,role,notification_prefs,created_at,updated_at';

const MESSAGE_EXPORT_SELECT =
  'id,sender_id,dm_peer_id,community_id,flare_id,help_req_id,body,media_url,media_type,is_deleted,created_at';

type QueryResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

export type UserExportArchive = {
  format_version: 1;
  generated_at: string;
  user_id: string;
  profile: unknown;
  vehicles: unknown[];
  communities: {
    owned: unknown[];
    memberships: unknown[];
  };
  flares: {
    created: unknown[];
    rsvps: unknown[];
  };
  business_pins: unknown[];
  help_requests: unknown[];
  messages: unknown[];
  media_assets: unknown[];
  reports: unknown[];
  notifications: unknown[];
  blocks: unknown[];
  push_devices: unknown[];
};

function unwrap<T>(name: string, result: QueryResult<T>): T {
  if (result.error) throw new Error(`${name}: ${result.error.message}`);
  return result.data as T;
}

function unwrapList<T>(name: string, result: QueryResult<T[] | null>): T[] {
  return unwrap<T[] | null>(name, result) ?? [];
}

export async function buildUserExportArchive(
  supabase: SupabaseClient,
  userId: string,
  generatedAt = new Date(),
): Promise<UserExportArchive> {
  const [
    profile,
    vehicles,
    ownedCommunities,
    communityMemberships,
    createdFlares,
    flareRsvps,
    businessPins,
    helpRequests,
    messages,
    mediaAssets,
    reports,
    notifications,
    blocks,
    pushDevices,
  ] = await Promise.all([
    supabase.from('profiles').select(PROFILE_EXPORT_SELECT).eq('id', userId).maybeSingle(),
    supabase.from('vehicles').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('communities').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
    supabase.from('community_members').select('*').eq('user_id', userId).order('joined_at', { ascending: false }),
    supabase.from('flares').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
    supabase.from('flare_rsvps').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('business_pins').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('help_requests')
      .select('*')
      .or(`requester_id.eq.${userId},helper_id.eq.${userId}`)
      .order('created_at', { ascending: false }),
    supabase
      .from('messages')
      .select(MESSAGE_EXPORT_SELECT)
      .or(`sender_id.eq.${userId},dm_peer_id.eq.${userId}`)
      .order('created_at', { ascending: false }),
    supabase.from('media_assets').select('*').eq('uploader_id', userId).order('created_at', { ascending: false }),
    supabase.from('reports').select('*').eq('reporter_id', userId).order('created_at', { ascending: false }),
    supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('blocks')
      .select('*')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
      .order('created_at', { ascending: false }),
    supabase.from('push_devices').select('*').eq('user_id', userId).order('last_seen_at', { ascending: false }),
  ]);

  return {
    format_version: 1,
    generated_at: generatedAt.toISOString(),
    user_id: userId,
    profile: unwrap('profile', profile),
    vehicles: unwrapList('vehicles', vehicles),
    communities: {
      owned: unwrapList('communities.owned', ownedCommunities),
      memberships: unwrapList('communities.memberships', communityMemberships),
    },
    flares: {
      created: unwrapList('flares.created', createdFlares),
      rsvps: unwrapList('flares.rsvps', flareRsvps),
    },
    business_pins: unwrapList('business_pins', businessPins),
    help_requests: unwrapList('help_requests', helpRequests),
    messages: unwrapList('messages', messages),
    media_assets: unwrapList('media_assets', mediaAssets),
    reports: unwrapList('reports', reports),
    notifications: unwrapList('notifications', notifications),
    blocks: unwrapList('blocks', blocks),
    push_devices: unwrapList('push_devices', pushDevices),
  };
}
