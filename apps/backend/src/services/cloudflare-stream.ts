import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const DEFAULT_SIGNATURE_TOLERANCE_SECONDS = 5 * 60;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CloudflareStreamWebhookSchema = z.object({
  uid: z.string().min(1),
  readyToStream: z.boolean().optional(),
  status: z.object({
    state: z.string().optional(),
    pctComplete: z.union([z.string(), z.number()]).optional(),
    errReasonCode: z.string().optional(),
    errReasonText: z.string().optional(),
  }).passthrough().optional(),
  meta: z.record(z.unknown()).optional(),
  duration: z.number().optional(),
  input: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
  }).passthrough().optional(),
  size: z.number().optional(),
}).passthrough();

export type CloudflareStreamWebhook = z.infer<typeof CloudflareStreamWebhookSchema>;

export type CloudflareStreamAssetReference =
  | { type: 'id'; value: string }
  | { type: 'storage_key'; value: string };

export type MediaAssetWebhookStatus = 'pending' | 'ready' | 'failed';

export function verifyCloudflareStreamSignature(input: {
  body: string;
  header: string | undefined;
  secret: string;
  now?: Date;
  toleranceSeconds?: number;
}): boolean {
  const signature = parseSignatureHeader(input.header);
  if (!signature) return false;

  const timestamp = Number(signature.time);
  if (!Number.isSafeInteger(timestamp)) return false;

  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const toleranceSeconds = input.toleranceSeconds ?? DEFAULT_SIGNATURE_TOLERANCE_SECONDS;
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;

  const expected = createHmac('sha256', input.secret)
    .update(`${signature.time}.${input.body}`)
    .digest('hex');

  return timingSafeHexEqual(expected, signature.sig1);
}

export function parseCloudflareStreamWebhook(body: string): CloudflareStreamWebhook | null {
  try {
    const parsedJson = JSON.parse(body) as unknown;
    const parsed = CloudflareStreamWebhookSchema.safeParse(parsedJson);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function getCloudflareStreamAssetReference(
  event: CloudflareStreamWebhook,
): CloudflareStreamAssetReference | null {
  const meta = event.meta ?? {};
  const assetId = readString(meta.asset_id) ?? readString(meta.media_asset_id);
  if (assetId && UUID_PATTERN.test(assetId)) {
    return { type: 'id', value: assetId };
  }

  const storageKey = readString(meta.source_key) ?? readString(meta.storage_key);
  if (storageKey) {
    return { type: 'storage_key', value: storageKey };
  }

  return null;
}

export function getCloudflareStreamAssetStatus(event: CloudflareStreamWebhook): MediaAssetWebhookStatus {
  if (event.status?.state === 'error') return 'failed';
  if (event.status?.state === 'ready' || event.readyToStream) return 'ready';
  return 'pending';
}

export function toMediaAssetMetrics(event: CloudflareStreamWebhook): {
  duration_sec?: number;
  width?: number;
  height?: number;
  size_bytes?: number;
} {
  return Object.fromEntries(
    Object.entries({
      duration_sec: toPositiveInteger(event.duration),
      width: toPositiveInteger(event.input?.width),
      height: toPositiveInteger(event.input?.height),
      size_bytes: toPositiveInteger(event.size),
    }).filter(([, value]) => value !== undefined),
  );
}

function parseSignatureHeader(header: string | undefined): { time: string; sig1: string } | null {
  if (!header) return null;

  const parts = Object.fromEntries(
    header.split(',')
      .map((part) => part.trim().split('='))
      .filter((part): part is [string, string] => part.length === 2 && Boolean(part[0]) && Boolean(part[1])),
  );

  if (!parts.time || !parts.sig1) return null;
  return { time: parts.time, sig1: parts.sig1 };
}

function timingSafeHexEqual(expectedHex: string, actualHex: string): boolean {
  if (!/^[0-9a-f]+$/i.test(actualHex)) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');
  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toPositiveInteger(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(value);
}
