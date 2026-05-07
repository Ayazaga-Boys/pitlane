import { Hono } from 'hono';

export const configRoutes = new Hono();

configRoutes.get('/', (c) => {
  return c.json({
    data: {
      app_name: 'Pitlane',
      min_supported_app_version: '1.0.0',
      feature_flags: {
        invite_only: true,
        snap_camera: false,
        help_requests: false
      },
      limits: {
        max_flares_per_user_day: 5,
        max_help_per_user_hour: 2
      }
    }
  });
});
