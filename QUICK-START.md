# ⚡ Quick Start Guide

## 🎉 Backend Already Running on Render!

Your backend is **LIVE** and deployed at:
**https://budget-tracker-react-native-kjff.onrender.com**

✅ No need to run backend locally!

---

## 🚀 Start in 2 Steps

### Step 1: Verify Backend is Live
```bash
curl https://budget-tracker-react-native-kjff.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "database": {
    "status": "connected"
  }
}
```

### Step 2: Start Frontend App
```bash
cd frontend
npm start
```

**Expected Output:**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### Step 3: Login & Test
- **Email:** test@example.com
- **Password:** password123

---

## 🧪 Quick Test

### Test Backend Health
```bash
curl https://budget-tracker-react-native-kjff.onrender.com/health
```

### Test Login API
```bash
curl -X POST https://budget-tracker-react-native-kjff.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "...",
    "refreshToken": "..."
  }
}
```

---

## 📱 Mobile Testing

### Android
```bash
cd frontend
npx expo start --android
```

### iOS
```bash
cd frontend
npx expo start --ios
```

### Web
```bash
cd frontend
npx expo start --web
```

---

## 🌐 Important URLs

- **Backend (Render):** https://budget-tracker-react-native-kjff.onrender.com
- **API Base:** https://budget-tracker-react-native-kjff.onrender.com/api
- **Health Check:** https://budget-tracker-react-native-kjff.onrender.com/health
- **Render Dashboard:** https://dashboard.render.com

---

## 🔧 Troubleshooting

### Backend not responding?
1. Check Render dashboard: https://dashboard.render.com
2. Your service should show "Live" status
3. Check logs for any errors
4. Render free tier may sleep after inactivity - first request wakes it up (takes ~30 seconds)

### Frontend can't connect to backend?
Verify `frontend/.env` has:
```
API_URL=https://budget-tracker-react-native-kjff.onrender.com/api
```

### Want to run backend locally for development?
```bash
cd backend
npm run dev
```

Then update `frontend/.env` to:
```
API_URL=http://localhost:3000/api
```

Remember to change it back to Render URL when done!

---

## 📊 Backend Status

Check your backend status anytime:
```bash
curl https://budget-tracker-react-native-kjff.onrender.com/health
```

Response includes:
- ✅ Server status
- ✅ Database connection status
- ✅ Uptime
- ✅ Environment info

---

## 🔐 Test Credentials

**Test User:**
- Email: test@example.com
- Password: password123
- UID: 3A3AAAA9

---

## 📚 More Information

- **Full Status:** See `APPLICATION-STATUS.md`
- **Detailed Checklist:** See `STARTUP-CHECKLIST.md`
- **API Docs:** See `backend/routes/` files

---

## ✅ You're Ready!

Your backend is live on Render and ready to use. Just start the frontend and begin building!

**Backend:** ✅ Live on Render  
**Frontend:** Ready to start  
**Database:** ✅ Connected  

**Start now:** `cd frontend && npm start`
