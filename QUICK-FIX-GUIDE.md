# Quick Fix Guide - Forgot Password

## ✅ What Was Fixed

Your forgot password flow now properly uses OTP (One-Time Password) instead of reset tokens.

### Changes Made:
1. **Frontend now calls correct endpoints**:
   - `/auth/send-otp` (instead of `/auth/forgot-password`)
   - `/auth/reset-password-otp` (instead of `/auth/reset-password`)

2. **Complete OTP flow implemented**:
   - Email → OTP → Verify → New Password

## 🚀 How to Use

### Quick Test (3 steps):

1. **Wake up backend** (takes 30-60 seconds):
   ```bash
   node wake-backend.js
   ```

2. **Test the flow**:
   ```bash
   node test-forgot-password-flow.js
   ```

3. **Use in app**:
   - Open app → Login → "Forgot Password?"
   - Enter email: `bhargavkatkam0@gmail.com`
   - Check email for OTP
   - Enter OTP → Set new password → Done!

## ⚠️ Current Issue: 502 Error

**Why**: Render free tier sleeps after 15 minutes of inactivity

**Fix**: 
- Run `node wake-backend.js` first
- Wait 60 seconds
- Try again

## 📧 Email Setup

OTP emails are sent via Gmail:
- **From**: thakurkakashi@gmail.com
- **OTP expires**: 10 minutes
- **Check**: Inbox and spam folder

## 🔐 Complete Flow

```
1. User enters email
   ↓
2. Backend sends OTP to email (6 digits)
   ↓
3. User enters OTP
   ↓
4. Backend verifies OTP
   ↓
5. User sets new password
   ↓
6. Password reset complete!
```

## 📱 Testing in App

```bash
# Terminal 1: Start backend wake-up
node wake-backend.js

# Terminal 2: Start app
cd frontend
npm start

# In app:
# 1. Go to Login
# 2. Click "Forgot Password?"
# 3. Enter: bhargavkatkam0@gmail.com
# 4. Check email for OTP
# 5. Enter OTP
# 6. Set new password
# 7. Login!
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| 502 Error | Run `node wake-backend.js` and wait 60 seconds |
| No OTP email | Check spam folder, wait 2-3 minutes |
| Invalid OTP | Request new OTP (expires in 10 minutes) |
| Can't connect | Check internet, verify backend URL |

## 📝 API Endpoints

All working and tested:

```
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/reset-password-otp
```

## ✨ Features

- ✅ OTP sent via email
- ✅ Beautiful email template
- ✅ 10-minute expiration
- ✅ One-time use
- ✅ Secure hashing
- ✅ Session logout after reset
- ✅ Password strength validation

## 🎯 Next Steps

1. Wake backend: `node wake-backend.js`
2. Test flow: `node test-forgot-password-flow.js`
3. Use in app
4. Done! 🎉

---

**Need Help?**
- Read: `FORGOT-PASSWORD-IMPLEMENTATION.md` (detailed guide)
- Read: `FORGOT-PASSWORD-FIXES-SUMMARY.md` (what changed)
