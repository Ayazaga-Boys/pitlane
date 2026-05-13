import { Hono, type Context } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  ListMessagesQuerySchema,
  MessageIdParamSchema,
  PeerIdParamSchema,
  RoomIdParamSchema,
  SendMessageSchema,
} from '../schemas/message.schema.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const messageRoutes = new Hono<AppEnv>();

const MESSAGE_SELECT =
  'id,sender_id,dm_peer_id,community_id,flare_id,help_req_id,body,media_url,media_type,is_deleted,created_at,sender:profiles!messages_sender_id_fkey(username,display_name)';

type RawMessage = {
  id: string;
  sender_id: string;
  dm_peer_id?: string | null;
  community_id?: string | null;
  flare_id?: string | null;
  help_req_id?: string | null;
  body?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  is_deleted?: boolean | null;
  created_at: string;
  sender?: { username?: string | null; display_name?: string | null } | null;
};

function serializeMessage(message: RawMessage, currentUserId: string) {
  const isDeleted = Boolean(message.is_deleted);
  return {
    ...message,
    body: isDeleted ? '' : message.body,
    media_url: isDeleted ? null : message.media_url,
    media_type: isDeleted ? null : message.media_type,
    is_mine: message.sender_id === currentUserId,
    sender_is_me: message.sender_id === currentUserId,
    sender_name: message.sender?.display_name ?? message.sender?.username ?? undefined,
  };
}

async function isBlockedBetween(userId: string, peerId: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return false;

  const { count } = await supabase
    .from('blocks')
    .select('blocker_id', { count: 'exact', head: true })
    .or(`and(blocker_id.eq.${userId},blocked_id.eq.${peerId}),and(blocker_id.eq.${peerId},blocked_id.eq.${userId})`);

  return (count ?? 0) > 0;
}

async function canSendToCommunity(communityId: string, userId: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();

  return Boolean(data);
}

async function canSendToFlare(flareId: string, userId: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from('flare_rsvps')
    .select('status')
    .eq('flare_id', flareId)
    .eq('user_id', userId)
    .eq('status', 'going')
    .maybeSingle();

  return Boolean(data);
}

async function canSendToHelp(helpId: string, userId: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from('help_requests')
    .select('requester_id,helper_id')
    .eq('id', helpId)
    .maybeSingle();

  return data?.requester_id === userId || data?.helper_id === userId;
}

async function listMessages(
  currentUserId: string,
  filters: { dmPeerId?: string; communityId?: string; flareId?: string; helpReqId?: string },
  limit: number,
  before?: string,
) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };

  let query = supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters.dmPeerId) {
    query = query.or(
      `and(sender_id.eq.${currentUserId},dm_peer_id.eq.${filters.dmPeerId}),and(sender_id.eq.${filters.dmPeerId},dm_peer_id.eq.${currentUserId})`,
    );
  }
  if (filters.communityId) query = query.eq('community_id', filters.communityId);
  if (filters.flareId) query = query.eq('flare_id', filters.flareId);
  if (filters.helpReqId) query = query.eq('help_req_id', filters.helpReqId);
  if (before) query = query.lt('created_at', before);

  const { data, error } = await query;
  return {
    data: data?.map((message) => serializeMessage(message as RawMessage, currentUserId)).reverse() ?? null,
    error,
  };
}

messageRoutes.get('/dms', async (c) => {
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('messages')
    .select(`${MESSAGE_SELECT},peer:profiles!messages_dm_peer_id_fkey(id,username,display_name,avatar_url)`)
    .or(`sender_id.eq.${userId},dm_peer_id.eq.${userId}`)
    .not('dm_peer_id', 'is', null)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);

  const seen = new Set<string>();
  const threads = (data ?? []).flatMap((message) => {
    const raw = message as RawMessage & {
      peer?: { id?: string; username?: string | null; display_name?: string | null; avatar_url?: string | null } | null;
    };
    const peerId = raw.sender_id === userId ? raw.dm_peer_id : raw.sender_id;
    if (!peerId || seen.has(peerId)) return [];
    seen.add(peerId);

    const profile = raw.sender_id === userId ? raw.peer : raw.sender;
    return [{
      peer_id: peerId,
      username: profile?.username,
      display_name: profile?.display_name ?? profile?.username ?? 'Rollpit user',
      avatar_url: raw.sender_id === userId ? raw.peer?.avatar_url : undefined,
      last_message_preview: raw.body ?? '',
      last_message_at: raw.created_at,
      unread_count: 0,
      is_online: false,
    }];
  });

  return c.json({ data: threads });
});

messageRoutes.get('/dms/:peerId', async (c) => {
  const params = PeerIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const query = ListMessagesQuerySchema.safeParse(c.req.query());
  if (!query.success) return validationError(c, query.error);

  const userId = c.get('userId') as string;
  const result = await listMessages(userId, { dmPeerId: params.data.peerId }, query.data.limit, query.data.before);
  if (result.error) return c.json({ code: 'INTERNAL_ERROR', error: result.error.message }, 500);
  return c.json({ data: result.data });
});

messageRoutes.post('/dms/:peerId', async (c) => {
  const params = PeerIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = SendMessageSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  if (userId === params.data.peerId) return c.json({ code: 'VALIDATION_ERROR', error: 'Cannot message yourself' }, 422);
  if (await isBlockedBetween(userId, params.data.peerId)) {
    return c.json({ code: 'FORBIDDEN', error: 'Message blocked' }, 403);
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);
  const { data, error } = await supabase
    .from('messages')
    .insert({ ...parsed.data, sender_id: userId, dm_peer_id: params.data.peerId })
    .select(MESSAGE_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data: serializeMessage(data as RawMessage, userId) }, 201);
});

async function handleRoomList(c: Context<AppEnv>, key: 'communityId' | 'flareId' | 'helpReqId') {
  const params = RoomIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const query = ListMessagesQuerySchema.safeParse(c.req.query());
  if (!query.success) return validationError(c, query.error);
  const userId = c.get('userId') as string;
  const result = await listMessages(userId, { [key]: params.data.id }, query.data.limit, query.data.before);
  if (result.error) return c.json({ code: 'INTERNAL_ERROR', error: result.error.message }, 500);
  return c.json({ data: result.data });
}

async function handleRoomSend(
  c: Context<AppEnv>,
  key: 'community_id' | 'flare_id' | 'help_req_id',
  canSend: (id: string, userId: string) => Promise<boolean>,
) {
  const params = RoomIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = SendMessageSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  if (!(await canSend(params.data.id, userId))) {
    return c.json({ code: 'FORBIDDEN', error: 'Cannot send message to this room' }, 403);
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);
  const { data, error } = await supabase
    .from('messages')
    .insert({ ...parsed.data, sender_id: userId, [key]: params.data.id })
    .select(MESSAGE_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data: serializeMessage(data as RawMessage, userId) }, 201);
}

messageRoutes.get('/communities/:id', (c) => handleRoomList(c, 'communityId'));
messageRoutes.post('/communities/:id', (c) => handleRoomSend(c, 'community_id', canSendToCommunity));
messageRoutes.get('/flares/:id', (c) => handleRoomList(c, 'flareId'));
messageRoutes.post('/flares/:id', (c) => handleRoomSend(c, 'flare_id', canSendToFlare));
messageRoutes.get('/help/:id', (c) => handleRoomList(c, 'helpReqId'));
messageRoutes.post('/help/:id', (c) => handleRoomSend(c, 'help_req_id', canSendToHelp));

messageRoutes.delete('/:id', async (c) => {
  const params = MessageIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('messages')
    .update({ is_deleted: true, body: null, media_url: null, media_type: null })
    .eq('id', params.data.id)
    .eq('sender_id', userId)
    .select(MESSAGE_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Message not found' }, 404);
  return c.json({ data: serializeMessage(data as RawMessage, userId) });
});
