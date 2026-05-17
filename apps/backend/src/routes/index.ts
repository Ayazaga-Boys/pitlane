import type { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { blockRoutes } from './blocks.js';
import { communityRoutes } from './communities.js';
import { configRoutes } from './config.js';
import { flareRoutes } from './flares.js';
import { helpRoutes } from './help.js';
import { helpRequestRoutes } from './help-requests.js';
import { mapRoutes } from './map.js';
import { mediaRoutes } from './media.js';
import { messageRoutes } from './messages.js';
import { notificationRoutes } from './notifications.js';
import { pinRoutes } from './pins.js';
import { profileRoutes } from './profiles.js';
import { reportRoutes } from './reports.js';
import type { AppEnv } from '../types/hono.js';

export function mountPublicRoutes(app: Hono) {
  app.route('/auth', authRoutes);
  app.route('/config', configRoutes);
}

export function mountProtectedRoutes(app: Hono<AppEnv>) {
  app.route('/blocks', blockRoutes);
  app.route('/communities', communityRoutes);
  app.route('/flares', flareRoutes);
  app.route('/help', helpRoutes);
  app.route('/help-requests', helpRequestRoutes);
  app.route('/map', mapRoutes);
  app.route('/media', mediaRoutes);
  app.route('/messages', messageRoutes);
  app.route('/notifications', notificationRoutes);
  app.route('/pins', pinRoutes);
  app.route('/profiles', profileRoutes);
  app.route('/reports', reportRoutes);
}
