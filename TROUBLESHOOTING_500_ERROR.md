# Troubleshooting 500 Internal Server Error

## The Problem

You're seeing:
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

This means the **backend server is either not running or crashing**.

---

## Solution Steps

### Step 1: Check if Backend is Running

Open a **new terminal** and run:

```bash
cd backend
node check-server.js
```

**If you see:** ✅ "Backend server is running!" → Skip to Step 3

**If you see:** ❌ "Backend server is NOT running!" → Continue to Step 2

---

### Step 2: Start the Backend Server

#### A. Open a NEW terminal (keep your frontend terminal running)

#### B. Navigate to backend folder
```bash
cd backend
```

#### C. Start the server
```bash
npm start
```

**Expected output:**
```
✓ Email service initialized
✓ Connected to MongoDB successfully
✓ Server running on port 3000
```

**If you see errors:**

**Error: "Cannot find module 'nodemailer'"**
```bash
npm install
```

**Error: "Port 3000 is already in use"**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**Error: "MongoDB connection failed"**
- Check your `.env` file has `MONGODB_URI`
- Verify MongoDB Atlas is accessible

---

### Step 3: Verify Backend is Accessible

Open your browser and go to:
```
https://budget-tracker-react-native-kjff.onrender.com/health
```

**Expected response:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-07T...",
  "database": {
    "status": "connected"
  }
}
```

---

### Step 4: Update Frontend Configuration

#### For Android Physical Device:

1. **Find your computer's IP address:**

   **Windows:**
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.0.125`)

   **Mac/Linux:**
   ```bash
   ifconfig
   ```
   Look for `inet` (e.g., `192.168.0.125`)

2. **Update the frontend code:**

   Edit `frontend/app/utils/constants.ts`:
   ```typescript
   const USE_LOCAL = true; // Change to true
   
   // Update this line with YOUR IP:
   return 'http://192.168.0.125:3000/api'; // ⚠️ YOUR IP HERE
   ```

3. **Reload the app:**
   - Press `r` in Expo terminal
   - Or shake device → "Reload"

#### For Android Emulator:

Edit `frontend/app/utils/constants.ts`:
```typescript
const USE_LOCAL = true;
// Use 10.0.2.2 for emulator
return 'http://10.0.2.2:3000/api';
```

#### For iOS Simulator:

Edit `frontend/app/utils/constants.ts`:
```typescript
const USE_LOCAL = true;
// localhost works for iOS
return 'https://budget-tracker-react-native-kjff.onrender.com/api';
```

---

### Step 5: Alternative - Use Production Backend

If local backend is too much trouble, use the production backend:

Edit `frontend/app/utils/constants.ts`:
```typescript
const USE_LOCAL = false; // Set to false
```

This will use: `https://budget-tracker-react-native-kjff.onrender.com/api`

---

## Quick Checklist

- [ ] Backend server is running (`npm start` in backend folder)
- [ ] Health check works (`https://budget-tracker-react-native-kjff.onrender.com/health`)
- [ ] Frontend has correct API URL
- [ ] Phone and computer on same WiFi (for physical device)
- [ ] Windows Firewall allows port 3000 (for physical device)

---

## Still Not Working?

### Check Backend Logs

Look at the terminal where backend is running. You should see:
```
✓ Email service initialized
✓ Connected to MongoDB successfully
✓ Server running on port 3000
```

**If you see errors**, copy them and check:

1. **Email service errors** → OK to ignore, feature will still work
2. **MongoDB errors** → Check `.env` file
3. **Port errors** → Change port or kill process
4. **Module errors** → Run `npm install`

### Test Backend Directly

```bash
# Test health endpoint
curl https://budget-tracker-react-native-kjff.onrender.com/health

# Test login endpoint
curl -X POST https://budget-tracker-react-native-kjff.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Check Firewall (Windows)

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Find "Node.js" and check both Private and Public
4. If not listed, click "Allow another app" and add Node.js

### Network Issues

**For physical device:**
1. Verify both on same WiFi network
2. Ping your computer from phone (use network tools app)
3. Try accessing `http://YOUR_IP:3000/health` from phone browser
4. If browser works but app doesn't, it's a frontend config issue

---

## Common Mistakes

❌ **Forgot to start backend** → Run `npm start` in backend folder
❌ **Wrong IP address** → Use `ipconfig` to find correct IP
❌ **Firewall blocking** → Allow Node.js through firewall
❌ **Different WiFi networks** → Connect both to same network
❌ **Using localhost on Android** → Use computer's IP instead

---

## Quick Commands Reference

```bash
# Check if backend is running
cd backend
node check-server.js

# Start backend
cd backend
npm start

# Find your IP (Windows)
ipconfig

# Find your IP (Mac/Linux)
ifconfig

# Check what's using port 3000 (Windows)
netstat -ano | findstr :3000

# Check what's using port 3000 (Mac/Linux)
lsof -i :3000

# Kill process on port 3000 (Windows)
taskkill /PID <PID> /F

# Kill process on port 3000 (Mac/Linux)
kill -9 <PID>
```

---

## Need More Help?

1. Check backend terminal for error messages
2. Check frontend terminal for error messages
3. Try using production backend (`USE_LOCAL = false`)
4. Restart both backend and frontend
5. Clear app cache and reload

---

**Most Common Fix:** Just start the backend server! 😊

```bash
cd backend
npm start
```
