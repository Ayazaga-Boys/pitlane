/**
 * Rollpit Realtime V2 — Presence & Social WS Load Test
 *
 * Hedef: V2 follow/presence/social event akışının yük altında davranışını ölç.
 * 1k VU, her VU 10 kullanıcıyı takip ediyor → presence_update fan-out.
 *
 * Çalıştırmak için:
 *   ulimit -n 65536
 *   k6 run load-test/ws_v2_presence.js
 *
 * Not: subscribe_user FORBIDDEN döner çünkü dev modda follow cache boş.
 * Gerçek follow cache testi için Valkey'e manuel SetFollowees yapılmalı.
 */

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import http from 'k6/http';

// ─── Metrikler ────────────────────────────────────────────────────────────────

const connectErrors = new Counter('ws_connect_errors');
const msgReceived = new Counter('ws_msgs_received');
const heatmapUpdates = new Counter('ws_heatmap_updates');
const presenceUpdates = new Counter('ws_presence_updates');
const locationShares = new Counter('ws_location_shares');
const storyEvents = new Counter('ws_story_events');
const postLikeEvents = new Counter('ws_post_like_events');
const helpTargetedEvents = new Counter('ws_help_targeted_events');
const socialEventDelivery = new Trend('ws_social_event_delivery_ms', true);
const connectTime = new Trend('ws_connect_duration_ms', true);
const errorRate = new Rate('ws_error_rate');

// ─── Konfigürasyon ────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    // Senaryo 1: 1k VU bağlantı + presence
    presence_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '20s', target: 500 },
        { duration: '30s', target: 1_000 },
        { duration: '60s', target: 1_000 },
        { duration: '20s', target: 0 },
      ],
      tags: { scenario: 'presence' },
    },
  },
  thresholds: {
    ws_connect_duration_ms: ['p(95)<500'],
    ws_connect_errors: ['count<50'],
    ws_error_rate: ['rate<0.01'],
  },
};

const WS_URL = __ENV.WS_URL || 'ws://localhost:8080/ws/location';
const API_URL = __ENV.API_URL || 'http://localhost:8080';
const INTERNAL_SECRET = __ENV.GO_WS_INTERNAL_SECRET || 'test-secret-v2';

const H3_CELLS = [
  '89283082803ffff',
  '8928308280fffff',
  '892830828c3ffff',
  '8928308283bffff',
  '89283082817ffff',
];

// ─── VU senaryosu ─────────────────────────────────────────────────────────────

export default function () {
  const token = `vu-${__VU}-${__ITER}`;
  const url = `${WS_URL}?token=${token}`;
  const cell = H3_CELLS[(__VU - 1) % H3_CELLS.length];
  const vehicleType = __VU % 2 === 0 ? 'car' : 'motorcycle';

  const startAt = Date.now();

  const res = ws.connect(url, {}, function (socket) {
    connectTime.add(Date.now() - startAt);

    socket.on('open', function () {
      // Konum bildir — vehicle_type dahil
      socket.send(JSON.stringify({
        type: 'location',
        h3_cell: cell,
        vehicle_type: vehicleType,
      }));

      // Hücreye abone ol
      socket.send(JSON.stringify({
        type: 'subscribe_cell',
        h3_cell: cell,
        k: 2,
      }));

      // Başka bir VU'yu takip etmeyi dene (follow cache olmadığından FORBIDDEN beklenir)
      const targetVu = ((__VU % 100) + 1).toString();
      socket.send(JSON.stringify({
        type: 'subscribe_user',
        user_id: `vu-${targetVu}-0`,
      }));
    });

    socket.on('message', function (data) {
      msgReceived.add(1);
      try {
        const msg = JSON.parse(data);
        switch (msg.type) {
          case 'heatmap_update':
            heatmapUpdates.add(1);
            break;
          case 'presence_update':
            presenceUpdates.add(1);
            break;
          case 'location_share':
            locationShares.add(1);
            break;
          case 'story_posted':
            storyEvents.add(1);
            socialEventDelivery.add(Date.now() - startAt);
            break;
          case 'post_liked':
            postLikeEvents.add(1);
            break;
          case 'help_targeted':
            helpTargetedEvents.add(1);
            break;
          case 'error':
            // FORBIDDEN subscribe_user beklenen durum — hata saymıyoruz
            if (msg.code !== 'FORBIDDEN' && msg.code !== 'FOLLOW_CACHE_UNAVAILABLE') {
              errorRate.add(1);
            }
            break;
        }
      } catch (_) {}
    });

    socket.on('error', function () {
      connectErrors.add(1);
      errorRate.add(1);
    });

    socket.setTimeout(function () {
      socket.send(JSON.stringify({ type: 'ghost_on' }));
      socket.close();
    }, 100_000);
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

// ─── Setup: internal social event testi ──────────────────────────────────────

export function setup() {
  // Social event endpoint'ini smoke test et
  const payload = JSON.stringify({
    type: 'story_posted',
    author_id: 'setup-user',
    story_id: 'setup-story-1',
  });

  const res = http.post(
    `${API_URL}/internal/realtime/social-event`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${INTERNAL_SECRET}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (res.status !== 202) {
    console.warn(`social-event smoke test failed: ${res.status}`);
  } else {
    console.log('social-event endpoint OK');
  }
}
