import { gridDisk, isValidCell } from 'h3-js';
import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  V2AdminBusinessApplicationsQuerySchema,
  V2BusinessApplicationDocumentSchema,
  V2BusinessApplicationIdParamSchema,
  V2BusinessDocumentIdParamSchema,
  V2BusinessLocationsNearbyQuerySchema,
  V2CreateBusinessApplicationSchema,
  V2RejectBusinessApplicationSchema,
} from '../schemas/v2-business.schema.js';
import {
  createBusinessApplicationDocumentStorageKey,
  generateR2ReadUrl,
  generateR2UploadUrl,
  isR2Configured,
} from '../services/r2.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const v2BusinessRoutes = new Hono<AppEnv>();
export const v2AdminBusinessRoutes = new Hono<AppEnv>();

const APPLICATION_SELECT =
  'id,applicant_id,business_name,category,description,h3_cell,latitude,longitude,address,phone,website,photo_url,working_hours,status,rejection_reason,reviewer_id,reviewed_at,location_id,created_at,updated_at';
const DOCUMENT_SELECT =
  'id,application_id,uploader_id,document_type,storage_key,content_type,size_bytes,status,created_at';
const LOCATION_SELECT =
  'id,owner_id,source_application_id,business_name,category,description,h3_cell,latitude,longitude,address,phone,website,photo_url,working_hours,is_active,featured_rank,created_at,updated_at';

v2BusinessRoutes.post('/applications', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = V2CreateBusinessApplicationSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);
  if (!isValidCell(parsed.data.h3_cell)) return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('business_applications')
    .insert({
      ...parsed.data,
      applicant_id: userId,
      status: 'pending',
    })
    .select(APPLICATION_SELECT)
    .single();

  if (error?.code === '23505') return c.json({ code: 'CONFLICT', error: 'You already have an active business application' }, 409);
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

v2BusinessRoutes.get('/applications/me', async (c) => {
  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('business_applications')
    .select(`${APPLICATION_SELECT},business_documents(${DOCUMENT_SELECT})`)
    .eq('applicant_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2BusinessRoutes.post('/applications/:id/documents', async (c) => {
  const params = V2BusinessApplicationIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2BusinessApplicationDocumentSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  if (!isR2Configured()) {
    return c.json({ code: 'SERVICE_UNAVAILABLE', error: 'Cloudflare R2 is not configured' }, 503);
  }

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: application, error: applicationError } = await supabase
    .from('business_applications')
    .select('id,status')
    .eq('id', params.data.id)
    .eq('applicant_id', userId)
    .in('status', ['pending', 'under_review'])
    .maybeSingle();

  if (applicationError) return c.json({ code: 'INTERNAL_ERROR', error: applicationError.message }, 500);
  if (!application) return c.json({ code: 'NOT_FOUND', error: 'Editable business application not found' }, 404);

  const storageKey = createBusinessApplicationDocumentStorageKey({
    userId,
    applicationId: params.data.id,
    documentType: parsed.data.document_type,
    contentType: parsed.data.content_type,
  });

  const { data, error } = await supabase
    .from('business_documents')
    .insert({
      application_id: params.data.id,
      uploader_id: userId,
      document_type: parsed.data.document_type,
      storage_key: storageKey,
      content_type: parsed.data.content_type,
      size_bytes: parsed.data.size_bytes,
      status: 'pending_upload',
    })
    .select(DOCUMENT_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({
    data: {
      document: data,
      upload_url: generateR2UploadUrl({ storageKey }),
      storage_key: storageKey,
      expires_in_seconds: 300,
    },
  }, 201);
});

v2BusinessRoutes.get('/locations/nearby', async (c) => {
  const parsed = V2BusinessLocationsNearbyQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);
  if (!isValidCell(parsed.data.h3cell)) return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const cells = gridDisk(parsed.data.h3cell, parsed.data.k);
  let query = supabase
    .from('business_locations')
    .select(LOCATION_SELECT)
    .eq('is_active', true)
    .in('h3_cell', cells)
    .order('featured_rank', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(100);

  if (parsed.data.category) query = query.eq('category', parsed.data.category);

  const { data, error } = await query;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

v2AdminBusinessRoutes.get('/applications', async (c) => {
  const parsed = V2AdminBusinessApplicationsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const admin = await requireAdmin(supabase, userId);
  if (admin.error) return c.json({ code: 'INTERNAL_ERROR', error: admin.error.message }, 500);
  if (!admin.allowed) return c.json({ code: 'FORBIDDEN', error: 'Admin role required' }, 403);

  let query = supabase
    .from('business_applications')
    .select(`${APPLICATION_SELECT},business_documents(${DOCUMENT_SELECT}),profiles!business_applications_applicant_id_fkey(username,display_name,avatar_url)`)
    .eq('status', parsed.data.status)
    .order('created_at', { ascending: false })
    .limit(parsed.data.limit);

  if (parsed.data.cursor) query = query.lt('created_at', parsed.data.cursor);

  const { data, error } = await query;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data, next_cursor: data.at(-1)?.created_at ?? null });
});

v2AdminBusinessRoutes.get('/documents/:id/preview-url', async (c) => {
  const params = V2BusinessDocumentIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  if (!isR2Configured()) {
    return c.json({ code: 'SERVICE_UNAVAILABLE', error: 'Cloudflare R2 is not configured' }, 503);
  }

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const admin = await requireAdmin(supabase, userId);
  if (admin.error) return c.json({ code: 'INTERNAL_ERROR', error: admin.error.message }, 500);
  if (!admin.allowed) return c.json({ code: 'FORBIDDEN', error: 'Admin role required' }, 403);

  const { data, error } = await supabase
    .from('business_documents')
    .select(`${DOCUMENT_SELECT},business_applications(${APPLICATION_SELECT})`)
    .eq('id', params.data.id)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Business document not found' }, 404);

  return c.json({
    data: {
      document: data,
      preview_url: generateR2ReadUrl(data.storage_key, 300),
      expires_in_seconds: 300,
    },
  });
});

v2AdminBusinessRoutes.post('/applications/:id/approve', async (c) => {
  const params = V2BusinessApplicationIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const reviewerId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const admin = await requireAdmin(supabase, reviewerId);
  if (admin.error) return c.json({ code: 'INTERNAL_ERROR', error: admin.error.message }, 500);
  if (!admin.allowed) return c.json({ code: 'FORBIDDEN', error: 'Admin role required' }, 403);

  const { data: application, error: applicationError } = await supabase
    .from('business_applications')
    .select(APPLICATION_SELECT)
    .eq('id', params.data.id)
    .in('status', ['pending', 'under_review'])
    .maybeSingle();

  if (applicationError) return c.json({ code: 'INTERNAL_ERROR', error: applicationError.message }, 500);
  if (!application) return c.json({ code: 'NOT_FOUND', error: 'Pending business application not found' }, 404);

  const { data: location, error: locationError } = await supabase
    .from('business_locations')
    .insert({
      owner_id: application.applicant_id,
      source_application_id: application.id,
      business_name: application.business_name,
      category: application.category,
      description: application.description,
      h3_cell: application.h3_cell,
      latitude: application.latitude,
      longitude: application.longitude,
      address: application.address,
      phone: application.phone,
      website: application.website,
      photo_url: application.photo_url,
      working_hours: application.working_hours,
      is_active: true,
    })
    .select(LOCATION_SELECT)
    .single();

  if (locationError?.code === '23505') return c.json({ code: 'CONFLICT', error: 'Business location already exists for this application' }, 409);
  if (locationError) return c.json({ code: 'INTERNAL_ERROR', error: locationError.message }, 500);

  const reviewedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('business_applications')
    .update({
      status: 'approved',
      rejection_reason: null,
      reviewer_id: reviewerId,
      reviewed_at: reviewedAt,
      location_id: location.id,
    })
    .eq('id', application.id)
    .select(APPLICATION_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data: { application: data, location } });
});

v2AdminBusinessRoutes.post('/applications/:id/reject', async (c) => {
  const params = V2BusinessApplicationIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);
  const body = await c.req.json().catch(() => null);
  const parsed = V2RejectBusinessApplicationSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const reviewerId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const admin = await requireAdmin(supabase, reviewerId);
  if (admin.error) return c.json({ code: 'INTERNAL_ERROR', error: admin.error.message }, 500);
  if (!admin.allowed) return c.json({ code: 'FORBIDDEN', error: 'Admin role required' }, 403);

  const { data, error } = await supabase
    .from('business_applications')
    .update({
      status: 'rejected',
      rejection_reason: parsed.data.reason,
      reviewer_id: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.data.id)
    .in('status', ['pending', 'under_review'])
    .select(APPLICATION_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Pending business application not found' }, 404);
  return c.json({ data });
});

async function requireAdmin(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,role')
    .eq('id', userId)
    .maybeSingle();

  if (error) return { allowed: false, error };
  return { allowed: data?.role === 'admin' };
}
