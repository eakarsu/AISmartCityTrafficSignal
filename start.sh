#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; cd "$project_dir"
test -f .env || { echo '.env is required (copy .env.example)' >&2; exit 1; }
test -d backend/node_modules || { echo 'Backend dependencies are missing; install them explicitly before starting' >&2; exit 1; }

if [[ "${NODE_ENV:-}" == "test" ]]; then
  echo "Starting API-only test runtime on port ${BACKEND_PORT:?BACKEND_PORT is required}."
  cd backend
  exec node server.js
fi

test -d frontend/node_modules || { echo 'Frontend dependencies are missing; install them explicitly before starting' >&2; exit 1; }
mode="${1:-all}"; pids=(); trap 'for pid in "${pids[@]:-}"; do kill "$pid" 2>/dev/null || true; done' EXIT INT TERM
if [[ "$mode" == backend || "$mode" == all ]]; then node backend/server.js & pids+=("$!"); fi
if [[ "$mode" == frontend || "$mode" == all ]]; then BROWSER=none PORT="${FRONTEND_PORT:-3000}" npm --prefix frontend start & pids+=("$!"); fi
[[ ${#pids[@]} -gt 0 ]] || { echo 'Usage: ./start.sh [all|backend|frontend]' >&2; exit 2; }; wait
