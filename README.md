# 💰 Budget Tracker Application

A full-stack budget tracking application with React Native frontend and Node.js backend.

## 🌟 Status

✅ **FULLY OPERATIONAL**

- **Backend:** Live on Render
- **Database:** MongoDB Atlas (Connected)
- **Frontend:** Ready to start

---

## 🚀 Quick Start

### Backend (Already Running!)
Your backend is **LIVE** on Render:
```
https://budget-tracker-react-native-kjff.onrender.com
```

✅ No need to start backend locally!

### Frontend
```bash
cd frontend
npm start
```

### Test Credentials
- **Email:** test@example.com
- **Password:** password123

---

## 📚 Documentation

- **[Quick Start Guide](QUICK-START.md)** - Get started in 2 steps
- **[Render Deployment](RENDER-DEPLOYMENT.md)** - Backend deployment info
- **[Application Status](APPLICATION-STATUS.md)** - Complete system status
- **[Startup Checklist](STARTUP-CHECKLIST.md)** - Detailed setup guide

---

## 🌐 Important URLs

| Service | URL |
|---------|-----|
| Backend (Render) | https://budget-tracker-react-native-kjff.onrender.com |
| API Base | https://budget-tracker-react-native-kjff.onrender.com/api |
| Health Check | https://budget-tracker-react-native-kjff.onrender.com/health |
| Render Dashboard | https://dashboard.render.com |

---

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Hosting:** Render (Free Tier)
- **Database:** MongoDB Atlas
- **Authentication:** JWT + Refresh Tokens
- **Security:** Helmet, CORS, Rate Limiting
- **Email:** Nodemailer (Gmail)

### Frontend (React Native + Expo)
- **Platform:** iOS, Android, Web
- **State Management:** React Hooks
- **Navigation:** React Navigation
- **Styling:** NativeWind (Tailwind CSS)
- **API Client:** Axios

---

## 📦 Features

### ✅ Implemented
- User authentication (register, login, logout)
- JWT token management with refresh tokens
- Password reset with OTP
- User profile management
- Profile picture upload
- Transaction management (CRUD)
- Category management
- Budget tracking
- Analytics and reports
- Friend system
- Split expenses
- Settlement tracking
- Group expenses
- Audit logging
- Email notifications

### 🔐 Security
- Password hashing (bcrypt)
- JWT authentication
- Refresh token rotation
- Rate limiting
- CORS protection
- Input validation
- XSS protection
- Account locking
- 2FA support

---

## 🧪 Testing

### Test Render Backend
```bash
node test-render-backend.js
```

### Test Database
```bash
cd backend
node test-mongodb-connection.js
```

### Test Application
```bash
cd backend
node test-application.js
```

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- Bcrypt
- Nodemailer
- Multer + Sharp (image processing)
- Helmet (security)
- CORS
- Express Rate Limit

### Frontend
- React Native
- Expo
- React Navigation
- Axios
- NativeWind
- React Hook Form
- Date-fns
- Chart Kit

---

## 📱 Running Frontend

### Web
```bash
cd frontend
npm start
# Press 'w' for web
```

### Mobile (Android)
```bash
cd frontend
npx expo start --android
```

### Mobile (iOS)
```bash
cd frontend
npx expo start --ios
```

---

## 🔧 Development

### Run Backend Locally (Optional)
If you want to develop backend locally:

```bash
cd backend
npm run dev
```

Then update `frontend/.env`:
```
API_URL=http://localhost:3000/api
```

**Remember to change back to Render URL when done!**

---

## 📊 Database

### MongoDB Atlas
- **Status:** ✅ Connected
- **Collections:** 7
  - users (1 document)
  - categories (96 documents)
  - transactions
  - settlements
  - groups
  - friendships
  - auditlogs

---

## 🌍 Environment Variables

### Backend (Render)
Already configured on Render dashboard:
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `FRONTEND_URL`

### Frontend
File: `frontend/.env`
```env
API_URL=https://budget-tracker-react-native-kjff.onrender.com/api
```

---

## 📝 API Endpoints

### Public
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP

### Protected (Require Authentication)
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Create transaction
- `GET /api/categories` - Get categories
- `GET /api/budgets` - Get budgets
- `GET /api/analytics/*` - Analytics
- And many more...

---

## 🎯 Project Structure

```
.
├── backend/                 # Backend (deployed on Render)
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic
│   ├── config/             # Configuration
│   ├── utils/              # Utilities
│   └── server.js           # Entry point
│
├── frontend/               # React Native app
│   ├── app/               # App screens
│   ├── assets/            # Images, fonts
│   └── App.tsx            # Entry point
│
└── docs/                  # Documentation
    ├── QUICK-START.md
    ├── RENDER-DEPLOYMENT.md
    └── APPLICATION-STATUS.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 👨‍💻 Author

**Bhargav**

---

## 🎉 Ready to Use!

Your application is fully deployed and operational:

✅ Backend live on Render  
✅ Database connected  
✅ Frontend ready to start  
✅ All features working  

**Start now:** `cd frontend && npm start`

---

**Last Updated:** December 7, 2025
