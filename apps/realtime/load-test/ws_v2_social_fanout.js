/**
 * Rollpit Realtime V2 — Story fan-out load test
 *
 * Hedef: 1k kullanıcı x 10 follower senaryosunda story_posted fan-out
 * gecikmesini ölçmek. Test, Go realtime dev auth modunda çalışacak şekilde
 * token prefix'lerini sabit tutar; Valkey follow cache'in testten önce
 * follows:<followerId> set'leriyle seed edilmesi gerekir.
 *
 * Örnek:
 *   ulimit -n 65536
 *   VALKEY_ADDR=redis://... GO_WS_INTERNAL_SECRET=... \
 *   k6 run load-test/ws_v2_social_fanout.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const connectErrors = new Counter('ws_connect_errors');
const storyEvents = new Counter('ws_story_events');
const storyLatency = new Trend('ws_story_fanout_latency_ms', true);
const errorRate = new Rate('ws_error_rate');

export const options = {
  scenarios: {
    followers: {
      executor: 'constant-vus',
      vus: 1000,
      duration: '90s',
    },
  },
  thresholds: {
    ws_connect_errors: ['count<50'],
    ws_error_rate: ['rate<0.01'],
    ws_story_fanout_latency_ms: ['p(95)<200'],
    ws_story_events: ['count>500'],
  },
};

const WS_URL = __ENV.WS_URL || 'ws://localhost:8080/ws/location';
const API_URL = __ENV.API_URL || 'http://localhost:8080';
const INTERNAL_SECRET = __ENV.GO_WS_INTERNAL_SECRET || 'test-secret-v2';

function authorForVu(vu) {
  return `dev-user-author${String(((vu - 1) % 100) + 1).padStart(2, '0')}`;
}

export default function () {
  // Dev auth uses the first 8 token chars as the user id suffix, so this keeps
  // VU ids deterministic: f0000001 -> dev-user-f0000001.
  const followerToken = `f${String(__VU).padStart(7, '0')}`;
  const subscribedAuthor = authorForVu(__VU);
  const url = `${WS_URL}?token=${followerToken}`;
  let triggerAt = 0;

  const res = ws.connect(url, {}, (socket) => {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        type: 'subscribe_user',
        user_id: subscribedAuthor,
      }));

      if (__VU <= 100 && __ITER % 3 === 0) {
        triggerAt = Date.now();
        http.post(
          `${API_URL}/internal/realtime/social-event`,
          JSON.stringify({
            type: 'story_posted',
            author_id: subscribedAuthor,
            story_id: `story-${__VU}-${__ITER}`,
          }),
          {
            headers: {
              Authorization: `Bearer ${INTERNAL_SECRET}`,
              'Content-Type': 'application/json',
            },
          },
        );
      }
    });

    socket.on('message', (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'story_posted') {
          storyEvents.add(1);
          if (triggerAt > 0) storyLatency.add(Date.now() - triggerAt);
        } else if (msg.type === 'error' && msg.code !== 'FORBIDDEN') {
          errorRate.add(1);
        }
      } catch (_) {
        errorRate.add(1);
      }
    });

    socket.on('error', () => {
      connectErrors.add(1);
      errorRate.add(1);
    });

    socket.setTimeout(() => socket.close(), 30_000);
  });

  check(res, {
    'connected successfully': (r) => r && r.status === 101,
  });

  if (!res || res.status !== 101) {
    connectErrors.add(1);
    errorRate.add(1);
  }

  sleep(1);
}
