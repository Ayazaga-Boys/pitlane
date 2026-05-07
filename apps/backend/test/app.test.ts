import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('app routes', () => {
  afterEach(() => {
    delete process.env.MAINTENANCE_MODE;
  });

  it('serves health without auth', async () => {
    const app = createApp();
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: 'pitlane-api',
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
    expect(body.data.app_name).toBe('Pitlane');
    expect(body.data.feature_flags.invite_only).toBe(true);
  });

  it('keeps profile routes protected', async () => {
    const app = createApp();
    const response = await app.request('/v1/profiles/me/vehicles');

    expect(response.status).toBe(401);
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
    const response = await app.request('/v1/pins');

    expect(response.status).toBe(401);
  });

  it('keeps help routes protected', async () => {
    const app = createApp();
    const response = await app.request('/v1/help/my');

    expect(response.status).toBe(401);
  });

  it('returns 503 when maintenance mode is enabled', async () => {
    process.env.MAINTENANCE_MODE = 'true';
    const app = createApp();
    const response = await app.request('/v1/config');

    expect(response.status).toBe(503);
  });
});
