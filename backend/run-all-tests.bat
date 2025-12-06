@echo off
echo ============================================================
echo TRANSACTION AND SPLIT TESTING SUITE
echo ============================================================
echo.

echo Step 1: Creating test users...
echo ------------------------------------------------------------
node create-test-users.js
echo.

echo Step 2: Checking initial database status...
echo ------------------------------------------------------------
node check-database-status.js
echo.

echo Step 3: Running simple transaction tests...
echo ------------------------------------------------------------
node test-simple-transaction.js
echo.

echo Step 4: Checking final database status...
echo ------------------------------------------------------------
node check-database-status.js
echo.

echo ============================================================
echo TESTING COMPLETE!
echo ============================================================
echo.
echo Next steps:
echo 1. Review the output above for any errors
echo 2. If all tests passed, your system is working correctly!
echo 3. (Optional) Run test-transaction-split.js for full API tests
echo.
pause
