
$root = "C:\Users\palla\Desktop\ParkEase-dev"
$logs = "$root\logs"
if (!(Test-Path $logs)) { New-Item -ItemType Directory $logs }

function Start-Service($path, $name) {
    echo "Starting $name..."
    $dir = "$root\$path"
    $jar = Get-ChildItem -Path "$dir\target" -Filter "*.jar" | Select-Object -First 1
    if ($jar) {
        $log = "$logs\$name.log"
        # Using cmd /c for redirection
        Start-Process cmd -ArgumentList "/c java -DLOG_PATH=$logs -jar $($jar.FullName) > $log 2>&1" -WindowStyle Hidden
    } else {
        echo "Error: Jar not found for $name"
    }
}

Start-Service "discovery-server" "discovery-server"
echo "Waiting 20s for Discovery Server..."
Start-Sleep -s 20

Start-Service "api-gateway" "api-gateway"
Start-Sleep -s 5

$services = @(
    "auth-service",
    "parking-lot-service",
    "parking-spot-service",
    "reservation-service",
    "payment-service",
    "report-service",
    "notification-service",
    "vehicle-service"
)

foreach ($svc in $services) {
    Start-Service "services\$svc" $svc
}
