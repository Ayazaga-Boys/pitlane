import type { SupabaseClient } from '@supabase/supabase-js';
import type { z } from 'zod';
import type { NotificationPrefsSchema } from '../schemas/profile.schema.js';

export const PUSH_NOTIFICATION_TYPES = [
  'help_nearby',
  'help_helper_arrived',
  'flare_invite',
  'flare_starting',
  'dm_new',
  'community_message',
  'community_invite',
  'system',
] as const;

export type PushNotificationType = (typeof PUSH_NOTIFICATION_TYPES)[number];
export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>;

export interface PushDevice {
  id: string;
  user_id: string;
  platform: 'ios' | 'android';
  token: string;
  app_build?: string | null;
  last_seen_at?: string | null;
}

export interface PushPayload {
  type: PushNotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushProviderSendResult {
  success: boolean;
  errorCode?: string;
}

export interface PushProvider {
  send(device: PushDevice, payload: PushPayload): Promise<PushProviderSendResult>;
}

export interface PushDeliverySummary {
  attempted: number;
  sent: number;
  failed: number;
  invalidTokensDeleted: number;
  skipped: boolean;
  skipReason?: 'disabled' | 'quiet_hours';
}

interface ProfileNotificationPrefsRow {
  notification_prefs: NotificationPrefs | null;
}

export const INVALID_PUSH_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
  'NotRegistered',
  'BadDeviceToken',
  'Unregistered',
]);

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isInvalidPushTokenError(errorCode: string | undefined): boolean {
  return Boolean(errorCode && INVALID_PUSH_ERROR_CODES.has(errorCode));
}

export function normalizePushData(data: Record<string, unknown> | undefined): Record<string, string> {
  if (!data) return {};

  return Object.fromEntries(
    Object.entries(data)
      .filter((entry): entry is [string, Exclude<unknown, undefined | null>] => (
        entry[1] !== undefined && entry[1] !== null
      ))
      .map(([key, value]) => [key, String(value)]),
  );
}

export function isQuietHoursActive(now: Date, start: string | undefined, end: string | undefined): boolean {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }

  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

export function getPushPreferenceDecision(
  prefs: NotificationPrefs | null | undefined,
  type: PushNotificationType,
  now = new Date(),
): { allowed: true } | { allowed: false; reason: 'disabled' | 'quiet_hours' } {
  if (prefs?.[type] === false) return { allowed: false, reason: 'disabled' };
  if (isQuietHoursActive(now, prefs?.quiet_hours_start, prefs?.quiet_hours_end)) {
    return { allowed: false, reason: 'quiet_hours' };
  }

  return { allowed: true };
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload,
  provider: PushProvider,
  now = new Date(),
): Promise<PushDeliverySummary> {
  const profileResult = await supabase
    .from('profiles')
    .select('notification_prefs')
    .eq('id', userId)
    .maybeSingle();

  if (profileResult.error) throw new Error(profileResult.error.message);

  const profile = profileResult.data as ProfileNotificationPrefsRow | null;
  const decision = getPushPreferenceDecision(profile?.notification_prefs, payload.type, now);
  if (!decision.allowed) {
    return {
      attempted: 0,
      sent: 0,
      failed: 0,
      invalidTokensDeleted: 0,
      skipped: true,
      skipReason: decision.reason,
    };
  }

  const devicesResult = await supabase
    .from('push_devices')
    .select('id,user_id,platform,token,app_build,last_seen_at')
    .eq('user_id', userId);

  if (devicesResult.error) throw new Error(devicesResult.error.message);

  const devices = (devicesResult.data ?? []) as PushDevice[];
  const results = await Promise.all(devices.map((device) => sendSafely(provider, device, payload)));
  const invalidTokens = results
    .filter((result) => !result.success && isInvalidPushTokenError(result.errorCode))
    .map((result) => result.token);

  if (invalidTokens.length > 0) {
    const deleteResult = await supabase
      .from('push_devices')
      .delete()
      .eq('user_id', userId)
      .in('token', invalidTokens);

    if (deleteResult.error) throw new Error(deleteResult.error.message);
  }

  return {
    attempted: devices.length,
    sent: results.filter((result) => result.success).length,
    failed: results.filter((result) => !result.success).length,
    invalidTokensDeleted: invalidTokens.length,
    skipped: false,
  };
}

function parseTimeToMinutes(value: string | undefined): number | null {
  if (!value || !TIME_PATTERN.test(value)) return null;

  const [hour, minute] = value.split(':');
  if (hour === undefined || minute === undefined) return null;

  return Number(hour) * 60 + Number(minute);
}

async function sendSafely(
  provider: PushProvider,
  device: PushDevice,
  payload: PushPayload,
): Promise<PushProviderSendResult & { token: string }> {
  try {
    const result = await provider.send(device, payload);
    return { ...result, token: device.token };
  } catch (error) {
    const errorCode = extractErrorCode(error);
    if (errorCode) return { success: false, errorCode, token: device.token };
    return { success: false, token: device.token };
  }
}

function extractErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if ('code' in error && typeof error.code === 'string') return error.code;
  if ('errorCode' in error && typeof error.errorCode === 'string') return error.errorCode;
  return undefined;
}
