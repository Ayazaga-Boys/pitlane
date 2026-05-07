import type { Hono } from 'hono';
import { configRoutes } from './config.js';

export function mountRoutes(app: Hono) {
  app.route('/config', configRoutes);
}
