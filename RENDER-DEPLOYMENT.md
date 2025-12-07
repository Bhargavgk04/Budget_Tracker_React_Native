# 🚀 Render Deployment Guide

## ✅ Your Backend is Already Deployed!

**Live URL:** https://budget-tracker-react-native-kjff.onrender.com

---

## 🌐 Quick Verification

### Check if Backend is Live
Open in browser or use curl:
```
https://budget-tracker-react-native-kjff.onrender.com/health
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

---

## 📋 Render Configuration

Your backend is configured with:

### Service Details
- **Service Name:** budget-tracker-backend
- **Type:** Web Service
- **Plan:** Free
- **Region:** Auto-selected
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Environment Variables (Already Set)
- ✅ `NODE_ENV` = production
- ✅ `MONGODB_URI` = Your MongoDB Atlas connection
- ✅ `JWT_SECRET` = Auto-generated
- ✅ `JWT_REFRESH_SECRET` = Auto-generated
- ✅ `FRONTEND_URL` = Your frontend URL
- ✅ `EMAIL_USER` = Your Gmail
- ✅ `EMAIL_PASS` = Your Gmail app password

### Health Check
- **Path:** `/health`
- **Status:** ✅ Enabled

---

## 🔄 How Render Works

### Free Tier Behavior
- ✅ Your backend is always accessible
- ⚠️ **Sleeps after 15 minutes of inactivity**
- ⏱️ **Takes ~30 seconds to wake up** on first request
- ✅ Subsequent requests are instant

### Auto-Deploy
- ✅ Enabled
- 🔄 Automatically deploys when you push to your Git repository

---

## 🛠️ Managing Your Render Service

### Access Render Dashboard
1. Go to: https://dashboard.render.com
2. Find your service: **budget-tracker-backend**
3. View logs, metrics, and settings

### View Logs
```
Dashboard → Your Service → Logs
```

### Restart Service
```
Dashboard → Your Service → Manual Deploy → Deploy latest commit
```

### Update Environment Variables
```
Dashboard → Your Service → Environment → Add/Edit Variables
```

---

## 📱 Frontend Configuration

Your frontend is already configured to use Render backend!

**File:** `frontend/.env`
```env
API_URL=https://budget-tracker-react-native-kjff.onrender.com/api
```

✅ No changes needed!

---

## 🧪 Testing Your Render Backend

### Method 1: Browser
Open these URLs in your browser:
- Health: https://budget-tracker-react-native-kjff.onrender.com/health
- Root: https://budget-tracker-react-native-kjff.onrender.com/

### Method 2: Command Line
```bash
# Health check
curl https://budget-tracker-react-native-kjff.onrender.com/health

# Test login
curl -X POST https://budget-tracker-react-native-kjff.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Method 3: Test Script
```bash
node test-render-backend.js
```

---

## 🔧 Troubleshooting

### Backend is slow to respond
**Cause:** Free tier sleeps after inactivity  
**Solution:** Wait 30 seconds for first request, then it's fast

### Backend shows "Service Unavailable"
**Cause:** Deployment in progress or failed  
**Solution:** 
1. Check Render dashboard
2. View logs for errors
3. Redeploy if needed

### Database connection errors
**Cause:** MongoDB URI issue  
**Solution:**
1. Check MongoDB Atlas is accessible
2. Verify IP whitelist (should be 0.0.0.0/0)
3. Check connection string in Render environment variables

### CORS errors in frontend
**Cause:** Frontend URL not in CORS whitelist  
**Solution:** Update `FRONTEND_URL` in Render environment variables

---

## 🚀 Deploying Updates

### Automatic Deployment (Recommended)
1. Make changes to your code
2. Commit and push to Git
3. Render automatically deploys

```bash
git add .
git commit -m "Your update message"
git push origin main
```

### Manual Deployment
1. Go to Render dashboard
2. Select your service
3. Click "Manual Deploy"
4. Choose "Deploy latest commit"

---

## 📊 Monitoring

### Check Service Status
```
Dashboard → Your Service → Overview
```

Shows:
- ✅ Service status (Live/Building/Failed)
- 📈 CPU and Memory usage
- 🌐 Request metrics
- 📝 Recent logs

### View Logs in Real-Time
```
Dashboard → Your Service → Logs
```

---

## 💰 Render Free Tier Limits

- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ Automatic HTTPS
- ✅ Custom domains
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ 512 MB RAM
- ⚠️ 0.1 CPU

**Your current usage:** Well within limits ✅

---

## 🎯 Important URLs

| Purpose | URL |
|---------|-----|
| Backend Home | https://budget-tracker-react-native-kjff.onrender.com |
| Health Check | https://budget-tracker-react-native-kjff.onrender.com/health |
| API Base | https://budget-tracker-react-native-kjff.onrender.com/api |
| Render Dashboard | https://dashboard.render.com |

---

## ✅ Checklist

- [x] Backend deployed on Render
- [x] Database connected (MongoDB Atlas)
- [x] Environment variables configured
- [x] Health check working
- [x] Auto-deploy enabled
- [x] Frontend configured to use Render backend
- [x] Test user exists
- [x] API endpoints working

---

## 🎉 You're All Set!

Your backend is live on Render and ready to use. No need to run anything locally!

**Just start your frontend:**
```bash
cd frontend
npm start
```

**Backend Status:** ✅ Live on Render  
**Database:** ✅ Connected  
**Ready to use:** ✅ Yes!

---

## 📞 Need Help?

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **Support:** https://render.com/support

---

**Last Updated:** December 7, 2025  
**Status:** ✅ Deployed and Operational
