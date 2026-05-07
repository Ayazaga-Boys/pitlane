import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('app routes', () => {
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
    const app = createApp();
    const response = await app.request('/v1/config');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.app_name).toBe('Pitlane');
    expect(body.data.feature_flags.invite_only).toBe(true);
  });

  it('keeps profile routes protected', async () => {
    const app = createApp();
    const response = await app.request('/v1/profiles/me/vehicles');

    expect(response.status).toBe(401);
  });
});
