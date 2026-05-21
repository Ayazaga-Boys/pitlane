import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { requireAuth } from './middleware/auth.js';
import { maintenanceMode } from './middleware/maintenance.js';
import { requestLogger } from './middleware/request-logger.js';
import { rateLimit } from './middleware/rate-limit.js';
import { mountProtectedRoutes, mountProtectedV2Routes, mountPublicRoutes } from './routes/index.js';
import { logger } from './lib/logger.js';
import { checkDatabaseHealth } from './services/health.js';
import { captureException } from './services/sentry.js';
import type { AppEnv } from './types/hono.js';

export function createApp() {
  const app = new Hono();

  app.use('*', secureHeaders());
  app.use('*', cors({ origin: ['http://localhost:3001', 'https://admin.rollpit.com'] }));
  app.use('*', requestLogger);

  app.get('/health', async (c) => {
    const database = await checkDatabaseHealth();
    const ok = database.status !== 'error';
    return c.json({ ok, service: 'rollpit-api', database }, ok ? 200 : 503);
  });

  const v1 = new Hono();
  v1.use('*', maintenanceMode);
  v1.use('*', rateLimit);
  mountPublicRoutes(v1);

  const protectedV1 = new Hono<AppEnv>();
  protectedV1.use('*', requireAuth);
  mountProtectedRoutes(protectedV1);
  v1.route('/', protectedV1);

  app.route('/v1', v1);

  const v2 = new Hono();
  v2.use('*', maintenanceMode);
  v2.use('*', rateLimit);

  const protectedV2 = new Hono<AppEnv>();
  protectedV2.use('*', requireAuth);
  mountProtectedV2Routes(protectedV2);
  v2.route('/', protectedV2);

  app.route('/v2', v2);

  app.onError((error, c) => {
    logger.error({ err: error, path: c.req.path, method: c.req.method }, 'Unhandled request error');
    void captureException({
      error,
      path: c.req.path,
      method: c.req.method,
    });
    return c.json({ code: 'INTERNAL_ERROR', error: 'Internal server error' }, 500);
  });

  return app;
}
