# 🚀 Application Startup Checklist

## ✅ Pre-Flight Checks Completed

### 1. Database Connection ✅
- MongoDB Atlas connected successfully
- Database: `test`
- Collections: 7 (users, transactions, categories, settlements, groups, friendships, auditlogs)
- Test user exists: `test@example.com`

### 2. Environment Variables ✅
All required environment variables are set:
- ✅ NODE_ENV
- ✅ PORT
- ✅ MONGODB_URI
- ✅ JWT_SECRET
- ✅ JWT_REFRESH_SECRET
- ✅ EMAIL_USER
- ✅ EMAIL_PASS

### 3. Models & Schemas ✅
- ✅ User Model (with all methods working)
- ✅ Transaction Model
- ✅ Category Model
- ✅ Settlement Model
- ✅ Group Model
- ✅ Friendship Model
- ✅ AuditLog Model

### 4. User Methods ✅
- ✅ JWT token generation
- ✅ Password hashing & matching
- ✅ OTP generation & verification
- ✅ Refresh token management
- ✅ 2FA support
- ✅ Backup codes

### 5. API Routes ✅
- ✅ Authentication routes (`/api/auth/*`)
- ✅ User routes (`/api/user/*`)
- ✅ Transaction routes (`/api/transactions/*`)
- ✅ Category routes (`/api/categories/*`)
- ✅ Budget routes (`/api/budgets/*`)
- ✅ Analytics routes (`/api/analytics/*`)
- ✅ Friend routes (`/api/friends/*`)
- ✅ Split routes (`/api/splits/*`)
- ✅ Settlement routes (`/api/settlements/*`)
- ✅ Group routes (`/api/groups/*`)

### 6. Middleware ✅
- ✅ Authentication middleware
- ✅ Validation middleware
- ✅ Error handler
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Helmet security
- ✅ Compression

### 7. Services ✅
- ✅ Email service (configured with Gmail)
- ✅ Image processor
- ✅ File upload (Multer)

---

## 🎯 How to Start the Application

### Backend Server

#### Option 1: Production Mode
```bash
cd backend
npm start
```

#### Option 2: Development Mode (with auto-reload)
```bash
cd backend
npm run dev
```

The server will start on: `http://localhost:3000`

### Frontend Application

```bash
cd frontend
npm start
```

For mobile development:
```bash
cd frontend
npx expo start
```

---

## 🧪 Testing the Application

### 1. Run Comprehensive Tests
```bash
cd backend
node test-application.js
```

### 2. Test API Endpoints
First, start the server in one terminal:
```bash
cd backend
npm start
```

Then, in another terminal:
```bash
cd backend
node test-api-endpoints.js
```

### 3. Test OTP Functionality
```bash
cd backend
node test-otp-simple.js
```

### 4. Test Database Connection
```bash
cd backend
node test-mongodb-connection.js
```

---

## 📝 Test Credentials

### Test User Account
- **Email:** test@example.com
- **Password:** password123
- **UID:** 3A3AAAA9

---

## 🔗 Important Endpoints

### Public Endpoints
- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password-otp` - Reset password with OTP

### Protected Endpoints (Require Authentication)
- `GET /api/auth/me` - Get current user
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `POST /api/user/profile/picture` - Upload profile picture
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `GET /api/analytics/*` - Analytics endpoints
- `GET /api/friends` - Get friends list
- `GET /api/budgets` - Get budgets

---

## 🔐 Authentication Flow

1. **Register:** `POST /api/auth/register`
   ```json
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "password123"
   }
   ```

2. **Login:** `POST /api/auth/login`
   ```json
   {
     "email": "john@example.com",
     "password": "password123",
     "rememberMe": false
   }
   ```

3. **Use Token:** Add to headers
   ```
   Authorization: Bearer <your-token>
   ```

4. **Refresh Token:** `POST /api/auth/refresh-token`
   ```json
   {
     "refreshToken": "<your-refresh-token>"
   }
   ```

---

## 🐛 Troubleshooting

### Server won't start
1. Check if MongoDB is connected: `node test-mongodb-connection.js`
2. Verify .env file exists and has all required variables
3. Check if port 3000 is already in use

### Database connection fails
1. Check MongoDB URI in .env
2. Verify network connectivity
3. Check MongoDB Atlas whitelist (allow all IPs: 0.0.0.0/0)

### Authentication fails
1. Verify JWT_SECRET is set in .env
2. Check if user exists in database
3. Verify password is correct

### Email not sending
1. Check EMAIL_USER and EMAIL_PASS in .env
2. For Gmail, use App Password (not regular password)
3. Enable "Less secure app access" or use OAuth2

---

## 📊 Database Statistics

- **Total Collections:** 7
- **Total Users:** 1
- **Total Categories:** 96 (default categories)
- **Total Transactions:** 0
- **Total Settlements:** 0
- **Total Groups:** 0
- **Total Friendships:** 0

---

## 🎉 Application Status

### ✅ READY TO RUN!

All systems are operational. Your budget tracker application is fully functional and ready for development or production use.

### Next Steps:
1. Start the backend server: `cd backend && npm start`
2. Start the frontend app: `cd frontend && npm start`
3. Test the application with the test user credentials
4. Create new users and start tracking budgets!

---

## 📞 Quick Commands Reference

```bash
# Backend
cd backend
npm start              # Start server
npm run dev            # Start with nodemon
node test-application.js  # Run tests

# Frontend
cd frontend
npm start              # Start web app
npx expo start         # Start mobile app
npx expo start --android  # Android
npx expo start --ios      # iOS

# Database
node test-mongodb-connection.js  # Test DB
node check-database-status.js    # Check DB status
```

---

**Last Updated:** December 7, 2025
**Status:** ✅ All Systems Operational
