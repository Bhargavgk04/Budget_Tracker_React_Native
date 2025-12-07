@echo off
echo Generating keystore...
keytool -genkey -v -keystore budget-tracker.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias budget-tracker-key

echo.
echo Keystore generated. Please copy the following to your gradle.properties file:
echo ---------------------------------------------------
echo MYAPP_UPLOAD_STORE_FILE=budget-tracker.keystore
echo MYAPP_UPLOAD_KEY_ALIAS=budget-tracker-key
echo MYAPP_UPLOAD_STORE_PASSWORD=your_password
echo MYAPP_UPLOAD_KEY_PASSWORD=your_password
echo ---------------------------------------------------

echo.
echo Note: Replace 'your_password' with a secure password of your choice.
pause
