import { createHash, createHmac, randomUUID } from 'node:crypto';

const PRESIGNED_TTL_SECONDS = 300;

interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

interface GenerateUploadUrlInput {
  storageKey: string;
  method?: 'GET' | 'PUT' | 'DELETE' | 'HEAD';
  expiresInSeconds?: number;
}

export interface R2ObjectMetadata {
  contentType?: string;
  sizeBytes?: number;
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ENDPOINT
      && process.env.R2_ACCESS_KEY_ID
      && process.env.R2_SECRET_ACCESS_KEY
      && process.env.R2_BUCKET,
  );
}

export function createMediaStorageKey(input: {
  userId: string;
  assetType: 'photo' | 'video';
  contentType: string;
}): string {
  const folder = input.assetType === 'photo' ? 'photos' : 'videos';
  return `${folder}/${input.userId}/${randomUUID()}.${extensionForContentType(input.contentType)}`;
}

export function createBusinessTaxDocumentStorageKey(input: {
  userId: string;
  pinId: string;
  contentType: string;
}): string {
  return `business-tax-documents/${input.pinId}/${input.userId}/${randomUUID()}.${extensionForContentType(input.contentType)}`;
}

export function generateR2UploadUrl(input: GenerateUploadUrlInput): string {
  const config = getR2Config();
  const endpoint = new URL(config.endpoint);
  const method = input.method ?? 'PUT';
  const expiresInSeconds = input.expiresInSeconds ?? PRESIGNED_TTL_SECONDS;
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const canonicalUri = `/${encodePathSegment(config.bucket)}/${encodeS3Key(input.storageKey)}`;

  const query = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${config.accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresInSeconds),
    'X-Amz-SignedHeaders': 'host',
  });

  const canonicalQuery = toCanonicalQuery(query);
  const canonicalHeaders = `host:${endpoint.host}\n`;
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = getSignatureKey(config.secretAccessKey, dateStamp);
  const signature = hmacHex(signingKey, stringToSign);
  query.set('X-Amz-Signature', signature);

  return `${endpoint.origin}${canonicalUri}?${toCanonicalQuery(query)}`;
}

export async function deleteR2Object(storageKey: string): Promise<void> {
  const url = generateR2UploadUrl({ storageKey, method: 'DELETE' });
  const response = await fetch(url, { method: 'DELETE' });

  if (!response.ok && response.status !== 404) {
    throw new Error(`R2 delete failed with status ${response.status}`);
  }
}

export async function putR2Object(input: {
  storageKey: string;
  body: string;
  contentType: string;
}): Promise<void> {
  const url = generateR2UploadUrl({ storageKey: input.storageKey, method: 'PUT' });
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': input.contentType },
    body: input.body,
  });

  if (!response.ok) {
    throw new Error(`R2 put failed with status ${response.status}`);
  }
}

export function generateR2ReadUrl(storageKey: string, expiresInSeconds = PRESIGNED_TTL_SECONDS): string {
  return generateR2UploadUrl({ storageKey, method: 'GET', expiresInSeconds });
}

export async function headR2Object(storageKey: string): Promise<R2ObjectMetadata | null> {
  const url = generateR2UploadUrl({ storageKey, method: 'HEAD' });
  const response = await fetch(url, { method: 'HEAD' });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`R2 head failed with status ${response.status}`);
  }

  const sizeHeader = response.headers.get('content-length');
  const contentType = response.headers.get('content-type') ?? undefined;
  const metadata: R2ObjectMetadata = {};

  if (contentType) metadata.contentType = contentType;
  if (sizeHeader) {
    const sizeBytes = Number(sizeHeader);
    if (Number.isSafeInteger(sizeBytes) && sizeBytes > 0) metadata.sizeBytes = sizeBytes;
  }

  return metadata;
}

function getR2Config(): R2Config {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Cloudflare R2 is not configured');
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'video/mp4':
      return 'mp4';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'bin';
  }
}

function toAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodeS3Key(key: string): string {
  return key.split('/').map(encodePathSegment).join('/');
}

function toCanonicalQuery(query: URLSearchParams): string {
  return [...query.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodePathSegment(key)}=${encodePathSegment(value)}`)
    .join('&');
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function hmacHex(key: Buffer, value: string): string {
  return createHmac('sha256', key).update(value).digest('hex');
}

function getSignatureKey(secretAccessKey: string, dateStamp: string): Buffer {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, 'auto');
  const serviceKey = hmac(regionKey, 's3');
  return hmac(serviceKey, 'aws4_request');
}
