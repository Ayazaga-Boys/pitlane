# Realtime Load Tests

Kisi 1 owns the Go realtime load scenarios in this folder. These tests never
commit secrets; pass runtime values through environment variables.

## Story fan-out

`ws_v2_social_fanout.js` targets the V2 contract:

- 1k connected websocket users
- each connected user subscribes to one author
- 100 authors produce `story_posted` internal events
- threshold: `ws_story_fanout_latency_ms p(95)<200`

Run:

```bash
cd apps/realtime
ulimit -n 65536
WS_URL=ws://localhost:8080/ws/location \
API_URL=http://localhost:8080 \
GO_WS_INTERNAL_SECRET="$GO_WS_INTERNAL_SECRET" \
k6 run load-test/ws_v2_social_fanout.js
```

## Valkey follow cache seed

The Go service only allows `subscribe_user` when the follow cache says the
viewer follows the target. Seed test data in the same Valkey instance used by
`apps/realtime/.env`.

The websocket dev auth maps token `f0000001` to user id
`dev-user-f0000001`. The fan-out test uses this deterministic token shape so
local seed data can target each virtual user.

For local smoke runs, seed a small deterministic set:

```bash
redis-cli -u "$VALKEY_ADDR" SADD follows:dev-user-f0000001 dev-user-author01
redis-cli -u "$VALKEY_ADDR" EXPIRE follows:dev-user-f0000001 600
```

For the full 1k x 10 follower profile, seed from a short script outside the
repo or from a secure ops shell, then run the k6 scenario with real test JWTs.
Do not commit Valkey URLs, JWTs, or generated token lists.
