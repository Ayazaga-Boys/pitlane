import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  V2AvatarUploadSchema,
  V2PrivacySchema,
  V2UpdateVehicleSchema,
  V2VehicleIdParamSchema,
} from '../schemas/v2-social.schema.js';
import {
  createCloudflareImageDirectUpload,
  isCloudflareImagesConfigured,
} from '../services/cloudflare-media.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2ProfileRoutes = new Hono<AppEnv>();

const V2_PROFILE_PRIVATE_SELECT =
  'id,username,display_name,avatar_url,bio,bio_extended,is_private,location_share_mode,ghost_mode,presence_visible,is_verified,role,created_at,updated_at';
const V2_VEHICLE_SELECT = 'id,user_id,type,make,model,year,color,photo_url,is_primary,icon_slug,created_at';

v2ProfileRoutes.post('/me/avatar', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = V2AvatarUploadSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  if (!isCloudflareImagesConfigured()) {
    return c.json({ code: 'SERVICE_UNAVAILABLE', error: 'Cloudflare Images is not configured' }, 503);
  }

  const userId = c.get('userId') as string;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  try {
    const upload = await createCloudflareImageDirectUpload({
      userId,
      purpose: 'profile_avatar',
      expiresAt,
      ...(parsed.data.filename ? { filename: parsed.data.filename } : {}),
    });

    return c.json({
      data: {
        image_id: upload.id,
        upload_url: upload.uploadURL,
        expires_at: expiresAt.toISOString(),
      },
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cloudflare Images direct upload failed';
    return c.json({ code: 'DOWNSTREAM_ERROR', error: message }, 502);
  }
});

v2ProfileRoutes.patch('/me/privacy', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = V2PrivacySchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', userId)
    .select(V2_PROFILE_PRIVATE_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Profile not found' }, 404);

  return c.json({ data });
});

v2ProfileRoutes.patch('/me/vehicles/:id', async (c) => {
  const params = V2VehicleIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2UpdateVehicleSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const makePrimary = parsed.data.is_primary === true || parsed.data.is_active === true;
  if (makePrimary) {
    await supabase.from('vehicles').update({ is_primary: false }).eq('user_id', userId);
  }

  const update = {
    ...(parsed.data.icon_slug !== undefined ? { icon_slug: parsed.data.icon_slug } : {}),
    ...(makePrimary ? { is_primary: true } : {}),
  };

  const { data, error } = await supabase
    .from('vehicles')
    .update(update)
    .eq('id', params.data.id)
    .eq('user_id', userId)
    .select(V2_VEHICLE_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Vehicle not found' }, 404);
  return c.json({ data });
});
