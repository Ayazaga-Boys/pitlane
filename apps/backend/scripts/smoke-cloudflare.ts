import { config } from 'dotenv';
import { generateR2UploadUrl, isR2Configured } from '../src/services/r2.js';

config({ path: '.env.local' });
config();

interface CheckResult {
  name: string;
  status: 'ok' | 'skipped' | 'failed';
  detail: string;
}

const results: CheckResult[] = [];

async function main(): Promise<void> {
  await checkR2();
  await checkCloudflareImages();
  await checkCloudflareStream();

  for (const result of results) {
    console.log(`${result.status.toUpperCase()} ${result.name}: ${result.detail}`);
  }

  if (results.some((result) => result.status === 'failed')) {
    process.exitCode = 1;
  }
}

async function checkR2(): Promise<void> {
  if (!isR2Configured()) {
    results.push({ name: 'R2', status: 'skipped', detail: 'R2 env is not configured' });
    return;
  }

  const storageKey = `smoke/backend-${Date.now()}.txt`;
  try {
    const put = await fetch(generateR2UploadUrl({ storageKey, method: 'PUT' }), {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: 'ok',
    });
    const head = await fetch(generateR2UploadUrl({ storageKey, method: 'HEAD' }), { method: 'HEAD' });
    const del = await fetch(generateR2UploadUrl({ storageKey, method: 'DELETE' }), { method: 'DELETE' });

    if (!put.ok || !head.ok || !del.ok) {
      results.push({
        name: 'R2',
        status: 'failed',
        detail: `PUT=${put.status} HEAD=${head.status} DELETE=${del.status}`,
      });
      return;
    }

    results.push({ name: 'R2', status: 'ok', detail: 'PUT/HEAD/DELETE succeeded' });
  } catch (error) {
    results.push({ name: 'R2', status: 'failed', detail: errorMessage(error) });
  }
}

async function checkCloudflareImages(): Promise<void> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_IMAGES_API_TOKEN;
  if (!accountId || !token) {
    results.push({ name: 'Cloudflare Images', status: 'skipped', detail: 'Images env is not configured' });
    return;
  }

  try {
    const response = await cloudflareGet(`/accounts/${accountId}/images/v1/variants`, token);
    if (!response.success) {
      results.push({
        name: 'Cloudflare Images',
        status: 'failed',
        detail: response.errors.join('; ') || 'API returned success=false',
      });
      return;
    }

    results.push({ name: 'Cloudflare Images', status: 'ok', detail: 'variants endpoint reachable' });
  } catch (error) {
    results.push({ name: 'Cloudflare Images', status: 'failed', detail: errorMessage(error) });
  }
}

async function checkCloudflareStream(): Promise<void> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_STREAM_API_TOKEN;
  if (!accountId || !token) {
    results.push({ name: 'Cloudflare Stream', status: 'skipped', detail: 'Stream env is not configured' });
    return;
  }

  try {
    const response = await cloudflareGet(`/accounts/${accountId}/stream?per_page=1`, token);
    if (!response.success) {
      results.push({
        name: 'Cloudflare Stream',
        status: 'failed',
        detail: response.errors.join('; ') || 'API returned success=false',
      });
      return;
    }

    results.push({ name: 'Cloudflare Stream', status: 'ok', detail: 'stream endpoint reachable' });
  } catch (error) {
    results.push({ name: 'Cloudflare Stream', status: 'failed', detail: errorMessage(error) });
  }
}

async function cloudflareGet(path: string, token: string): Promise<{ success: boolean; errors: string[] }> {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => null) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
  } | null;

  return {
    success: Boolean(response.ok && body?.success),
    errors: body?.errors?.map((error) => error.message ?? 'Cloudflare error') ?? [],
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}

void main();
