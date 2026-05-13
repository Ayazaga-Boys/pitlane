import { logger } from '../lib/logger.js';

const DEFAULT_HELP_EVENT_PATH = '/internal/realtime/help-event';
const DEFAULT_TIMEOUT_MS = 750;

type HelpCreatedEvent = {
  type: 'help_created';
  help_request_id: string;
  h3_cell: string;
  requester_id: string;
  issue_type: string;
};

type HelpAssignedEvent = {
  type: 'help_assigned';
  help_request_id: string;
  h3_cell: string;
  requester_id: string;
  helper_id: string;
};

export type RealtimeHelpEvent = HelpCreatedEvent | HelpAssignedEvent;

function realtimeHelpEventUrl(): string | null {
  const baseUrl = process.env.REALTIME_INTERNAL_URL;
  if (!baseUrl) return null;

  const path = process.env.REALTIME_HELP_EVENT_PATH ?? DEFAULT_HELP_EVENT_PATH;
  return new URL(path, baseUrl).toString();
}

function realtimeTimeoutMs(): number {
  const parsed = Number(process.env.REALTIME_INTERNAL_TIMEOUT_MS);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return DEFAULT_TIMEOUT_MS;
}

export async function notifyRealtimeHelpEvent(event: RealtimeHelpEvent): Promise<void> {
  const secret = process.env.GO_WS_INTERNAL_SECRET;

  try {
    const url = realtimeHelpEventUrl();
    if (!url || !secret) return;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(realtimeTimeoutMs()),
    });

    if (!response.ok) {
      logger.warn(
        {
          status: response.status,
          event_type: event.type,
          help_request_id: event.help_request_id,
        },
        'realtime_help_event_failed',
      );
    }
  } catch (error) {
    logger.warn(
      {
        err: error,
        event_type: event.type,
        help_request_id: event.help_request_id,
      },
      'realtime_help_event_error',
    );
  }
}
