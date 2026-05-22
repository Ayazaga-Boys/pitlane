const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

interface CloudflareConfig {
  accountId: string;
  token: string;
}

interface CloudflareApiResponse<T> {
  success?: boolean;
  result?: T;
  errors?: Array<{ message?: string }>;
}

export interface CloudflareImageResult {
  id: string;
  variants?: string[];
}

export interface CloudflareImageDirectUploadResult {
  id: string;
  uploadURL: string;
}

export interface CloudflareStreamResult {
  uid: string;
  readyToStream?: boolean;
  status?: { state?: string };
}

export function isCloudflareImagesConfigured(): boolean {
  return Boolean(process.env.CF_ACCOUNT_ID && process.env.CF_IMAGES_API_TOKEN);
}

export function isCloudflareStreamConfigured(): boolean {
  return Boolean(process.env.CF_ACCOUNT_ID && process.env.CF_STREAM_API_TOKEN);
}

export async function uploadCloudflareImageFromUrl(input: {
  url: string;
  assetId: string;
  storageKey: string;
}): Promise<CloudflareImageResult> {
  const config = getCloudflareConfig('CF_IMAGES_API_TOKEN');
  const form = new FormData();
  form.set('url', input.url);
  form.set('metadata', JSON.stringify({
    asset_id: input.assetId,
    storage_key: input.storageKey,
  }));
  form.set('requireSignedURLs', 'false');

  return cloudflareFetch<CloudflareImageResult>({
    config,
    path: `/accounts/${config.accountId}/images/v1`,
    method: 'POST',
    body: form,
  });
}

export async function createCloudflareImageDirectUpload(input: {
  userId: string;
  purpose: 'profile_avatar';
  expiresAt: Date;
  filename?: string;
}): Promise<CloudflareImageDirectUploadResult> {
  const config = getCloudflareConfig('CF_IMAGES_API_TOKEN');
  const form = new FormData();
  form.set('creator', input.userId);
  form.set('expiry', input.expiresAt.toISOString());
  form.set('metadata', JSON.stringify({
    user_id: input.userId,
    purpose: input.purpose,
    ...(input.filename ? { filename: input.filename } : {}),
  }));
  form.set('requireSignedURLs', 'false');

  return cloudflareFetch<CloudflareImageDirectUploadResult>({
    config,
    path: `/accounts/${config.accountId}/images/v2/direct_upload`,
    method: 'POST',
    body: form,
  });
}

export async function copyCloudflareStreamFromUrl(input: {
  url: string;
  assetId: string;
  storageKey: string;
  maxSizeBytes?: number;
}): Promise<CloudflareStreamResult> {
  const config = getCloudflareConfig('CF_STREAM_API_TOKEN');
  const body = Object.fromEntries(
    Object.entries({
      url: input.url,
      meta: {
        asset_id: input.assetId,
        storage_key: input.storageKey,
      },
      maxSizeBytes: input.maxSizeBytes,
    }).filter(([, value]) => value !== undefined),
  );

  return cloudflareFetch<CloudflareStreamResult>({
    config,
    path: `/accounts/${config.accountId}/stream/copy`,
    method: 'POST',
    body: JSON.stringify(body),
    contentType: 'application/json',
  });
}

export async function deleteCloudflareImage(imageId: string): Promise<void> {
  const config = getCloudflareConfig('CF_IMAGES_API_TOKEN');
  await cloudflareFetch<unknown>({
    config,
    path: `/accounts/${config.accountId}/images/v1/${encodeURIComponent(imageId)}`,
    method: 'DELETE',
  });
}

export async function deleteCloudflareStream(streamId: string): Promise<void> {
  const config = getCloudflareConfig('CF_STREAM_API_TOKEN');
  await cloudflareFetch<unknown>({
    config,
    path: `/accounts/${config.accountId}/stream/${encodeURIComponent(streamId)}`,
    method: 'DELETE',
  });
}

function getCloudflareConfig(tokenEnvKey: 'CF_IMAGES_API_TOKEN' | 'CF_STREAM_API_TOKEN'): CloudflareConfig {
  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env[tokenEnvKey];
  if (!accountId || !token) {
    throw new Error(`${tokenEnvKey} or CF_ACCOUNT_ID is not configured`);
  }

  return { accountId, token };
}

async function cloudflareFetch<T>(input: {
  config: CloudflareConfig;
  path: string;
  method: 'POST' | 'DELETE';
  body?: BodyInit;
  contentType?: string;
}): Promise<T> {
  const headers = new Headers({ Authorization: `Bearer ${input.config.token}` });
  if (input.contentType) headers.set('Content-Type', input.contentType);

  const init: RequestInit = {
    method: input.method,
    headers,
  };
  if (input.body !== undefined) init.body = input.body;

  const response = await fetch(`${CLOUDFLARE_API_BASE}${input.path}`, init);

  const payload = await response.json().catch(() => null) as CloudflareApiResponse<T> | null;
  if (!response.ok || payload?.success === false || !payload?.result) {
    const error = payload?.errors?.[0]?.message ?? `Cloudflare API failed with status ${response.status}`;
    throw new Error(error);
  }

  return payload.result;
}
