import { randomUUID } from 'node:crypto';

interface CaptureExceptionInput {
  error: Error;
  method: string;
  path: string;
  userId?: string;
}

interface ParsedDsn {
  dsn: string;
  endpoint: string;
  publicKey: string;
}

export function isSentryConfigured(): boolean {
  return Boolean(getSentryDsn());
}

export async function captureException(input: CaptureExceptionInput): Promise<void> {
  const parsed = parseSentryDsn(getSentryDsn());
  if (!parsed) return;

  const event = {
    event_id: randomUUID().replaceAll('-', ''),
    timestamp: new Date().toISOString(),
    platform: 'node',
    level: 'error',
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.RELEASE_SHA ?? process.env.FLY_IMAGE_REF ?? undefined,
    logger: 'rollpit-api',
    tags: {
      service: 'rollpit-api',
      method: input.method,
      path: input.path,
    },
    user: input.userId ? { id: input.userId } : undefined,
    request: {
      method: input.method,
      url: input.path,
    },
    exception: {
      values: [{
        type: input.error.name || 'Error',
        value: input.error.message,
        stacktrace: stacktraceFromError(input.error),
      }],
    },
  };

  const envelope = [
    JSON.stringify({ dsn: parsed.dsn, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');

  try {
    const response = await fetch(parsed.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=rollpit-api/0.1.0`,
      },
      body: envelope,
    });

    if (!response.ok) {
      throw new Error(`Sentry capture failed with status ${response.status}`);
    }
  } catch {
    // Sentry must never affect request handling.
  }
}

export function parseSentryDsn(dsn: string | undefined): ParsedDsn | null {
  if (!dsn) return null;

  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const segments = url.pathname.split('/').filter(Boolean);
    const projectId = segments.pop();
    if (!publicKey || !projectId) return null;

    const basePath = segments.length > 0 ? `/${segments.join('/')}` : '';
    return {
      dsn,
      endpoint: `${url.protocol}//${url.host}${basePath}/api/${projectId}/envelope/`,
      publicKey,
    };
  } catch {
    return null;
  }
}

function getSentryDsn(): string | undefined {
  return process.env.SENTRY_DSN_API ?? process.env.SENTRY_DSN;
}

function stacktraceFromError(error: Error): { frames: Array<{ filename?: string; function?: string; lineno?: number; colno?: number }> } | undefined {
  if (!error.stack) return undefined;

  const frames: Array<{ filename: string; function: string; lineno: number; colno: number }> = error.stack
    .split('\n')
    .slice(1)
    .map((line) => {
      const match = line.match(/^\s*at (?:(.*?) \()?(.+?):(\d+):(\d+)\)?$/);
      if (!match) return null;
      return {
        function: match[1] || '<anonymous>',
        filename: match[2] ?? '<unknown>',
        lineno: Number(match[3]),
        colno: Number(match[4]),
      };
    })
    .filter((frame): frame is { filename: string; function: string; lineno: number; colno: number } => Boolean(frame))
    .reverse();

  return frames.length > 0 ? { frames } : undefined;
}
