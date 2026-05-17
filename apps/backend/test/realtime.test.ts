import { afterEach, describe, expect, it, vi } from 'vitest';
import { notifyRealtimeHelpEvent } from '../src/services/realtime.js';

describe('realtime service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.REALTIME_INTERNAL_URL;
    delete process.env.REALTIME_HELP_EVENT_PATH;
    delete process.env.REALTIME_INTERNAL_TIMEOUT_MS;
    delete process.env.GO_WS_INTERNAL_SECRET;
  });

  it('skips help events when realtime env is missing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await notifyRealtimeHelpEvent({
      type: 'help_created',
      help_request_id: 'help-1',
      h3_cell: '89283082803ffff',
      requester_id: 'user-1',
      issue_type: 'flat_tire',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts help events to the configured internal endpoint', async () => {
    process.env.REALTIME_INTERNAL_URL = 'https://realtime.rollpit.test';
    process.env.GO_WS_INTERNAL_SECRET = 'test-secret';
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await notifyRealtimeHelpEvent({
      type: 'help_assigned',
      help_request_id: 'help-1',
      h3_cell: '89283082803ffff',
      requester_id: 'user-1',
      helper_id: 'user-2',
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://realtime.rollpit.test/internal/realtime/help-event',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-secret',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'help_assigned',
          help_request_id: 'help-1',
          h3_cell: '89283082803ffff',
          requester_id: 'user-1',
          helper_id: 'user-2',
        }),
      }),
    );
  });
});
