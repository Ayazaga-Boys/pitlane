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
import { v2AdminBusinessRoutes, v2BusinessRoutes } from './v2-business.js';
import { v2CommunityRoutes, v2EventRoutes } from './v2-communities.js';
import { v2DiscoverRoutes } from './v2-discover.js';
import { v2FollowRequestRoutes, v2FollowRoutes } from './v2-follows.js';
import { v2HelpRoutes } from './v2-help.js';
import {
  v2CommunityInviteResponseRoutes,
  v2CommunityInviteRoutes,
  v2InviteRoutes,
  v2PublicInviteRoutes,
} from './v2-invites.js';
import { v2MapRoutes } from './v2-map.js';
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

export function mountPublicV2Routes(app: Hono) {
  app.route('/invites', v2PublicInviteRoutes);
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
  app.route('/admin/business', v2AdminBusinessRoutes);
  app.route('/business', v2BusinessRoutes);
  app.route('/communities', v2CommunityInviteRoutes);
  app.route('/comments', v2CommentRoutes);
  app.route('/communities', v2CommunityRoutes);
  app.route('/community-invites', v2CommunityInviteResponseRoutes);
  app.route('/discover', v2DiscoverRoutes);
  app.route('/events', v2EventRoutes);
  app.route('/follow-requests', v2FollowRequestRoutes);
  app.route('/follows', v2FollowRoutes);
  app.route('/help', v2HelpRoutes);
  app.route('/invites', v2InviteRoutes);
  app.route('/map', v2MapRoutes);
  app.route('/posts', v2PostRoutes);
  app.route('/profiles', v2ProfileRoutes);
  app.route('/stories', v2StoryRoutes);
  app.route('/users', v2UserRoutes);
}
