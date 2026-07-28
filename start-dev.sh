#!/usr/bin/env bash
set -e

cd /home/kasm-user/fortune-sheet-collab-demo

docker compose up -d mongo redis spring

MONGODB_URI=mongodb://127.0.0.1:27017/fortune_sheet_collab \
REDIS_URL=redis://127.0.0.1:6379/8 \
nohup npm run gateway > .runtime/remote-gateway.log 2>&1 &

nohup npm run dev -- --host 0.0.0.0 \
  > .runtime/remote-vite.log 2>&1 &

echo "启动完成：http://localhost:5000"