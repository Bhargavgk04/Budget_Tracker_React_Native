Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploying Forgot Password Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Adding changes to git..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to add files" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Files added" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Committing changes..." -ForegroundColor Yellow
git commit -m "Fix: Add passwordResetOTP fields to User model for forgot password flow"
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Nothing to commit or commit failed" -ForegroundColor Yellow
    Write-Host "This might be okay if changes were already committed" -ForegroundColor Yellow
}
Write-Host "✓ Changes committed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Pushing to Render..." -ForegroundColor Yellow
Write-Host "This will trigger auto-deployment on Render" -ForegroundColor Gray
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to push to remote" -ForegroundColor Red
    Write-Host "Please check your git configuration" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Pushed to remote" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment Initiated!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Render Dashboard: https://dashboard.render.com/" -ForegroundColor White
Write-Host "2. Watch deployment logs (takes 2-3 minutes)" -ForegroundColor White
Write-Host "3. Wait for 'Deploy succeeded' message" -ForegroundColor White
Write-Host "4. Run: node wake-backend.js" -ForegroundColor White
Write-Host "5. Run: node test-complete-flow.js" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
