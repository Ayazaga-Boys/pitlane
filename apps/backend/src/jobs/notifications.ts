import type { SupabaseClient } from '@supabase/supabase-js';
import { gridDisk } from 'h3-js';
import {
  sendPushToUser,
  type PushDeliverySummary,
  type PushPayload,
  type PushProvider,
} from '../services/push.js';
import { fetchActiveUsersInCells } from '../services/valkey.js';

const NOTIFICATION_SELECT = 'id,user_id,type,title,body,data,is_read,created_at';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface NotificationJobInput {
  supabase: SupabaseClient;
  provider: PushProvider | null;
  userId: string;
  payload: PushPayload;
  now?: Date;
}

export interface NotificationJobResult {
  notification: unknown;
  push: PushDeliverySummary;
}

export interface PostNotificationResult {
  notification_created: boolean;
  debounced?: boolean;
  push: PushDeliverySummary;
}

export interface HelpNearbyNotificationResult {
  help_request_id: string;
  h3_cells: string[];
  active_users: number;
  target_users: number;
  notifications_created: number;
  push: PushDeliverySummary;
}

export async function createNotificationAndPush(input: NotificationJobInput): Promise<NotificationJobResult> {
  const notificationResult = await input.supabase
    .from('notifications')
    .insert({
      user_id: input.userId,
      type: input.payload.type,
      title: input.payload.title,
      body: input.payload.body,
      data: input.payload.data ?? {},
      is_read: false,
    })
    .select(NOTIFICATION_SELECT)
    .single();

  if (notificationResult.error) throw new Error(notificationResult.error.message);

  const push = input.provider
    ? await sendPushToUser(
      input.supabase,
      input.userId,
      input.payload,
      input.provider,
      input.now ?? new Date(),
    )
    : skippedPushSummary('provider_unconfigured');

  return {
    notification: notificationResult.data,
    push,
  };
}

export async function sendPostCommentNotification(input: Omit<NotificationJobInput, 'payload'> & {
  postId: string;
  commentId: string;
  commenterId: string;
  commenterName: string;
  commentPreview: string;
}): Promise<PostNotificationResult> {
  if (input.userId === input.commenterId) return emptyPostNotificationResult();

  const jobInput: NotificationJobInput = {
    supabase: input.supabase,
    provider: input.provider,
    userId: input.userId,
    payload: {
      type: 'post_comment',
      title: `${input.commenterName} yorum yaptı`,
      body: input.commentPreview,
      data: {
        post_id: input.postId,
        comment_id: input.commentId,
        actor_id: input.commenterId,
      },
    },
  };
  if (input.now) jobInput.now = input.now;

  const result = await createNotificationAndPush(jobInput);

  return {
    notification_created: true,
    push: result.push,
  };
}

export async function sendPostLikeNotification(input: Omit<NotificationJobInput, 'payload'> & {
  postId: string;
  likerId: string;
  likerName: string;
}): Promise<PostNotificationResult> {
  if (input.userId === input.likerId) return emptyPostNotificationResult();

  const now = input.now ?? new Date();
  const since = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const recentResult = await input.supabase
    .from('notifications')
    .select('id')
    .eq('user_id', input.userId)
    .eq('type', 'post_like')
    .contains('data', { post_id: input.postId })
    .gte('created_at', since)
    .limit(1);

  if (recentResult.error) throw new Error(recentResult.error.message);
  if ((recentResult.data ?? []).length > 0) {
    return {
      notification_created: false,
      debounced: true,
      push: skippedPushSummary('debounced'),
    };
  }

  const result = await createNotificationAndPush({
    supabase: input.supabase,
    provider: input.provider,
    userId: input.userId,
    now,
    payload: {
      type: 'post_like',
      title: `${input.likerName} gönderini beğendi`,
      body: 'Gönderine yeni bir beğeni geldi.',
      data: {
        post_id: input.postId,
        actor_id: input.likerId,
      },
    },
  });

  return {
    notification_created: true,
    push: result.push,
  };
}

export async function sendHelpNearbyNotification(input: {
  supabase: SupabaseClient;
  provider: PushProvider;
  helpRequestId: string;
  h3Cell: string;
  now?: Date;
}): Promise<HelpNearbyNotificationResult> {
  const h3Cells = gridDisk(input.h3Cell, 2);
  const activeUserIds = await fetchActiveUsersInCells(h3Cells);

  const helpRequestResult = await input.supabase
    .from('help_requests')
    .select('id,requester_id,h3_cell,issue_type,status')
    .eq('id', input.helpRequestId)
    .maybeSingle();

  if (helpRequestResult.error) throw new Error(helpRequestResult.error.message);
  if (!helpRequestResult.data) throw new Error('Help request not found');

  const helpRequest = helpRequestResult.data as {
    id: string;
    requester_id: string;
    h3_cell: string;
    issue_type: string;
    status: string;
  };
  if (helpRequest.status !== 'open') {
    return emptyHelpNearbyResult(input.helpRequestId, h3Cells, activeUserIds.length);
  }

  const activeTargetUserIds = activeUserIds.filter(isUuid);
  const blockedUserIds = await fetchHelpBlockedUserIds(input.supabase, helpRequest.requester_id, activeTargetUserIds);
  const targetUserIds = getHelpNotificationTargetIds(activeTargetUserIds, helpRequest.requester_id, blockedUserIds);
  if (targetUserIds.length === 0) {
    return emptyHelpNearbyResult(input.helpRequestId, h3Cells, activeUserIds.length);
  }

  const payload: PushPayload = {
    type: 'help_nearby',
    title: 'Yakında yardım gerekiyor',
    body: 'Yardımcı olabilir misin?',
    data: {
      help_id: helpRequest.id,
      h3_cell: helpRequest.h3_cell,
      issue_type: helpRequest.issue_type,
    },
  };

  const notificationRows = targetUserIds.map((userId) => ({
    user_id: userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    is_read: false,
  }));

  const notificationResult = await input.supabase
    .from('notifications')
    .insert(notificationRows)
    .select('id');

  if (notificationResult.error) throw new Error(notificationResult.error.message);

  const pushResults = await Promise.all(targetUserIds.map((userId) => sendPushToUser(
    input.supabase,
    userId,
    payload,
    input.provider,
    input.now ?? new Date(),
  )));

  return {
    help_request_id: input.helpRequestId,
    h3_cells: h3Cells,
    active_users: activeUserIds.length,
    target_users: targetUserIds.length,
    notifications_created: notificationResult.data?.length ?? 0,
    push: summarizePushDeliveries(pushResults),
  };
}

export function getHelpNotificationTargetIds(
  activeUserIds: string[],
  requesterId: string,
  blockedUserIds: Iterable<string>,
): string[] {
  const blocked = new Set(blockedUserIds);
  const targets = new Set<string>();

  for (const userId of activeUserIds) {
    if (userId === requesterId || blocked.has(userId)) continue;
    targets.add(userId);
  }

  return Array.from(targets);
}

async function fetchHelpBlockedUserIds(
  supabase: SupabaseClient,
  requesterId: string,
  activeUserIds: string[],
): Promise<string[]> {
  const candidates = Array.from(new Set(activeUserIds.filter((userId) => userId !== requesterId)));
  if (!isUuid(requesterId) || candidates.length === 0) return [];

  const blocksResult = await supabase
    .from('blocks')
    .select('blocker_id,blocked_id')
    .or(`and(blocker_id.eq.${requesterId},blocked_id.in.(${candidates.join(',')})),and(blocked_id.eq.${requesterId},blocker_id.in.(${candidates.join(',')}))`);

  if (blocksResult.error) throw new Error(blocksResult.error.message);

  return (blocksResult.data ?? []).flatMap((row) => {
    const block = row as { blocker_id: string; blocked_id: string };
    return block.blocker_id === requesterId ? [block.blocked_id] : [block.blocker_id];
  });
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function emptyHelpNearbyResult(
  helpRequestId: string,
  h3Cells: string[],
  activeUsers: number,
): HelpNearbyNotificationResult {
  return {
    help_request_id: helpRequestId,
    h3_cells: h3Cells,
    active_users: activeUsers,
    target_users: 0,
    notifications_created: 0,
    push: {
      attempted: 0,
      sent: 0,
      failed: 0,
      invalidTokensDeleted: 0,
      skipped: false,
    },
  };
}

function emptyPostNotificationResult(): PostNotificationResult {
  return {
    notification_created: false,
    push: skippedPushSummary('self_action'),
  };
}

function skippedPushSummary(reason?: string): PushDeliverySummary {
  return {
    attempted: 0,
    sent: 0,
    failed: 0,
    invalidTokensDeleted: 0,
    skipped: true,
    ...(reason === 'provider_unconfigured' ? { skipReason: 'disabled' as const } : {}),
  };
}

function summarizePushDeliveries(results: PushDeliverySummary[]): PushDeliverySummary {
  const summary = results.reduce<PushDeliverySummary>((current, result) => ({
    attempted: current.attempted + result.attempted,
    sent: current.sent + result.sent,
    failed: current.failed + result.failed,
    invalidTokensDeleted: current.invalidTokensDeleted + result.invalidTokensDeleted,
    skipped: current.skipped && result.skipped,
    ...(current.skipReason ?? result.skipReason
      ? { skipReason: current.skipReason ?? result.skipReason }
      : {}),
  }), {
    attempted: 0,
    sent: 0,
    failed: 0,
    invalidTokensDeleted: 0,
    skipped: results.length > 0,
  });

  return summary;
}

export function sendDmNewNotification(input: Omit<NotificationJobInput, 'payload'> & {
  senderName: string;
  conversationId: string;
  messagePreview: string;
}): Promise<NotificationJobResult> {
  const jobInput: NotificationJobInput = {
    supabase: input.supabase,
    provider: input.provider,
    userId: input.userId,
    payload: {
      type: 'dm_new',
      title: input.senderName,
      body: input.messagePreview,
      data: {
        conversation_id: input.conversationId,
      },
    },
  };

  if (input.now) jobInput.now = input.now;
  return createNotificationAndPush(jobInput);
}

export function sendFlareStartingNotification(input: Omit<NotificationJobInput, 'payload'> & {
  flareId: string;
  flareTitle: string;
  startsAt: string;
}): Promise<NotificationJobResult> {
  const jobInput: NotificationJobInput = {
    supabase: input.supabase,
    provider: input.provider,
    userId: input.userId,
    payload: {
      type: 'flare_starting',
      title: 'Flare starting soon',
      body: input.flareTitle,
      data: {
        flare_id: input.flareId,
        starts_at: input.startsAt,
      },
    },
  };

  if (input.now) jobInput.now = input.now;
  return createNotificationAndPush(jobInput);
}
