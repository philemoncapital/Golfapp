#!/usr/bin/env bash
# Runs all migrations, the seed and the SQL tests against a throw-away local Postgres (16+).
# Usage: npm run test:db      (needs initdb/pg_ctl/psql on PATH or in /usr/lib/postgresql/*/bin)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
[ -n "$BIN" ] && export PATH="$BIN:$PATH"
TMP="$(mktemp -d)"; PORT="${PGTEST_PORT:-54329}"
cleanup() { pg_ctl -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT
RUNAS=()
if [ "$(id -u)" = "0" ]; then chown -R postgres "$TMP" 2>/dev/null || true; RUNAS=(runuser -u postgres --); chmod 755 "$TMP"; fi
"${RUNAS[@]}" initdb -D "$TMP/data" -U postgres -A trust >/dev/null
"${RUNAS[@]}" pg_ctl -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" start -w >/dev/null
PSQL=(psql -h "$TMP" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -f "$ROOT/supabase/tests/local/supabase_stub.sql" >/dev/null
for f in "$ROOT"/supabase/migrations/*.sql; do echo "migrate $(basename "$f")"; "${PSQL[@]}" -f "$f" >/dev/null; done
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql" >/dev/null
[ -f "$ROOT/supabase/tests/local/hcp_vectors.sql" ] && "${PSQL[@]}" -f "$ROOT/supabase/tests/local/hcp_vectors.sql" >/dev/null
for t in "$ROOT"/supabase/tests/*.sql; do
  echo "test $(basename "$t")"
  if ! out="$("${PSQL[@]}" -f "$t" 2>&1)"; then echo "$out" | grep -vE "^(NOTICE|psql:.*NOTICE)" | tail -25; exit 1; fi
  if echo "$out" | grep -q WARNING; then echo "$out" | grep WARNING | head -5; exit 1; fi
  echo "$out" | grep -E "PASSED" || { echo "$out" | tail -5; exit 1; }
done
echo "DB TESTS OK"
