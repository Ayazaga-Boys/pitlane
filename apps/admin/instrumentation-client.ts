import * as Sentry from "@sentry/nextjs";

import { scrubSentryEvent } from "@/lib/sentry";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN_ADMIN;

Sentry.init({
  beforeSend(event) {
    return scrubSentryEvent(event);
  },
  debug: false,
  dsn,
  enabled: Boolean(dsn),
  integrations: [],
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
