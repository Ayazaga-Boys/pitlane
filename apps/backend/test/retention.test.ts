import { describe, expect, it } from 'vitest';
import { getRetentionCutoffs } from '../src/jobs/retention.js';

describe('retention jobs', () => {
  it('calculates canonical retention cutoffs', () => {
    const cutoffs = getRetentionCutoffs(new Date('2026-05-17T12:00:00.000Z'));

    expect(cutoffs.now).toBe('2026-05-17T12:00:00.000Z');
    expect(cutoffs.unreadNotifications).toBe('2026-04-17T12:00:00.000Z');
    expect(cutoffs.readNotifications).toBe('2026-02-16T12:00:00.000Z');
    expect(cutoffs.resolvedHelpRequests).toBe('2025-11-18T12:00:00.000Z');
    expect(cutoffs.endedFlares).toBe('2025-05-17T12:00:00.000Z');
  });
});
