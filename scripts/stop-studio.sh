#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.studio/pids"

stop_from_pid_file() {
  local name="$1"
  local pid_file="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "$name: keine PID-Datei gefunden."
    return 0
  fi

  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  rm -f "$pid_file"

  if [[ -z "$pid" ]]; then
    echo "$name: PID-Datei war leer."
    return 0
  fi

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    for _ in {1..20}; do
      if ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
      sleep 0.1
    done
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
    echo "$name gestoppt (PID $pid)."
  else
    echo "$name lief nicht mehr (PID $pid)."
  fi
}

kill_by_port_if_needed() {
  local name="$1"
  local port="$2"

  local pids
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "$name ueber Port $port beenden: $pids"
    echo "$pids" | xargs kill 2>/dev/null || true
  fi
}

stop_from_pid_file "Layout Studio" "$PID_DIR/app.pid"
stop_from_pid_file "Datenserver" "$PID_DIR/server.pid"

kill_by_port_if_needed "Layout Studio" "3000"
kill_by_port_if_needed "Datenserver" "3001"

echo "Stop abgeschlossen."
