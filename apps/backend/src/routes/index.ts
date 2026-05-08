import type { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { configRoutes } from './config.js';
import { flareRoutes } from './flares.js';
import { helpRequestRoutes } from './help-requests.js';
import { mapRoutes } from './map.js';
import { pinRoutes } from './pins.js';
import { profileRoutes } from './profiles.js';
import type { AppEnv } from '../types/hono.js';

export function mountPublicRoutes(app: Hono) {
  app.route('/auth', authRoutes);
  app.route('/config', configRoutes);
}

export function mountProtectedRoutes(app: Hono<AppEnv>) {
  app.route('/flares', flareRoutes);
  app.route('/help-requests', helpRequestRoutes);
  app.route('/map', mapRoutes);
  app.route('/pins', pinRoutes);
  app.route('/profiles', profileRoutes);
}
