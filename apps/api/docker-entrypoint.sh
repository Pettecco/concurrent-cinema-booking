#!/bin/sh
set -e

echo "Running database migrations..."
npx tsx node_modules/knex/bin/cli.js migrate:latest --knexfile knexfile.ts

echo "Running database seeds..."
npx tsx node_modules/knex/bin/cli.js seed:run --knexfile knexfile.ts

echo "Starting API server..."
exec node dist/server.js
