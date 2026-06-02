$ErrorActionPreference = "Stop"
$ServerIP = "rentalman.online"
$SSHUser = "ubuntu"
$SSHKey = "~/.ssh/ssh-key-2026-02-26.key"

Write-Host "Starting deployment to Oracle Server ($ServerIP)..." -ForegroundColor Cyan

# 1. Build local frontend
Write-Host "Building frontend locally..." -ForegroundColor Yellow
Push-Location -Path ".\frontend"
try {
    npm install
    npm run build
} finally {
    Pop-Location
}

if (-not (Test-Path ".\frontend\dist\index.html")) {
    Write-Error "Frontend build failed! Missing dist\index.html."
    exit 1
}
Write-Host "Frontend built successfully." -ForegroundColor Green

# 2. Update code and backend on the server
Write-Host "Pulling latest code and updating backend..." -ForegroundColor Yellow
$sshCmd = "cd ~/rent_automation && git pull origin main && ./venv/bin/pip install -r requirements.txt && (./venv/bin/alembic upgrade head || true)"
ssh -i $SSHKey -o StrictHostKeyChecking=no ${SSHUser}@${ServerIP} "$sshCmd"
Write-Host "Backend code updated and migrated." -ForegroundColor Green

# 3. Upload frontend files
Write-Host "Uploading frontend files..." -ForegroundColor Yellow
ssh -i $SSHKey -o StrictHostKeyChecking=no ${SSHUser}@${ServerIP} "rm -rf ~/rent_automation/frontend/dist"
scp -i $SSHKey -o StrictHostKeyChecking=no -r .\frontend\dist ${SSHUser}@${ServerIP}:~/rent_automation/frontend/
Write-Host "Frontend files uploaded." -ForegroundColor Green

# 4. Deploy frontend to Nginx and restart API
Write-Host "Deploying to Nginx and restarting API..." -ForegroundColor Yellow
$sshCmd2 = "sudo cp -r ~/rent_automation/frontend/dist/* /var/www/rent_automation/dist/ && cd ~/rent_automation && pkill -f uvicorn ; sleep 2 ; nohup ./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 > err.log 2>&1 &"
ssh -i $SSHKey -o StrictHostKeyChecking=no ${SSHUser}@${ServerIP} "$sshCmd2"
Write-Host "Backend API restarted." -ForegroundColor Green

Write-Host "Deployment completed successfully!" -ForegroundColor Cyan
