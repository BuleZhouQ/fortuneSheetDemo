#!/usr/bin/env bash
set -e

ROOT=/home/kasm-user/fortune-sheet-collab-demo
RUNTIME="$ROOT/.runtime"

cd "$ROOT"
mkdir -p "$RUNTIME"

echo "[1/4] Starting MongoDB and Redis..."
docker compose up -d mongo redis

echo "[2/4] Stopping previous development processes..."
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "gateway/server.mjs" 2>/dev/null || true
pkill -f "vite.*--host" 2>/dev/null || true
sleep 1

echo "[3/4] Starting Spring Boot, Gateway and Vite..."
cd "$ROOT/server-spring"
nohup env JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 PATH=/usr/lib/jvm/java-17-openjdk-amd64/bin:$PATH SPRING_DATA_MONGODB_URI=mongodb://127.0.0.1:27017/fortune_sheet_collab SERVER_PORT=8083 mvn spring-boot:run > "$RUNTIME/spring.log" 2>&1 &
echo $! > "$RUNTIME/spring.pid"

cd "$ROOT"
nohup env MONGODB_URI=mongodb://127.0.0.1:27017/fortune_sheet_collab REDIS_URL=redis://127.0.0.1:6379/8 npm run gateway > "$RUNTIME/gateway.log" 2>&1 &
echo $! > "$RUNTIME/gateway.pid"

nohup npm run dev -- --host 0.0.0.0 > "$RUNTIME/vite.log" 2>&1 &
echo $! > "$RUNTIME/vite.pid"

echo "[4/4] Development services submitted."
echo "Frontend: http://localhost:5000"
echo "Spring:   http://localhost:8083"
echo "Gateway:  http://localhost:8082"
echo "Logs:     $RUNTIME"
echo "Follow:   tail -f $RUNTIME/spring.log $RUNTIME/gateway.log $RUNTIME/vite.log"
