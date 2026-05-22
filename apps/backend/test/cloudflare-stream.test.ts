import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  getCloudflareStreamAssetReference,
  getCloudflareStreamAssetStatus,
  parseCloudflareStreamWebhook,
  verifyCloudflareStreamSignature,
} from '../src/services/cloudflare-stream.js';

describe('cloudflare stream webhooks', () => {
  const secret = 'stream-webhook-secret';
  const now = new Date('2026-05-17T12:00:00.000Z');
  const time = Math.floor(now.getTime() / 1000).toString();
  const body = JSON.stringify({
    uid: 'stream_123',
    readyToStream: true,
    status: { state: 'ready', pctComplete: '100' },
    meta: { asset_id: '00000000-0000-4000-8000-000000000001' },
  });

  it('verifies Cloudflare signatures over the raw body', () => {
    const sig1 = createHmac('sha256', secret).update(`${time}.${body}`).digest('hex');

    expect(verifyCloudflareStreamSignature({
      body,
      header: `time=${time},sig1=${sig1}`,
      secret,
      now,
    })).toBe(true);
  });

  it('rejects stale or mismatched signatures', () => {
    const sig1 = createHmac('sha256', secret).update(`${time}.${body}`).digest('hex');

    expect(verifyCloudflareStreamSignature({
      body: `${body}\n`,
      header: `time=${time},sig1=${sig1}`,
      secret,
      now,
    })).toBe(false);
    expect(verifyCloudflareStreamSignature({
      body,
      header: `time=${time},sig1=${sig1}`,
      secret,
      now: new Date('2026-05-17T12:10:01.000Z'),
    })).toBe(false);
  });

  it('extracts asset reference and status from valid payloads', () => {
    const event = parseCloudflareStreamWebhook(body);

    expect(event).not.toBeNull();
    expect(getCloudflareStreamAssetReference(event!)).toEqual({
      type: 'id',
      value: '00000000-0000-4000-8000-000000000001',
    });
    expect(getCloudflareStreamAssetStatus(event!)).toBe('ready');
  });
});
