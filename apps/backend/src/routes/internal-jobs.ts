import { Hono, type Context } from 'hono';
import { refreshDiscoverFeedScores } from '../jobs/discover.js';
import { runProfileDeletionCleanup } from '../jobs/profile-deletion.js';
import { runRetentionCleanup } from '../jobs/retention.js';

export const internalJobRoutes = new Hono();

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
