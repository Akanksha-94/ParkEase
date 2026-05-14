#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PIDS_FILE="$ROOT_DIR/.pids"

CMD=$1

if [ -z "$CMD" ]; then
  echo "Usage: ./parkease.sh [build|start|stop|clean|sonar]"
  exit 1
fi

build_all() {
    echo "=========================================="
    echo " ParkEase — Building all modules"
    echo "=========================================="
    local modules=(
        "discovery-server"
        "api-gateway"
        "services/auth-service"
        "services/parking-lot-service"
        "services/parking-spot-service"
        "services/reservation-service"
        "services/payment-service"
        "services/report-service"
        "services/notification-service"
        "services/vehicle-service"
    )
    for mod in "${modules[@]}"; do
        local dir="$ROOT_DIR/$mod"
        local name=$(basename "$mod")
        echo "▶ Building $name ..."
        (cd "$dir" && mvn -Dmaven.repo.local="$ROOT_DIR/.m2" clean package -DskipTests -q)
        echo "  ✓ $name built"
    done
    echo "=========================================="
    echo " ✅  All modules built successfully!"
    echo "=========================================="
}

cleanup_ports() {
    echo "Cleaning up ports (8080-8088, 8761)..."
    local ports=(8761 8080 8081 8082 8083 8084 8085 8086 8087 8088)
    for port in "${ports[@]}"; do
        # Use lsof -ti if available, otherwise just skip
        if command -v lsof >/dev/null 2>&1; then
            local pids=$(lsof -ti :$port)
            if [ ! -z "$pids" ]; then
                for pid in $pids; do
                    echo "  Killing process $pid on port $port"
                    kill -9 $pid 2>/dev/null || true
                done
            fi
        fi
    done
}

start_all() {
    cleanup_ports
    > "$PIDS_FILE"
    start_service() {
        local dir="$1"
        local name="$2"
        local logs_dir="$ROOT_DIR/logs"
        mkdir -p "$logs_dir"
        local log="$logs_dir/$name.log"
        echo "▶ Starting $name..."
        (cd "$dir" && java -DLOG_PATH="$logs_dir" -jar target/*.jar > "$log" 2>&1 &)
        echo $! >> "$PIDS_FILE"
        echo "  PID $! — log: $log"
    }

    echo "Starting Discovery Server..."
    start_service "$ROOT_DIR/discovery-server" "discovery-server"
    echo "Waiting 20s for Eureka to boot..."
    sleep 20

    echo "Starting API Gateway..."
    start_service "$ROOT_DIR/api-gateway" "api-gateway"
    sleep 5

    echo "Starting microservices..."
    local services=(
        "auth-service"
        "parking-lot-service"
        "parking-spot-service"
        "reservation-service"
        "payment-service"
        "report-service"
        "notification-service"
        "vehicle-service"
    )
    for svc in "${services[@]}"; do
        start_service "$ROOT_DIR/services/$svc" "$svc"
    done

    echo ""
    echo "✅  All services started. Gateway: http://localhost:8080"
    echo "📊 Eureka dashboard: http://localhost:8761"
    echo "PIDs stored in: $PIDS_FILE"
}

stop_all() {
    if [ ! -f "$PIDS_FILE" ]; then
        echo "No .pids file found. Nothing to stop."
        return
    fi
    echo "Stopping all ParkEase services..."
    while read -r pid; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo "  Stopped PID $pid"
        fi
    done < "$PIDS_FILE"
    rm -f "$PIDS_FILE"
    echo "✅ All services stopped."
}

clean_all() {
    local modules=(
        "discovery-server"
        "api-gateway"
        "services/auth-service"
        "services/parking-lot-service"
        "services/parking-spot-service"
        "services/reservation-service"
        "services/payment-service"
        "services/report-service"
        "services/notification-service"
        "services/vehicle-service"
    )
    for mod in "${modules[@]}"; do
        local dir="$ROOT_DIR/$mod"
        local name=$(basename "$mod")
        echo "Cleaning $name..."
        (cd "$dir" && mvn -Dmaven.repo.local="$ROOT_DIR/.m2" clean -q)
    done
    echo "✅ All modules cleaned."
}

sonar_analysis() {
    echo "=========================================="
    echo " ParkEase — Running SonarQube Analysis"
    echo "=========================================="
    local modules=(
        "discovery-server"
        "api-gateway"
        "services/auth-service"
        "services/parking-lot-service"
        "services/parking-spot-service"
        "services/reservation-service"
        "services/payment-service"
        "services/report-service"
        "services/notification-service"
        "services/vehicle-service"
    )
    for mod in "${modules[@]}"; do
        local dir="$ROOT_DIR/$mod"
        local name=$(basename "$mod")
        echo "▶ Analyzing $name ..."
        (cd "$dir" && mvn -Dmaven.repo.local="$ROOT_DIR/.m2" sonar:sonar -q)
    done
    echo "=========================================="
    echo " ✅  All modules analyzed successfully!"
    echo "=========================================="
}

case $CMD in
  build)
    build_all
    ;;
  start)
    start_all
    ;;
  stop)
    stop_all
    ;;
  clean)
    clean_all
    ;;
  sonar)
    sonar_analysis
    ;;
  *)
    echo "Unknown command: $CMD"
    echo "Usage: ./parkease.sh [build|start|stop|clean|sonar]"
    exit 1
    ;;
esac
