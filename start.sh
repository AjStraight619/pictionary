#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
project_dir="$PWD"

for tool in docker go node npm; do
  command -v "$tool" >/dev/null || { echo "Please install $tool first."; exit 1; }
done
docker info >/dev/null
mkdir -p .dev

start_container() {
  local name="$1"
  shift
  if docker container inspect "$name" >/dev/null 2>&1; then
    docker start "$name" >/dev/null
  else
    docker run -d --name "$name" "$@" >/dev/null
  fi
}

echo "Starting local PostgreSQL and Redis..."
start_container pictionary-dev-postgres \
  -e POSTGRES_USER=pictionary -e POSTGRES_PASSWORD=pictionary \
  -e POSTGRES_DB=pictionary -p 127.0.0.1:5432:5432 \
  -v pictionary-dev-postgres:/var/lib/postgresql/data postgres:16
start_container pictionary-dev-redis \
  -p 127.0.0.1:6379:6379 redis:7

ready=false
for ((attempt = 0; attempt < 60; attempt++)); do
  if docker exec pictionary-dev-postgres pg_isready -U pictionary -d pictionary >/dev/null 2>&1 &&
     docker exec pictionary-dev-redis redis-cli ping >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
if [ "$ready" != true ]; then
  echo "Databases did not become ready. Check docker logs pictionary-dev-postgres."
  exit 1
fi

export DATABASE_URL='postgres://pictionary:pictionary@localhost:5432/pictionary?sslmode=disable'
export REDIS_URL='redis://localhost:6379'
export VITE_API_URL='http://localhost:8080'
export VITE_WS_URL='ws://localhost:8080/game'
unset RAILWAY_ENVIRONMENT_NAME SKIP_REDIS

echo "Preparing backend (first run may download Go and dependencies)..."
cd backend
go build -o "$project_dir/.dev/server" ./cmd/server
word_table=$(docker exec pictionary-dev-postgres psql -U pictionary -d pictionary -Atc "SELECT to_regclass('public.words')")
word_count=0
if [ -n "$word_table" ]; then
  word_count=$(docker exec pictionary-dev-postgres psql -U pictionary -d pictionary -Atc 'SELECT count(*) FROM words')
fi
if [ "$word_count" = 0 ]; then
  echo "Seeding drawing words..."
  go run scripts/seed_words.go
fi

backend_pid=''
frontend_pid=''
cleanup() {
  trap - EXIT INT TERM
  if [ -n "$frontend_pid" ]; then kill "$frontend_pid" 2>/dev/null || true; fi
  if [ -n "$backend_pid" ]; then kill "$backend_pid" 2>/dev/null || true; fi
  wait 2>/dev/null || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

"$project_dir/.dev/server" >"$project_dir/.dev/backend.log" 2>&1 &
backend_pid=$!
ready=false
for ((attempt = 0; attempt < 60; attempt++)); do
  if ! kill -0 "$backend_pid" 2>/dev/null; then break; fi
  if grep -q 'All services and routes initialized successfully' "$project_dir/.dev/backend.log"; then
    ready=true
    break
  fi
  sleep 1
done
if [ "$ready" != true ]; then
  cat "$project_dir/.dev/backend.log"
  echo "Backend failed to start."
  exit 1
fi

cd "$project_dir/frontend"
if [ ! -d node_modules ]; then npm ci; fi
node node_modules/vite/bin/vite.js --host localhost --port 5173 --strictPort &
frontend_pid=$!
echo "Open http://localhost:5173 — Ctrl+C stops the app. Backend log: .dev/backend.log"
echo "Databases persist; stop them with: docker stop pictionary-dev-postgres pictionary-dev-redis"
wait -n "$backend_pid" "$frontend_pid"
