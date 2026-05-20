import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  copyCloudflareStreamFromUrl,
  deleteCloudflareImage,
  uploadCloudflareImageFromUrl,
} from '../src/services/cloudflare-media.js';

describe('cloudflare media api', () => {
  const previousAccountId = process.env.CF_ACCOUNT_ID;
  const previousImagesToken = process.env.CF_IMAGES_API_TOKEN;
  const previousStreamToken = process.env.CF_STREAM_API_TOKEN;

  afterEach(() => {
    vi.unstubAllGlobals();
    restoreEnv('CF_ACCOUNT_ID', previousAccountId);
    restoreEnv('CF_IMAGES_API_TOKEN', previousImagesToken);
    restoreEnv('CF_STREAM_API_TOKEN', previousStreamToken);
  });

  it('imports images from a signed URL', async () => {
    process.env.CF_ACCOUNT_ID = 'account_123';
    process.env.CF_IMAGES_API_TOKEN = 'images_token';
    const fetchMock = vi.fn().mockResolvedValue(responseJson({
      success: true,
      result: { id: 'image_123' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await uploadCloudflareImageFromUrl({
      url: 'https://r2.test/photo.jpg',
      assetId: '00000000-0000-4000-8000-000000000001',
      storageKey: 'photos/user/photo.jpg',
    });

    expect(result.id).toBe('image_123');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/account_123/images/v1',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
        body: expect.any(FormData),
      }),
    );
  });

  it('starts Stream ingest from a signed URL', async () => {
    process.env.CF_ACCOUNT_ID = 'account_123';
    process.env.CF_STREAM_API_TOKEN = 'stream_token';
    const fetchMock = vi.fn().mockResolvedValue(responseJson({
      success: true,
      result: { uid: 'stream_123', readyToStream: false },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await copyCloudflareStreamFromUrl({
      url: 'https://r2.test/video.mp4',
      assetId: '00000000-0000-4000-8000-000000000001',
      storageKey: 'videos/user/video.mp4',
      maxSizeBytes: 1234,
    });

    expect(result.uid).toBe('stream_123');
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toMatchObject({
      url: 'https://r2.test/video.mp4',
      maxSizeBytes: 1234,
      meta: {
        asset_id: '00000000-0000-4000-8000-000000000001',
        storage_key: 'videos/user/video.mp4',
      },
    });
  });

  it('deletes images by Cloudflare image id', async () => {
    process.env.CF_ACCOUNT_ID = 'account_123';
    process.env.CF_IMAGES_API_TOKEN = 'images_token';
    const fetchMock = vi.fn().mockResolvedValue(responseJson({ success: true, result: {} }));
    vi.stubGlobal('fetch', fetchMock);

    await deleteCloudflareImage('image_123');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/account_123/images/v1/image_123',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

function responseJson(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response;
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
