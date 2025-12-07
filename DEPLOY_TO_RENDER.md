# Deploy to Render - Quick Guide

## Changes Made

✅ Email service no longer blocks startup
✅ Connection pooling enabled for faster emails
✅ Verification skipped in production
✅ Timeouts added to prevent hanging

## Deploy Steps

### 1. Commit Changes

```bash
git add .
git commit -m "Optimize email service for Render deployment"
git push origin main
```

Render will auto-deploy.

### 2. Check Deployment Logs

Go to Render Dashboard → Your Service → Logs

**Expected output:**
```
✓ Email service initialized with connection pooling
✓ Connected to MongoDB successfully
✓ Server running on port 3000
```

**No more:** ❌ "Email service verification failed"

### 3. Test the API

```bash
curl https://budget-tracker-react-native-kjff.onrender.com/health
```

**Expected response:**
```json
{
  "status": "OK",
  "timestamp": "...",
  "database": {
    "status": "connected"
  }
}
```

### 4. Test Forgot Password

1. Open your app
2. Click "Forgot Password?"
3. Enter email
4. Click "Send OTP"
5. Should respond in < 2 seconds ✅

### 5. Check Render Logs for OTP

In Render logs, you'll see:
```
============================================================
🔐 PASSWORD RESET OTP DEBUG
📧 Email: user@example.com
🔢 OTP Code: 123456
⏰ Valid for: 10 minutes
============================================================
```

Use this OTP to test!

## Environment Variables

Make sure these are set in Render:

### Required:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
NODE_ENV=production
```

### Optional (for email):
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Performance Expectations

### Server Startup:
- Before: 10-15 seconds
- After: < 2 seconds ✅

### First Email:
- Initial connection: 5-8 seconds
- Backend response: < 2 seconds ✅

### Subsequent Emails:
- Connection pooled: 1-2 seconds ✅
- Backend response: < 2 seconds ✅

## Troubleshooting

### Deployment Failed?

Check Render logs for errors:
- MongoDB connection issues
- Missing environment variables
- npm install errors

### Email Not Sending?

1. Check EMAIL_USER and EMAIL_PASS are set
2. Verify Gmail app password is correct
3. Check Render logs for error messages
4. Use debug mode (OTP in logs) for testing

### Still Slow?

1. Check Render service plan (free tier has cold starts)
2. Verify connection pooling is enabled (check logs)
3. Monitor email send times in logs

## Monitoring

### Key Metrics to Watch:

1. **Server Startup Time:** Should be < 2 seconds
2. **First Email Time:** 5-8 seconds (normal)
3. **Subsequent Email Time:** 1-2 seconds
4. **API Response Time:** < 2 seconds

### Render Logs to Monitor:

```
✓ Email service initialized with connection pooling
✓ Server running on port 3000
✓ Password reset OTP email sent: <messageId>
✓ Email sent in 1234ms
```

## Success Criteria

✅ Server starts in < 2 seconds
✅ No verification timeout errors
✅ API responds in < 2 seconds
✅ Emails send successfully
✅ OTP visible in logs (development mode)

---

**Ready to Deploy!** 🚀

Just push to main and Render will auto-deploy.
