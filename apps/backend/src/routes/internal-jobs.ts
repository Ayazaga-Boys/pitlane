import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { refreshDiscoverFeedScores } from '../jobs/discover.js';
import { runHelpRequestExpiration } from '../jobs/help-expiration.js';
import { runPresenceOfflineCleanup } from '../jobs/presence.js';
import { runProfileDeletionCleanup } from '../jobs/profile-deletion.js';
import { runRetentionCleanup } from '../jobs/retention.js';
import { runUserExportJob } from '../jobs/user-export.js';
import { serviceUnavailable, validationError } from '../lib/http.js';

export const internalJobRoutes = new Hono();

const UserExportJobRequestSchema = z.object({
  user_id: z.string().uuid(),
});

internalJobRoutes.post('/retention/run', async (c) => {
  const authError = validateInternalJobAuth(c);
  if (authError) return authError;

  try {
    const data = await runRetentionCleanup();
    return c.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Retention cleanup failed';
    return c.json({ code: 'INTERNAL_ERROR', error: message }, 500);
  }
});

internalJobRoutes.post('/profile-deletion/run', async (c) => {
  const authError = validateInternalJobAuth(c);
  if (authError) return authError;

  try {
    const data = await runProfileDeletionCleanup();
    return c.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Profile deletion cleanup failed';
    return c.json({ code: 'INTERNAL_ERROR', error: message }, 500);
  }
});

internalJobRoutes.post('/discover-refresh/run', async (c) => {
  const authError = validateInternalJobAuth(c);
  if (authError) return authError;

  try {
    const data = await refreshDiscoverFeedScores();
    return c.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Discover feed refresh failed';
    return c.json({ code: 'INTERNAL_ERROR', error: message }, 500);
  }
});

internalJobRoutes.post('/help-expiration/run', async (c) => {
  const authError = validateInternalJobAuth(c);
  if (authError) return authError;

  try {
    const data = await runHelpRequestExpiration();
    return c.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Help request expiration failed';
    if (message === 'Supabase service client is not configured') return serviceUnavailable(c);
    return c.json({ code: 'INTERNAL_ERROR', error: message }, 500);
  }
});

internalJobRoutes.post('/presence-offline/run', async (c) => {
  const authError = validateInternalJobAuth(c);
  if (authError) return authError;

  try {
    const data = await runPresenceOfflineCleanup();
    return c.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Presence offline cleanup failed';
    if (message === 'Supabase service client is not configured') return serviceUnavailable(c);
    return c.json({ code: 'INTERNAL_ERROR', error: message }, 500);
  }
});

internalJobRoutes.post('/user-export/run', async (c) => {
  const authError = validateInternalJobAuth(c);
  if (authError) return authError;

  const body = await c.req.json().catch(() => null);
  const parsed = UserExportJobRequestSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  try {
    const data = await runUserExportJob({ userId: parsed.data.user_id });
    return c.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'User export failed';
    if (message === 'Cloudflare R2 is not configured' || message === 'Supabase service client is not configured') {
      return serviceUnavailable(c);
    }
    if (message.startsWith('R2 put failed')) {
      return c.json({ code: 'DOWNSTREAM_ERROR', error: message }, 502);
    }
    return c.json({ code: 'INTERNAL_ERROR', error: message }, 500);
  }
});

function validateInternalJobAuth(c: Context) {
  const secret = process.env.INTERNAL_JOB_SECRET ?? process.env.TRIGGER_SECRET_KEY;
  if (!secret) {
    return c.json({ code: 'SERVICE_UNAVAILABLE', error: 'Internal job secret is not configured' }, 503);
  }

  const authorization = c.req.header('Authorization');
  if (authorization !== `Bearer ${secret}`) {
    return c.json({ code: 'UNAUTHORIZED', error: 'Invalid internal job token' }, 401);
  }

  return null;
}
