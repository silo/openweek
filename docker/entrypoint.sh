#!/bin/sh
set -e
echo "→ Applying database migrations…"
node /app/docker/migrate.mjs
echo "→ Starting Openweek on :${PORT:-3000}"
exec node /app/.output/server/index.mjs
