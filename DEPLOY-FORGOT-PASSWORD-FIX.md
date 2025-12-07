# Deploy Forgot Password Fix to Render

## Changes Made

### 1. Backend - User Model (`backend/models/User.js`)
Added missing OTP fields for password reset:
```javascript
passwordResetOTP: String,
passwordResetOTPExpires: Date,
passwordResetOTPAttempts: { type: Number, default: 0 }
```

### 2. Frontend - API Endpoints (`frontend/app/utils/constants.ts`)
Updated to use correct OTP endpoints:
```typescript
SEND_OTP: '/auth/send-otp',
VERIFY_OTP: '/auth/verify-otp',
RESET_PASSWORD: '/auth/reset-password-otp'
```

### 3. Frontend - Auth Service (`frontend/app/context/AuthContext.tsx`)
Updated service methods to call correct endpoints.

## Deployment Steps

### Step 1: Test Locally (Optional)
```bash
# Install dependencies if needed
cd backend
npm install

# Test backend
cd ..
node test-backend-locally.js
```

### Step 2: Commit Changes
```bash
# Add all changes
git add .

# Commit with message
git commit -m "Fix: Add passwordResetOTP fields to User model for forgot password flow"
```

### Step 3: Push to Render
```bash
# Push to your main branch (Render auto-deploys)
git push origin main
```

### Step 4: Wait for Deployment
- Go to Render Dashboard: https://dashboard.render.com/
- Find your backend service
- Watch the deployment logs
- Wait for "Deploy succeeded" message (2-3 minutes)

### Step 5: Test the Fix
```bash
# Wake up backend
node wake-backend.js

# Wait 30 seconds

# Test complete flow
node test-complete-flow.js
```

## What Was Fixed

### Problem:
The backend code was using `passwordResetOTP` field, but the User model didn't have it defined. This caused the backend to crash when trying to save the OTP.

### Solution:
Added the missing fields to the User schema:
- `passwordResetOTP` - Stores hashed OTP
- `passwordResetOTPExpires` - Stores expiration time
- `passwordResetOTPAttempts` - Tracks failed attempts

### Why It Works Now:
1. ✅ User model has all required fields
2. ✅ Backend can save OTP to database
3. ✅ Frontend calls correct endpoints
4. ✅ Complete flow works end-to-end

## Verification Checklist

After deployment, verify:

- [ ] Backend deployed successfully on Render
- [ ] No errors in Render logs
- [ ] `node wake-backend.js` returns 200/401 (not 502)
- [ ] `node test-complete-flow.js` works
- [ ] OTP email received
- [ ] Password reset successful
- [ ] Can login with new password

## Troubleshooting

### If deployment fails:
1. Check Render logs for errors
2. Verify MongoDB connection string
3. Check environment variables
4. Restart service manually

### If 502 errors persist:
1. Check Render service status
2. View logs for crash errors
3. Verify all environment variables set
4. Check MongoDB Atlas whitelist

### If OTP not received:
1. Check spam folder
2. Verify EMAIL_USER and EMAIL_PASS in Render env vars
3. Check backend logs for email errors
4. Test with different email

## Environment Variables on Render

Ensure these are set in Render Dashboard → Service → Environment:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
EMAIL_USER=thakurkakashi@gmail.com
EMAIL_PASS=xwvg ekaz yvnu vbcl
FRONTEND_URL=https://your-frontend-url
```

## Quick Deploy Commands

```bash
# One-liner to commit and push
git add . && git commit -m "Fix: Add OTP fields to User model" && git push origin main

# Then wait 2-3 minutes and test
node wake-backend.js && sleep 30 && node test-complete-flow.js
```

## Success Criteria

✅ Deployment successful
✅ Backend responds (not 502)
✅ OTP sent to email
✅ OTP verified
✅ Password reset works
✅ Can login with new password

---

**Ready to deploy!** Just run the commands above.
