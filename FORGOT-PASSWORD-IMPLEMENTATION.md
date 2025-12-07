# Forgot Password Implementation Guide

## Overview
This document explains the complete forgot password flow using OTP (One-Time Password) verification.

## Current Issue
- **Error**: HTTP 502 from backend
- **Cause**: Render free tier backend is sleeping or having connectivity issues
- **Solution**: Wake up the backend or wait for it to restart

## Complete Flow

### 1. User Enters Email (ForgotPasswordScreen)
```
User enters email → Frontend calls /auth/send-otp → Backend sends OTP to email
```

### 2. User Enters OTP (OTPVerificationScreen)
```
User enters 6-digit OTP → Frontend calls /auth/verify-otp → Backend verifies OTP
```

### 3. User Sets New Password (ResetPasswordScreen)
```
User enters new password → Frontend calls /auth/reset-password-otp → Password reset complete
```

## Backend Endpoints

### 1. Send OTP
**Endpoint**: `POST /api/auth/send-otp`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "otp": "123456"  // Only in development mode
}
```

**Implementation**: `backend/routes/auth.js` (line 378-420)

### 2. Verify OTP
**Endpoint**: `POST /api/auth/verify-otp`

**Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

**Implementation**: `backend/routes/auth.js` (line 422-455)

### 3. Reset Password with OTP
**Endpoint**: `POST /api/auth/reset-password-otp`

**Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Implementation**: `backend/routes/auth.js` (line 457-527)

## Frontend Implementation

### Files Modified

1. **frontend/app/utils/constants.ts**
   - Updated `API_ENDPOINTS.AUTH.SEND_OTP` to `/auth/send-otp`
   - Updated `API_ENDPOINTS.AUTH.RESET_PASSWORD` to `/auth/reset-password-otp`

2. **frontend/app/context/AuthContext.tsx**
   - `forgotPassword()` now calls `/auth/send-otp`
   - `resetPassword()` now calls `/auth/reset-password-otp`

3. **frontend/app/screens/auth/ForgotPasswordScreen.tsx**
   - Collects user email
   - Calls `forgotPassword(email)`
   - Navigates to OTPVerificationScreen

4. **frontend/app/screens/auth/OTPVerificationScreen.tsx**
   - Collects 6-digit OTP
   - Calls `verifyOTP(email, otp)`
   - Navigates to ResetPasswordScreen

5. **frontend/app/screens/auth/ResetPasswordScreen.tsx**
   - Collects new password and confirmation
   - Calls `resetPassword(email, otp, newPassword)`
   - Navigates to Login screen

## Backend Email Configuration

The backend uses Gmail SMTP to send OTP emails. Configuration in `backend/.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=thakurkakashi@gmail.com
EMAIL_PASS=xwvg ekaz yvnu vbcl
```

**Email Service**: `backend/services/emailService.js`
- Sends beautifully formatted OTP emails
- OTP expires in 10 minutes
- Professional email template with security tips

## Testing the Flow

### Option 1: Use the Test Script
```bash
node test-forgot-password-flow.js
```

This will:
1. Send OTP to the test email
2. Display the OTP (in development mode)
3. Show next steps

### Option 2: Test in the App

1. **Start the app**:
   ```bash
   cd frontend
   npm start
   ```

2. **Navigate to Login** → Click "Forgot Password?"

3. **Enter your email**: `bhargavkatkam0@gmail.com`

4. **Check your email** for the OTP code

5. **Enter the OTP** in the app

6. **Set new password** and confirm

7. **Login** with new password

## Troubleshooting

### 502 Bad Gateway Error

**Cause**: Render free tier backend is sleeping

**Solutions**:
1. **Wake up the backend**: Visit the backend URL in browser
   ```
   https://budget-tracker-react-native-kjff.onrender.com/api
   ```

2. **Wait 30-60 seconds** for the backend to start

3. **Try again** after backend is awake

### OTP Not Received

**Possible causes**:
1. Email service not configured properly
2. Email in spam folder
3. Backend error sending email

**Solutions**:
1. Check spam/junk folder
2. Check backend logs for email errors
3. In development mode, OTP is returned in API response

### Invalid OTP Error

**Possible causes**:
1. OTP expired (10 minutes)
2. Wrong OTP entered
3. OTP already used

**Solutions**:
1. Request new OTP
2. Check email for correct OTP
3. Ensure OTP is entered within 10 minutes

## Security Features

1. **OTP Expiration**: 10 minutes
2. **One-time use**: OTP is cleared after successful reset
3. **Hashed storage**: OTP is hashed in database
4. **Rate limiting**: Prevents brute force attacks
5. **Session invalidation**: All sessions logged out after password reset
6. **Email notification**: User receives confirmation email

## API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Development vs Production

### Development Mode
- OTP returned in API response
- Detailed error messages
- Console logging enabled

### Production Mode
- OTP only sent via email
- Generic error messages
- Minimal logging

## Next Steps

1. **Wake up the backend** by visiting the URL
2. **Test the flow** using the app
3. **Check email** for OTP
4. **Reset password** successfully

## Support

If you encounter issues:
1. Check backend logs on Render dashboard
2. Verify email configuration
3. Test with the provided test script
4. Check network connectivity

---

**Last Updated**: December 7, 2025
**Backend URL**: https://budget-tracker-react-native-kjff.onrender.com/api
**Test Email**: bhargavkatkam0@gmail.com
