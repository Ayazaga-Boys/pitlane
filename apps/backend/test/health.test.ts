import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { checkDatabaseHealth } from '../src/services/health.js';

function fakeSupabase(error: { message: string } | null): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        limit: async () => ({ error }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe('health service', () => {
  it('reports database as not configured without Supabase client', async () => {
    await expect(checkDatabaseHealth(null)).resolves.toEqual({
      status: 'not_configured',
    });
  });

  it('reports database as ok when ping succeeds', async () => {
    await expect(checkDatabaseHealth(fakeSupabase(null))).resolves.toEqual({
      status: 'ok',
    });
  });

  it('reports database error when ping fails', async () => {
    await expect(checkDatabaseHealth(fakeSupabase({ message: 'db unavailable' }))).resolves.toEqual({
      status: 'error',
      error: 'db unavailable',
    });
  });
});
