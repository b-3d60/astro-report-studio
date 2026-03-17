#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.studio/pids"
LOG_DIR="$ROOT_DIR/.studio/logs"

mkdir -p "$PID_DIR" "$LOG_DIR"

is_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

pid_by_port() {
  local port="$1"
  lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1
}

spawn_detached() {
  local command="$1"
  local log_file="$2"

  node -e 'const { spawn } = require("child_process");
const fs = require("fs");
const command = process.argv[1];
const logFile = process.argv[2];
const fd = fs.openSync(logFile, "a");
const child = spawn("bash", ["-c", command], {
  detached: true,
  stdio: ["ignore", fd, fd],
});
child.unref();
console.log(child.pid);' "$command" "$log_file"
}

start_process() {
  local name="$1"
  local command="$2"
  local port="$3"
  local pid_file="$4"
  local log_file="$5"

  local listening_pid
  listening_pid="$(pid_by_port "$port" || true)"
  if [[ -n "$listening_pid" ]]; then
    echo "$name laeuft bereits auf Port $port (PID $listening_pid)."
    echo "$listening_pid" > "$pid_file"
    return 0
  fi

  if [[ -f "$pid_file" ]]; then
    local existing_pid
    existing_pid="$(cat "$pid_file" 2>/dev/null || true)"
    if is_running "$existing_pid"; then
      echo "$name laeuft bereits (PID $existing_pid)."
      return 0
    fi
    rm -f "$pid_file"
  fi

  : > "$log_file"
  spawn_detached "$command" "$log_file" >/dev/null

  local pid=""
  for _ in {1..40}; do
    pid="$(pid_by_port "$port" || true)"
    if [[ -n "$pid" ]]; then
      break
    fi
    sleep 0.25
  done

  if [[ -n "$pid" ]] && is_running "$pid"; then
    echo "$pid" > "$pid_file"
    echo "$name gestartet auf Port $port (PID $pid). Log: $log_file"
  else
    echo "Konnte $name nicht starten. Letzte Log-Zeilen:"
    tail -n 20 "$log_file" || true
    return 1
  fi
}

SERVER_PID_FILE="$PID_DIR/server.pid"
APP_PID_FILE="$PID_DIR/app.pid"

start_process "Datenserver" "cd '$ROOT_DIR' && npm run dev:data" "3001" "$SERVER_PID_FILE" "$LOG_DIR/server.log"
if ! start_process "Layout Studio" "cd '$ROOT_DIR' && npm run dev" "3000" "$APP_PID_FILE" "$LOG_DIR/app.log"; then
  bash "$ROOT_DIR/scripts/stop-studio.sh" >/dev/null 2>&1 || true
  exit 1
fi

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [[ -n "$LAN_IP" ]]; then
  echo ""
  echo "Layout Studio: http://$LAN_IP:3000"
  echo "Datenserver:   http://$LAN_IP:3001"
else
  echo ""
  echo "Layout Studio: http://localhost:3000"
  echo "Datenserver:   http://localhost:3001"
fi
