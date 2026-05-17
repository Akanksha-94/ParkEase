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
load_env() {
    local env_file="$ROOT_DIR/.env"
    if [ -f "$env_file" ]; then
        echo "Loading centralized environment variables from .env ..."
        while IFS= read -r line || [ -n "$line" ]; do
            # Ignore comments and empty lines
            [[ "$line" =~ ^[[:space:]]*# ]] && continue
            [[ "$line" =~ ^[[:space:]]*$ ]] && continue
            
            # Extract key and value
            if [[ "$line" =~ ^[[:space:]]*([^=[:space:]]+)[[:space:]]*=[[:space:]]*(.*)[[:space:]]*$ ]]; then
                local key="${BASH_REMATCH[1]}"
                local val="${BASH_REMATCH[2]}"
                # Strip trailing whitespace and surrounding quotes
                val=$(echo "$val" | sed -e 's/[[:space:]]*$//')
                val="${val#\"}"
                val="${val%\"}"
                val="${val#\'}"
                val="${val%\'}"
                export "$key"="$val"
            fi
        done < "$env_file"
    else
        echo "⚠️  Warning: Centralized .env file not found at $env_file. Using system env."
    fi
}

start_all() {
    load_env
    export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-dev}"
    echo "Starting ParkEase under active profile: $SPRING_PROFILES_ACTIVE"
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
    # Discovery Server uses PORT (default 8761)
    (
        export PORT="${PORT:-8761}"
        start_service "$ROOT_DIR/discovery-server" "discovery-server"
    )
    echo "Waiting 20s for Eureka to boot..."
    sleep 20

    echo "Starting API Gateway..."
    # API Gateway uses GATEWAY_PORT (default 8080)
    (
        export GATEWAY_PORT="${GATEWAY_PORT:-8080}"
        start_service "$ROOT_DIR/api-gateway" "api-gateway"
    )
    sleep 5

    echo "Starting microservices..."
    local services=(
        "auth-service:AUTH_PORT:8081"
        "parking-lot-service:LOTS_PORT:8082"
        "parking-spot-service:SPOTS_PORT:8083"
        "reservation-service:RESERVATIONS_PORT:8084"
        "payment-service:PAYMENTS_PORT:8085"
        "report-service:REPORTS_PORT:8086"
        "notification-service:NOTIFICATIONS_PORT:8087"
        "vehicle-service:VEHICLES_PORT:8088"
    )
    for svc_info in "${services[@]}"; do
        IFS=':' read -r svc var default <<< "$svc_info"
        local val="${!var}"
        (
            export SERVER_PORT="${val:-$default}"
            start_service "$ROOT_DIR/services/$svc" "$svc"
        )
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
