#!/bin/sh
set -e

echo "Waiting for Postgres at ${DB_HOST}:${DB_PORT:-5432}..."
retries=60
until node -e "
const net = require('net');
const host = process.env.DB_HOST || 'db';
const port = Number(process.env.DB_PORT || 5432);
const socket = net.connect(port, host, () => { socket.end(); process.exit(0); });
socket.on('error', () => process.exit(1));
" 2>/dev/null; do
  retries=$((retries - 1))
  if [ "$retries" -le 0 ]; then
    echo "Postgres did not become ready in time."
    exit 1
  fi
  sleep 1
done

echo "Running Sequelize migrations (public / tenant templates)..."
npx sequelize db:migrate

echo "Running control-plane migrations (trial users, tenants, platform)..."
npx sequelize db:migrate --migrations-path migrations-control

echo "Starting API..."
exec node index.js
