param(
  [Parameter(Mandatory = $true)][string]$Root,
  [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
$rootPath = (Resolve-Path $Root).Path.TrimEnd('\')

$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Output ("Serving " + $rootPath + " at http://localhost:" + $Port + "/")

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.htm'  = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.md'   = 'text/plain; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $reqLine = $reader.ReadLine()
    if ($reqLine -match '^GET\s+(\S+)') {
      $path = [Uri]::UnescapeDataString($matches[1].Split('?')[0])
      if ($path -eq '/') { $path = '/index.html' }
      $rel = $path.TrimStart('/') -replace '/', '\'
      $file = Join-Path $rootPath $rel
      $ok = $false
      if (Test-Path -LiteralPath $file -PathType Leaf) {
        $full = (Resolve-Path -LiteralPath $file).Path
        if ($full.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)) {
          $bytes = [IO.File]::ReadAllBytes($full)
          $ext = [IO.Path]::GetExtension($full).ToLower()
          $ct = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
          $header = "HTTP/1.1 200 OK`r`nContent-Type: $ct`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`nCache-Control: no-cache`r`n`r`n"
          $hb = [Text.Encoding]::ASCII.GetBytes($header)
          $stream.Write($hb, 0, $hb.Length)
          $stream.Write($bytes, 0, $bytes.Length)
          $ok = $true
          Write-Output ("200 " + $path)
        }
      }
      if (-not $ok) {
        $body = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
        $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
        $hb = [Text.Encoding]::ASCII.GetBytes($header)
        $stream.Write($hb, 0, $hb.Length)
        $stream.Write($body, 0, $body.Length)
        Write-Output ("404 " + $path)
      }
    }
    $stream.Flush()
    $stream.Close()
  } catch {
    Write-Output ("ERR " + $_.Exception.Message)
  } finally {
    $client.Close()
  }
}
