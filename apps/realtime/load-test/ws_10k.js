/**
 * Rollpit Realtime — WebSocket Load Test
 *
 * Hedef: 10 000 eşzamanlı WS bağlantısı altında hub kararlılığını ölç.
 *
 * Çalıştırmak için:
 *   1. Realtime servisi dev modda ayağa kaldır (SUPABASE_JWT_SECRET boş):
 *        cd apps/realtime && go run ./cmd/realtime
 *   2. OS file descriptor limitini yükselt:
 *        ulimit -n 65536
 *   3. Testi çalıştır:
 *        k6 run load-test/ws_10k.js
 *
 * Env değişkenleri:
 *   WS_URL  — default: ws://localhost:8080/ws/location
 */

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Metrikler ────────────────────────────────────────────────────────────────

const connectErrors = new Counter('ws_connect_errors');
const msgReceived = new Counter('ws_msgs_received');
const heatmapUpdates = new Counter('ws_heatmap_updates');
const helpEvents = new Counter('ws_help_events');
const connectTime = new Trend('ws_connect_duration_ms', true);
const errorRate = new Rate('ws_error_rate');

// ─── Test konfigürasyonu ──────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: '30s', target: 1_000 },   // 1k bağlantıya çık
    { duration: '30s', target: 5_000 },   // 5k'ya çık
    { duration: '30s', target: 10_000 },  // 10k'ya çık
    { duration: '60s', target: 10_000 },  // 10k'da tut
    { duration: '30s', target: 0 },       // nazikçe kapat
  ],
  thresholds: {
    ws_connect_duration_ms: ['p(95)<1000'], // 95% bağlantı < 1s
    ws_connect_errors: ['count<100'],        // toplam bağlantı hatası < 100
    ws_error_rate: ['rate<0.01'],            // hata oranı < %1
  },
};

// ─── İstanbul H3 hücreleri (res-9, harita kaplaması) ─────────────────────────

const H3_CELLS = [
  '89283082803ffff', // Taksim
  '8928308280fffff', // Maslak
  '892830828c3ffff', // Sultanahmet
  '8928308283bffff', // Şişli
  '89283082817ffff', // Beşiktaş
  '8928308281fffff', // Mecidiyeköy
  '89283082807ffff', // Bağcılar
  '8928308282fffff', // Eyüp
  '8928308280bffff', // Kadıköy
  '89283082883ffff', // Maltepe
  '89283082887ffff', // Kartal
  '8928308288bffff', // Üsküdar
  '89283082893ffff', // Beykoz
];

const WS_URL = __ENV.WS_URL || 'ws://localhost:8080/ws/location';

// ─── Her VU'nun çalıştırdığı senaryo ─────────────────────────────────────────

export default function () {
  // Dev bypass: her VU unique bir token → unique userID
  const token = `vu-${__VU}-${__ITER}`;
  const url = `${WS_URL}?token=${token}`;
  const cell = H3_CELLS[(__VU - 1) % H3_CELLS.length];

  const startAt = Date.now();

  const res = ws.connect(url, {}, function (socket) {
    connectTime.add(Date.now() - startAt);

    socket.on('open', function () {
      // 1. Hücreye abone ol
      socket.send(JSON.stringify({
        type: 'subscribe_cell',
        h3_cell: cell,
        k: 2,
      }));

      // 2. Konumu bildir (ham GPS değil, H3 hücresi)
      socket.send(JSON.stringify({
        type: 'location',
        h3_cell: cell,
      }));
    });

    socket.on('message', function (data) {
      msgReceived.add(1);
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'heatmap_update') heatmapUpdates.add(1);
        if (msg.type === 'help_nearby') helpEvents.add(1);
        if (msg.type === 'error') errorRate.add(1);
      } catch (_) {
        // JSON parse hatası — beklenmedik format
      }
    });

    socket.on('error', function (e) {
      connectErrors.add(1);
      errorRate.add(1);
    });

    // Bağlantıyı 90s canlı tut (stage süresiyle örtüşür)
    socket.setTimeout(function () {
      socket.send(JSON.stringify({ type: 'ghost_on' }));
      socket.close();
    }, 90_000);
  });

  check(res, {
    'connected successfully': (r) => r && r.status === 101,
  });

  if (!res || res.status !== 101) {
    connectErrors.add(1);
    errorRate.add(1);
    return;
  }

  sleep(1);
}
