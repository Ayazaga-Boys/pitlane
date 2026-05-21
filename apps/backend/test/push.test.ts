import { describe, expect, it } from 'vitest';
import { getHelpNotificationTargetIds } from '../src/jobs/notifications.js';
import {
  getPushPreferenceDecision,
  isInvalidPushTokenError,
  isQuietHoursActive,
  normalizePushData,
} from '../src/services/push.js';

function localDateAt(hours: number, minutes: number): Date {
  return new Date(2026, 0, 1, hours, minutes, 0);
}

describe('push notification helpers', () => {
  it('classifies invalid provider token errors', () => {
    expect(isInvalidPushTokenError('messaging/registration-token-not-registered')).toBe(true);
    expect(isInvalidPushTokenError('BadDeviceToken')).toBe(true);
    expect(isInvalidPushTokenError('messaging/internal-error')).toBe(false);
    expect(isInvalidPushTokenError(undefined)).toBe(false);
  });

  it('detects same-day quiet hours', () => {
    expect(isQuietHoursActive(localDateAt(13, 30), '12:00', '14:00')).toBe(true);
    expect(isQuietHoursActive(localDateAt(15, 0), '12:00', '14:00')).toBe(false);
  });

  it('detects overnight quiet hours', () => {
    expect(isQuietHoursActive(localDateAt(23, 30), '23:00', '08:00')).toBe(true);
    expect(isQuietHoursActive(localDateAt(7, 59), '23:00', '08:00')).toBe(true);
    expect(isQuietHoursActive(localDateAt(12, 0), '23:00', '08:00')).toBe(false);
  });

  it('allows push by default and blocks explicit disabled prefs', () => {
    expect(getPushPreferenceDecision({}, 'dm_new').allowed).toBe(true);
    expect(getPushPreferenceDecision({ dm_new: false }, 'dm_new')).toEqual({
      allowed: false,
      reason: 'disabled',
    });
  });

  it('blocks allowed notification types during quiet hours', () => {
    expect(getPushPreferenceDecision({
      dm_new: true,
      quiet_hours_start: '23:00',
      quiet_hours_end: '08:00',
    }, 'dm_new', localDateAt(23, 5))).toEqual({
      allowed: false,
      reason: 'quiet_hours',
    });
  });

  it('normalizes provider data payloads to strings', () => {
    expect(normalizePushData({
      conversation_id: 'abc',
      unread_count: 3,
      urgent: true,
      empty: null,
      missing: undefined,
    })).toEqual({
      conversation_id: 'abc',
      unread_count: '3',
      urgent: 'true',
    });
  });

  it('deduplicates help notification targets and filters requester plus blocks', () => {
    expect(getHelpNotificationTargetIds(
      ['requester', 'helper-a', 'helper-a', 'helper-b', 'blocked'],
      'requester',
      ['blocked'],
    )).toEqual(['helper-a', 'helper-b']);
  });
});
