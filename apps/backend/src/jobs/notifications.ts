import type { SupabaseClient } from '@supabase/supabase-js';
import {
  sendPushToUser,
  type PushDeliverySummary,
  type PushPayload,
  type PushProvider,
} from '../services/push.js';

const NOTIFICATION_SELECT = 'id,user_id,type,title,body,data,is_read,created_at';

export interface NotificationJobInput {
  supabase: SupabaseClient;
  provider: PushProvider;
  userId: string;
  payload: PushPayload;
  now?: Date;
}

export interface NotificationJobResult {
  notification: unknown;
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

  const push = await sendPushToUser(
    input.supabase,
    input.userId,
    input.payload,
    input.provider,
    input.now ?? new Date(),
  );

  return {
    notification: notificationResult.data,
    push,
  };
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
