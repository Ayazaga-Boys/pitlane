import { createSign } from 'node:crypto';
import {
  normalizePushData,
  type PushDevice,
  type PushPayload,
  type PushProvider,
  type PushProviderSendResult,
} from './push.js';

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const TOKEN_TTL_SKEW_MS = 60 * 1000;

export interface FcmServiceAccountConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

interface OAuthToken {
  access_token: string;
  expires_in: number;
}

export class FcmPushProvider implements PushProvider {
  private accessToken: { value: string; expiresAt: number } | undefined;

  constructor(private readonly config: FcmServiceAccountConfig) {}

  async send(device: PushDevice, payload: PushPayload): Promise<PushProviderSendResult> {
    const token = await this.getAccessToken();
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${this.config.projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildFcmMessage(device, payload)),
      },
    );

    if (response.ok) return { success: true };

    const errorCode = await extractFcmErrorCode(response);
    return errorCode ? { success: false, errorCode } : { success: false };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.accessToken.expiresAt - TOKEN_TTL_SKEW_MS) {
      return this.accessToken.value;
    }

    const assertion = createGoogleOAuthJwt(this.config);
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (!response.ok) {
      const errorCode = await extractFcmErrorCode(response);
      throw new Error(errorCode ?? `FCM auth failed: ${response.status}`);
    }

    const token = await response.json() as OAuthToken;
    this.accessToken = {
      value: token.access_token,
      expiresAt: Date.now() + token.expires_in * 1000,
    };
    return this.accessToken.value;
  }
}

export function getConfiguredPushProvider(): PushProvider | null {
  const config = readFcmServiceAccountConfig();
  return config ? new FcmPushProvider(config) : null;
}

export function readFcmServiceAccountConfig(): FcmServiceAccountConfig | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    const parsed = JSON.parse(rawJson) as Partial<{
      project_id: string;
      client_email: string;
      private_key: string;
    }>;
    if (parsed.project_id && parsed.client_email && parsed.private_key) {
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: normalizePrivateKey(parsed.private_key),
      };
    }
  }

  const projectId = process.env.FCM_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FCM_CLIENT_EMAIL ?? process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FCM_PRIVATE_KEY ?? process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;

  return {
    projectId,
    clientEmail,
    privateKey: normalizePrivateKey(privateKey),
  };
}

export function buildFcmMessage(device: PushDevice, payload: PushPayload): unknown {
  const data = normalizePushData(payload.data);
  const isIos = device.platform === 'ios';

  return {
    message: {
      token: device.token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        type: payload.type,
        ...data,
      },
      android: {
        priority: payload.type === 'help_nearby' ? 'HIGH' : 'NORMAL',
      },
      apns: {
        headers: {
          'apns-priority': payload.type === 'help_nearby' ? '10' : '5',
        },
        payload: {
          aps: {
            sound: isIos && payload.type === 'help_nearby' ? 'default' : undefined,
            badge: 1,
          },
        },
      },
    },
  };
}

export function createGoogleOAuthJwt(config: FcmServiceAccountConfig, now = Math.floor(Date.now() / 1000)): string {
  const header = base64UrlJson({ alg: 'RS256', typ: 'JWT' });
  const claims = base64UrlJson({
    iss: config.clientEmail,
    scope: FCM_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  });
  const signingInput = `${header}.${claims}`;
  const signature = createSign('RSA-SHA256').update(signingInput).sign(config.privateKey, 'base64url');
  return `${signingInput}.${signature}`;
}

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n');
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

async function extractFcmErrorCode(response: Response): Promise<string | undefined> {
  const body = await response.text().catch(() => '');
  if (!body) return `FCM_HTTP_${response.status}`;

  try {
    const parsed = JSON.parse(body) as {
      error?: {
        status?: string;
        message?: string;
        details?: Array<{ errorCode?: string }>;
      };
    };
    return parsed.error?.details?.find((detail) => detail.errorCode)?.errorCode
      ?? parsed.error?.status
      ?? parsed.error?.message
      ?? `FCM_HTTP_${response.status}`;
  } catch {
    return `FCM_HTTP_${response.status}`;
  }
}
