$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $root 'frontend'
$backendDir = Join-Path $root 'backend'

$frontendCommand = @"
Set-Location '$frontendDir'
if (-not (Test-Path 'node_modules')) {
  npm install
}
npm run dev
"@

$backendCommand = @"
Set-Location '$backendDir'
if (-not (Test-Path '.venv')) {
  py -m venv .venv
}
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"@

$frontProcess = Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCommand -WindowStyle Normal -PassThru
$backProcess = Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCommand -WindowStyle Normal -PassThru

Write-Host 'Servicios iniciados en ventanas separadas.'
Write-Host 'Frontend: http://localhost:5173'
Write-Host 'Backend: http://localhost:8000'
Write-Host ''
Write-Host 'Presiona Ctrl+C para cerrar ambos servicios.'
Wait-Process -Id $frontProcess.Id, $backProcess.Id
