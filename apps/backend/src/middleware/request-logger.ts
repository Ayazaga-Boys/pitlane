import type { Context, Next } from 'hono';
import { logger } from '../lib/logger.js';

export async function requestLogger(c: Context, next: Next): Promise<void> {
  const startedAt = Date.now();
  await next();

  logger.info(
    {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration_ms: Date.now() - startedAt,
    },
    'request completed',
  );
}
