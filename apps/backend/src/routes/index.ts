import type { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { blockRoutes } from './blocks.js';
import { communityRoutes } from './communities.js';
import { configRoutes } from './config.js';
import { flareRoutes } from './flares.js';
import { helpRoutes } from './help.js';
import { helpRequestRoutes } from './help-requests.js';
import { internalJobRoutes } from './internal-jobs.js';
import { mapRoutes } from './map.js';
import { mediaRoutes, mediaWebhookRoutes } from './media.js';
import { messageRoutes } from './messages.js';
import { notificationRoutes } from './notifications.js';
import { pinRoutes } from './pins.js';
import { profileRoutes } from './profiles.js';
import { reportRoutes } from './reports.js';
import { v2FollowRequestRoutes, v2FollowRoutes } from './v2-follows.js';
import { v2CommentRoutes, v2PostRoutes, v2UserRoutes } from './v2-posts.js';
import { v2ProfileRoutes } from './v2-profiles.js';
import { v2StoryRoutes } from './v2-stories.js';
import type { AppEnv } from '../types/hono.js';

export function mountPublicRoutes(app: Hono) {
  app.route('/auth', authRoutes);
  app.route('/config', configRoutes);
  app.route('/internal/jobs', internalJobRoutes);
  app.route('/media', mediaWebhookRoutes);
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

export function mountProtectedV2Routes(app: Hono<AppEnv>) {
  app.route('/comments', v2CommentRoutes);
  app.route('/follow-requests', v2FollowRequestRoutes);
  app.route('/follows', v2FollowRoutes);
  app.route('/posts', v2PostRoutes);
  app.route('/profiles', v2ProfileRoutes);
  app.route('/stories', v2StoryRoutes);
  app.route('/users', v2UserRoutes);
}
