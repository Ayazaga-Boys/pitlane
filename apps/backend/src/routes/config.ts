import { Hono } from 'hono';
import { getMediaDeliveryConfig } from '../services/media-delivery.js';
import { getServiceSupabaseClient } from '../services/supabase.js';

export const configRoutes = new Hono();

const defaultConfig = {
  app_name: 'Rollpit',
  min_supported_app_version: '1.0.0',
  feature_flags: {
    invite_only: true,
    snap_camera: false,
    help_requests: false
  },
  limits: {
    max_flares_per_user_day: 5,
    max_help_per_user_hour: 2
  },
  media: getMediaDeliveryConfig(),
};

configRoutes.get('/', async (c) => {
  const supabase = getServiceSupabaseClient();
  if (!supabase) {
    return c.json({ data: defaultConfig });
  }

  const { data, error } = await supabase
    .from('remote_configs')
    .select('key,value');

  if (error) {
    return c.json({ data: defaultConfig });
  }

  const values = new Map(data.map((row) => [row.key, row.value]));
  return c.json({
    data: {
      app_name: defaultConfig.app_name,
      min_supported_app_version: String(
        values.get('min_supported_app_version') ?? defaultConfig.min_supported_app_version,
      ),
      feature_flags: {
        invite_only: Boolean(values.get('feature_invite_only') ?? defaultConfig.feature_flags.invite_only),
        snap_camera: Boolean(values.get('feature_camera_enabled') ?? defaultConfig.feature_flags.snap_camera),
        help_requests: Boolean(values.get('feature_help_enabled') ?? defaultConfig.feature_flags.help_requests)
      },
      limits: {
        max_flares_per_user_day: Number(
          values.get('max_flares_per_user_day') ?? defaultConfig.limits.max_flares_per_user_day,
        ),
        max_help_per_user_hour: Number(
          values.get('max_help_per_user_hour') ?? defaultConfig.limits.max_help_per_user_hour,
        ),
      },
      media: getMediaDeliveryConfig(),
    },
  });
});
