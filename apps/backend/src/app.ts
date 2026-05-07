import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { requireAuth } from './middleware/auth.js';
import { mountRoutes } from './routes/index.js';

export function createApp() {
  const app = new Hono();

  app.use('*', secureHeaders());
  app.use('*', cors({ origin: ['http://localhost:3001', 'https://admin.pitlane.app'] }));

  app.get('/health', (c) => c.json({ ok: true, service: 'pitlane-api' }));

  const v1 = new Hono();
  v1.use('*', requireAuth);
  mountRoutes(v1);
  app.route('/v1', v1);

  app.onError((error, c) => {
    console.error(error);
    return c.json({ code: 'INTERNAL_ERROR', error: 'Internal server error' }, 500);
  });

  return app;
}
