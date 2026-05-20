import { gridDisk, isValidCell } from 'h3-js';
import { Hono } from 'hono';
import { serviceUnavailable, validationError } from '../lib/http.js';
import {
  CreatePinSchema,
  ListPinsQuerySchema,
  PinIdParamSchema,
  StartCampaignSchema,
  TaxDocumentFinalizeSchema,
  TaxDocumentUploadUrlSchema,
  UpdatePinSchema,
} from '../schemas/pin.schema.js';
import {
  createBusinessTaxDocumentStorageKey,
  generateR2UploadUrl,
  headR2Object,
  isR2Configured,
} from '../services/r2.js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import type { AppEnv } from '../types/hono.js';

export const pinRoutes = new Hono<AppEnv>();

const PIN_SELECT =
  'id,owner_id,name,category,h3_cell,address,phone,website,logo_url,cover_url,is_verified,is_active,campaign_text,campaign_ends_at,created_at,updated_at';

const PIN_VERIFICATION_SELECT =
  'id,is_verified,verification_status,verification_submitted_at,verified_at,tax_document_key,tax_document_content_type';

function cellsForQuery(h3cell: string | undefined, k: number): string[] | null {
  if (!h3cell) return [];
  if (!isValidCell(h3cell)) return null;
  return gridDisk(h3cell, k);
}

pinRoutes.get('/', async (c) => {
  const parsed = ListPinsQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  const cells = cellsForQuery(parsed.data.h3cell, parsed.data.k);
  if (!cells) return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  let query = supabase
    .from('business_pins')
    .select(PIN_SELECT)
    .eq('is_active', true)
    .order('is_verified', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (cells.length > 0) query = query.in('h3_cell', cells);
  if (parsed.data.category) query = query.eq('category', parsed.data.category);

  const { data, error } = await query;
  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data });
});

pinRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreatePinSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  if (!isValidCell(parsed.data.h3_cell)) {
    return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);
  }

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('business_pins')
    .insert({ ...parsed.data, owner_id: userId, is_verified: false, is_active: true })
    .select(PIN_SELECT)
    .single();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  return c.json({ data }, 201);
});

pinRoutes.get('/:id', async (c) => {
  const params = PinIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('business_pins')
    .select(PIN_SELECT)
    .eq('id', params.data.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Business pin not found' }, 404);
  return c.json({ data });
});

pinRoutes.patch('/:id', async (c) => {
  const params = PinIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const body = await c.req.json().catch(() => null);
  const parsed = UpdatePinSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  if (parsed.data.h3_cell && !isValidCell(parsed.data.h3_cell)) {
    return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid H3 cell' }, 422);
  }

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('business_pins')
    .update(parsed.data)
    .eq('id', params.data.id)
    .eq('owner_id', userId)
    .select(PIN_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Business pin not found' }, 404);
  return c.json({ data });
});

pinRoutes.post('/:id/campaign', async (c) => {
  const params = PinIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const body = await c.req.json().catch(() => null);
  const parsed = StartCampaignSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('business_pins')
    .update(parsed.data)
    .eq('id', params.data.id)
    .eq('owner_id', userId)
    .eq('is_verified', true)
    .eq('is_active', true)
    .select(PIN_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Verified business pin not found' }, 404);
  return c.json({ data });
});

pinRoutes.delete('/:id/campaign', async (c) => {
  const params = PinIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data, error } = await supabase
    .from('business_pins')
    .update({ campaign_text: null, campaign_ends_at: null })
    .eq('id', params.data.id)
    .eq('owner_id', userId)
    .select(PIN_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Business pin not found' }, 404);
  return c.json({ data });
});

pinRoutes.post('/:id/tax-document/upload-url', async (c) => {
  const params = PinIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const body = await c.req.json().catch(() => null);
  const parsed = TaxDocumentUploadUrlSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  if (!isR2Configured()) {
    return c.json({ code: 'SERVICE_UNAVAILABLE', error: 'Cloudflare R2 is not configured' }, 503);
  }

  const userId = c.get('userId') as string;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  const { data: pin, error } = await supabase
    .from('business_pins')
    .select('id')
    .eq('id', params.data.id)
    .eq('owner_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!pin) return c.json({ code: 'NOT_FOUND', error: 'Business pin not found' }, 404);

  const storageKey = createBusinessTaxDocumentStorageKey({
    userId,
    pinId: params.data.id,
    contentType: parsed.data.content_type,
  });

  return c.json({
    data: {
      upload_url: generateR2UploadUrl({ storageKey }),
      storage_key: storageKey,
      expires_in_seconds: 300,
    },
  }, 201);
});

pinRoutes.post('/:id/tax-document/finalize', async (c) => {
  const params = PinIdParamSchema.safeParse(c.req.param());
  if (!params.success) return validationError(c, params.error);

  const body = await c.req.json().catch(() => null);
  const parsed = TaxDocumentFinalizeSchema.safeParse(body);
  if (!parsed.success) return validationError(c, parsed.error);

  if (!isR2Configured()) {
    return c.json({ code: 'SERVICE_UNAVAILABLE', error: 'Cloudflare R2 is not configured' }, 503);
  }

  const userId = c.get('userId') as string;
  const expectedPrefix = `business-tax-documents/${params.data.id}/${userId}/`;
  if (!parsed.data.storage_key.startsWith(expectedPrefix)) {
    return c.json({ code: 'VALIDATION_ERROR', error: 'Invalid tax document storage key' }, 422);
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) return serviceUnavailable(c);

  let objectMetadata;
  try {
    objectMetadata = await headR2Object(parsed.data.storage_key);
  } catch (headError) {
    const message = headError instanceof Error ? headError.message : 'R2 head failed';
    return c.json({ code: 'DOWNSTREAM_ERROR', error: message }, 502);
  }

  if (!objectMetadata) {
    return c.json({ code: 'UPLOAD_NOT_FOUND', error: 'Uploaded tax document was not found in R2' }, 409);
  }

  const { data, error } = await supabase
    .from('business_pins')
    .update({
      tax_document_key: parsed.data.storage_key,
      tax_document_content_type: parsed.data.content_type,
      verification_status: 'pending',
      verification_submitted_at: new Date().toISOString(),
      verified_at: null,
      is_verified: false,
    })
    .eq('id', params.data.id)
    .eq('owner_id', userId)
    .eq('is_active', true)
    .select(PIN_VERIFICATION_SELECT)
    .maybeSingle();

  if (error) return c.json({ code: 'INTERNAL_ERROR', error: error.message }, 500);
  if (!data) return c.json({ code: 'NOT_FOUND', error: 'Business pin not found' }, 404);
  return c.json({ data });
});
