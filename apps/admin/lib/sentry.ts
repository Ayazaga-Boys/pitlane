type LooseRecord = Record<string, unknown>;

function asRecord(value: unknown): LooseRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as LooseRecord;
}

export function scrubSentryEvent<T extends object>(event: T): T {
  const payload = event as LooseRecord;

  const user = asRecord(payload.user);
  if (user) {
    delete user.email;
    delete user.ip_address;
  }

  const request = asRecord(payload.request);
  if (request) {
    const headers = asRecord(request.headers);
    if (headers) {
      delete headers.authorization;
      delete headers.Authorization;
      delete headers.cookie;
      delete headers.Cookie;
    }

    delete request.cookies;
  }

  const contexts = asRecord(payload.contexts);
  const app = asRecord(contexts?.app);
  if (app) {
    delete app.h3_cell;
  }

  return event;
}
