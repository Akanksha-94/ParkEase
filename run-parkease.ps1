# run-parkease.ps1
Write-Host "🚀 Starting ParkEase Microservices Ecosystem..." -ForegroundColor Cyan

# Function to start a service
function Start-ParkEaseService($name, $path, $wait) {
    Write-Host "----------------------------------------------------" -ForegroundColor Gray
    Write-Host "Starting $name..." -ForegroundColor Yellow
    Start-Process mvn -ArgumentList "spring-boot:run" -WorkingDirectory $path -NoNewWindow
    Write-Host "Waiting $wait seconds for $name to initialize..." -ForegroundColor DarkGray
    Start-Sleep -Seconds $wait
}

# 1. Eureka Server (The foundation)
Start-ParkEaseService "Eureka Server" "./services/eureka-server" 15

# 2. Independent Microservices
$microservices = @(
    "auth-service", 
    "parking-lot-service", 
    "parking-spot-service", 
    "reservation-service", 
    "payment-service", 
    "vehicle-service", 
    "notification-service", 
    "report-service"
)

foreach ($service in $microservices) {
    Start-ParkEaseService $service "./services/$service" 5
}

# 3. API Gateway (The entry point)
Start-ParkEaseService "API Gateway" "./services/gateway-service" 2

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "✅ All services have been signaled to start!" -ForegroundColor Green
Write-Host "Monitor Eureka Registry: http://localhost:8761" -ForegroundColor Cyan
Write-Host "API Gateway Entry point: http://localhost:8080" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Logs from all services will now stream below..." -ForegroundColor White
