$ErrorActionPreference = "Stop"

$base = $env:SMOKE_URL
if (-not $base) {
  $base = "http://127.0.0.1:8090"
}

$checks = @(
  "/",
  "/api/health",
  "/api/rss.xml",
  "/api/sitemap.xml",
  "/robots.txt"
)

foreach ($path in $checks) {
  $url = "$base$path"
  $response = Invoke-WebRequest -UseBasicParsing $url
  if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
    throw "Smoke check failed for $url with status $($response.StatusCode)"
  }
  Write-Host "ok $url"
}
