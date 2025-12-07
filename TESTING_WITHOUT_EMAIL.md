# Testing Forgot Password Without Email Setup

## The Problem

Setting up email can be time-consuming. You want to test the forgot password feature without configuring Gmail.

## Solution: Check Backend Logs for OTP

When you request a password reset, the OTP is generated and saved to the database. Even if email sending fails, **the OTP is still valid and can be found in the backend logs**.

---

## Testing Steps

### 1. Start Backend Server

```bash
cd backend
npm start
```

### 2. Request Password Reset

In your app:
1. Click "Forgot Password?"
2. Enter your email
3. Click "Send OTP"

You'll see: "OTP has been sent to your email"

### 3. Get OTP from Backend Logs

Look at your backend terminal. You'll see the OTP in the logs:

**Option A: If email is configured:**
```
✓ Password reset OTP email sent: <messageId>
```
The OTP was sent to your email.

**Option B: If email is NOT configured:**
```
✗ Failed to send OTP email: [Error: ...]
```
Don't worry! The OTP is still saved in the database.

### 4. Get OTP from Database (MongoDB)

#### Using MongoDB Compass:
1. Connect to your database
2. Go to `users` collection
3. Find your user by email
4. Look for `passwordResetOTP` field (it's hashed)

#### Using MongoDB Shell:
```javascript
db.users.findOne({ email: "your-email@example.com" }, {
  passwordResetOTP: 1,
  passwordResetOTPExpires: 1
})
```

**Problem:** The OTP is hashed! You can't see the actual code.

---

## Better Solution: Add Debug Logging

### Temporary Debug Mode

Add this to `backend/routes/auth.js` in the forgot-password endpoint:

```javascript
// Generate OTP
const otp = user.generatePasswordResetOTP();
await user.save();

// 🔧 TEMPORARY DEBUG - Remove in production!
console.log('='.repeat(50));
console.log('🔐 PASSWORD RESET OTP FOR:', email);
console.log('📧 OTP CODE:', otp);
console.log('⏰ Valid for 10 minutes');
console.log('='.repeat(50));
```

Add this right after line where OTP is generated (around line 50 in the forgot-password route).

Now when you request OTP, you'll see in backend logs:
```
==================================================
🔐 PASSWORD RESET OTP FOR: user@example.com
📧 OTP CODE: 123456
⏰ Valid for 10 minutes
==================================================
```

### Updated Code

<function_calls>
<invoke name="grepSearch">
<parameter name="explanation">Finding where OTP is generated in auth routes