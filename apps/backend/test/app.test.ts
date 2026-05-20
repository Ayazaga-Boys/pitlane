import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('app routes', () => {
  afterEach(() => {
    delete process.env.MAINTENANCE_MODE;
  });

  it('serves health without auth', async () => {
    const previousUrl = process.env.SUPABASE_URL;
    const previousServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const app = createApp();
    const response = await app.request('/health');

    process.env.SUPABASE_URL = previousUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceRoleKey;

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: 'rollpit-api',
      database: { status: 'not_configured' },
    });
  });

  it('serves default config without Supabase env', async () => {
    const previousUrl = process.env.SUPABASE_URL;
    const previousServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const app = createApp();
    const response = await app.request('/v1/config');
    const body = await response.json();

    process.env.SUPABASE_URL = previousUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceRoleKey;

    expect(response.status).toBe(200);
    expect(body.data.app_name).toBe('Rollpit');
    expect(body.data.feature_flags.invite_only).toBe(true);
    expect(body.data.media.image_variants).toContainEqual(expect.objectContaining({
      name: 'feed',
      width: 640,
      height: 480,
    }));
  });

  it('keeps profile routes protected', async () => {
    const app = createApp();
    const [profileResponse, vehiclesResponse, exportResponse, deleteResponse, cancelDeletionResponse] = await Promise.all([
      app.request('/v1/profiles/me'),
      app.request('/v1/profiles/me/vehicles'),
      app.request('/v1/profiles/me/export'),
      app.request('/v1/profiles/me', { method: 'DELETE' }),
      app.request('/v1/profiles/me/deletion/cancel', { method: 'POST' }),
    ]);

    expect(profileResponse.status).toBe(401);
    expect(vehiclesResponse.status).toBe(401);
    expect(exportResponse.status).toBe(401);
    expect(deleteResponse.status).toBe(401);
    expect(cancelDeletionResponse.status).toBe(401);
  });

  it('keeps map routes protected', async () => {
    const app = createApp();
    const response = await app.request('/v1/map/flares?h3cell=8928308280fffff');

    expect(response.status).toBe(401);
  });

  it('keeps flare routes protected', async () => {
    const app = createApp();
    const response = await app.request('/v1/flares');

    expect(response.status).toBe(401);
  });

  it('keeps pin routes protected', async () => {
    const app = createApp();
    const [response, taxUploadResponse, taxFinalizeResponse] = await Promise.all([
      app.request('/v1/pins'),
      app.request('/v1/pins/00000000-0000-4000-8000-000000000001/tax-document/upload-url', { method: 'POST' }),
      app.request('/v1/pins/00000000-0000-4000-8000-000000000001/tax-document/finalize', { method: 'POST' }),
    ]);

    expect(response.status).toBe(401);
    expect(taxUploadResponse.status).toBe(401);
    expect(taxFinalizeResponse.status).toBe(401);
  });

  it('keeps help routes protected', async () => {
    const app = createApp();
    const response = await app.request('/v1/help/my');

    expect(response.status).toBe(401);
  });

  it('keeps community routes protected', async () => {
    const app = createApp();
    const response = await app.request('/v1/communities');

    expect(response.status).toBe(401);
  });

  it('keeps moderation routes protected', async () => {
    const app = createApp();
    const [reportsResponse, blocksResponse] = await Promise.all([
      app.request('/v1/reports/my'),
      app.request('/v1/blocks'),
    ]);

    expect(reportsResponse.status).toBe(401);
    expect(blocksResponse.status).toBe(401);
  });

  it('keeps notification routes protected', async () => {
    const app = createApp();
    const [notificationsResponse, devicesResponse] = await Promise.all([
      app.request('/v1/notifications'),
      app.request('/v1/notifications/devices', { method: 'POST' }),
    ]);

    expect(notificationsResponse.status).toBe(401);
    expect(devicesResponse.status).toBe(401);
  });

  it('keeps media routes protected', async () => {
    const app = createApp();
    const [uploadResponse, finalizeResponse, deleteResponse] = await Promise.all([
      app.request('/v1/media/upload-url', { method: 'POST' }),
      app.request('/v1/media/finalize', { method: 'POST' }),
      app.request('/v1/media/00000000-0000-4000-8000-000000000001', { method: 'DELETE' }),
    ]);

    expect(uploadResponse.status).toBe(401);
    expect(finalizeResponse.status).toBe(401);
    expect(deleteResponse.status).toBe(401);
  });

  it('exposes Cloudflare Stream webhook without user auth', async () => {
    const previousSecret = process.env.CF_STREAM_WEBHOOK_SECRET;
    delete process.env.CF_STREAM_WEBHOOK_SECRET;

    const app = createApp();
    const response = await app.request('/v1/media/webhook/stream', { method: 'POST', body: '{}' });

    if (previousSecret === undefined) {
      delete process.env.CF_STREAM_WEBHOOK_SECRET;
    } else {
      process.env.CF_STREAM_WEBHOOK_SECRET = previousSecret;
    }

    expect(response.status).toBe(503);
  });

  it('keeps internal job routes protected', async () => {
    const previousSecret = process.env.INTERNAL_JOB_SECRET;
    const previousTriggerSecret = process.env.TRIGGER_SECRET_KEY;
    process.env.INTERNAL_JOB_SECRET = 'job-secret';
    delete process.env.TRIGGER_SECRET_KEY;

    const app = createApp();
    const [retentionResponse, profileDeletionResponse] = await Promise.all([
      app.request('/v1/internal/jobs/retention/run', { method: 'POST' }),
      app.request('/v1/internal/jobs/profile-deletion/run', { method: 'POST' }),
    ]);

    restoreEnv('INTERNAL_JOB_SECRET', previousSecret);
    restoreEnv('TRIGGER_SECRET_KEY', previousTriggerSecret);

    expect(retentionResponse.status).toBe(401);
    expect(profileDeletionResponse.status).toBe(401);
  });

  it('keeps message routes protected', async () => {
    const app = createApp();
    const response = await app.request('/v1/messages/dms');

    expect(response.status).toBe(401);
  });

  it('returns 503 when maintenance mode is enabled', async () => {
    process.env.MAINTENANCE_MODE = 'true';
    const app = createApp();
    const response = await app.request('/v1/config');

    expect(response.status).toBe(503);
  });
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
