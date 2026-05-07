import type { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { configRoutes } from './config.js';
import { mapRoutes } from './map.js';
import { profileRoutes } from './profiles.js';
import type { AppEnv } from '../types/hono.js';

export function mountPublicRoutes(app: Hono) {
  app.route('/auth', authRoutes);
  app.route('/config', configRoutes);
}

export function mountProtectedRoutes(app: Hono<AppEnv>) {
  app.route('/map', mapRoutes);
  app.route('/profiles', profileRoutes);
}
