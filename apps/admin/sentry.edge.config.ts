import * as Sentry from "@sentry/nextjs";

import { scrubSentryEvent } from "@/lib/sentry";

const dsn = process.env.SENTRY_DSN_ADMIN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  beforeSend(event) {
    return scrubSentryEvent(event);
  },
  debug: false,
  dsn,
  enabled: Boolean(dsn),
  integrations: [],
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
});
