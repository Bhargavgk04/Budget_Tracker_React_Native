@echo off
echo ========================================
echo   Deploying Forgot Password Fix
echo ========================================
echo.

echo Step 1: Adding changes to git...
git add .
if errorlevel 1 (
    echo ERROR: Failed to add files
    pause
    exit /b 1
)
echo ✓ Files added
echo.

echo Step 2: Committing changes...
git commit -m "Fix: Add passwordResetOTP fields to User model for forgot password flow"
if errorlevel 1 (
    echo WARNING: Nothing to commit or commit failed
    echo This might be okay if changes were already committed
)
echo ✓ Changes committed
echo.

echo Step 3: Pushing to Render...
echo This will trigger auto-deployment on Render
git push origin main
if errorlevel 1 (
    echo ERROR: Failed to push to remote
    echo Please check your git configuration
    pause
    exit /b 1
)
echo ✓ Pushed to remote
echo.

echo ========================================
echo   Deployment Initiated!
echo ========================================
echo.
echo Next steps:
echo 1. Go to Render Dashboard: https://dashboard.render.com/
echo 2. Watch deployment logs (takes 2-3 minutes)
echo 3. Wait for "Deploy succeeded" message
echo 4. Run: node wake-backend.js
echo 5. Run: node test-complete-flow.js
echo.
pause
