import { describe, expect, it } from 'vitest';
import { buildDeletedProfileUsername } from '../src/jobs/profile-deletion.js';
import { getRetentionCutoffs } from '../src/jobs/retention.js';
import { createUserExportStorageKey } from '../src/services/user-export.js';
import { normalizeLocationCellsToHeatmapCounts } from '../src/services/valkey.js';

describe('retention jobs', () => {
  it('calculates canonical retention cutoffs', () => {
    const cutoffs = getRetentionCutoffs(new Date('2026-05-17T12:00:00.000Z'));

    expect(cutoffs.now).toBe('2026-05-17T12:00:00.000Z');
    expect(cutoffs.unreadNotifications).toBe('2026-04-17T12:00:00.000Z');
    expect(cutoffs.readNotifications).toBe('2026-02-16T12:00:00.000Z');
    expect(cutoffs.resolvedHelpRequests).toBe('2025-11-18T12:00:00.000Z');
    expect(cutoffs.endedFlares).toBe('2025-05-17T12:00:00.000Z');
  });

  it('builds profile-safe deleted usernames', () => {
    expect(buildDeletedProfileUsername('00000000-0000-4000-8000-000000000001')).toBe('deleted_000000000000');
    expect(buildDeletedProfileUsername('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')).toMatch(/^[A-Za-z0-9_]{3,20}$/);
  });

  it('builds stable user export storage keys', () => {
    expect(createUserExportStorageKey(
      '00000000-0000-4000-8000-000000000001',
      new Date('2026-05-20T13:45:30.000Z'),
    )).toBe('exports/00000000-0000-4000-8000-000000000001/rollpit-export-20260520T134530Z.json');
  });

  it('groups realtime location cells into res-8 heatmap counts', () => {
    const counts = normalizeLocationCellsToHeatmapCounts([
      '89283082803ffff',
      '8928308280fffff',
      'bad-cell',
    ]);

    expect(counts['8828308281fffff']).toBe(2);
  });
});
