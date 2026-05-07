import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { requireAuth } from './middleware/auth.js';
import { mountProtectedRoutes, mountPublicRoutes } from './routes/index.js';
import type { AppEnv } from './types/hono.js';

export function createApp() {
  const app = new Hono();

  app.use('*', secureHeaders());
  app.use('*', cors({ origin: ['http://localhost:3001', 'https://admin.pitlane.app'] }));

  app.get('/health', (c) => c.json({ ok: true, service: 'pitlane-api' }));

  const v1 = new Hono();
  mountPublicRoutes(v1);

  const protectedV1 = new Hono<AppEnv>();
  protectedV1.use('*', requireAuth);
  mountProtectedRoutes(protectedV1);
  v1.route('/', protectedV1);

  app.route('/v1', v1);

  app.onError((error, c) => {
    console.error(error);
    return c.json({ code: 'INTERNAL_ERROR', error: 'Internal server error' }, 500);
  });

  return app;
}
