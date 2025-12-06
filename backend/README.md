# Budget Tracker Backend

Backend API for the Budget Tracker mobile application built with Express.js and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Environment Setup:**
The `.env` file has been created with your MongoDB connection. Make sure to update these values:

```env
# IMPORTANT: Change these JWT secrets before deploying to production!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-67890
```

3. **Start the server:**

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📋 Environment Variables

Your `.env` file should contain:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | ✅ Configured |
| `JWT_SECRET` | Secret for access tokens | ⚠️ Change in production |
| `JWT_EXPIRE` | Access token expiry | 1h |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | ⚠️ Change in production |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:19006 |

## 🔐 Security Notes

### Before Production Deployment:

1. **Change JWT Secrets:**
   - Generate strong random secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`
   - You can use: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

2. **Update CORS:**
   - Set `FRONTEND_URL` to your actual frontend domain

3. **Enable HTTPS:**
   - Use SSL/TLS certificates
   - Update all URLs to use `https://`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/verify-reset-token` - Verify reset token
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/change-password` - Change password (authenticated)
- `GET /api/auth/me` - Get current user
- `GET /api/auth/audit-logs` - Get user audit logs

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Analytics
- `GET /api/analytics/summary` - Get financial summary
- `GET /api/analytics/trends` - Get spending trends
- `GET /api/analytics/category-breakdown` - Get category breakdown

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 🗄️ Database

### MongoDB Atlas Connection
Your MongoDB connection is configured and ready to use. The database name is `budget-tracker`.

### Collections:
- `users` - User accounts with authentication
- `transactions` - Income and expense transactions
- `categories` - Transaction categories
- `budgets` - Budget limits and tracking
- `auditlogs` - Authentication event logs

## 🔧 Troubleshooting

### Connection Issues

**Error: "MongoServerError: bad auth"**
- Check your MongoDB credentials in `.env`
- Ensure your IP is whitelisted in MongoDB Atlas

**Error: "ECONNREFUSED"**
- Check if MongoDB is running
- Verify the connection string format

**Error: "JWT must be provided"**
- Ensure you're sending the Authorization header: `Bearer <token>`

### Common Issues

**Port already in use:**
```bash
# Change PORT in .env file
PORT=3001
```

**CORS errors:**
```bash
# Update FRONTEND_URL in .env
FRONTEND_URL=http://localhost:19006
```

## 📝 Development Tips

### Generate Strong JWT Secrets
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Test API with curl
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test@1234"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'
```

## 📚 Features Implemented

✅ Enhanced Authentication System
- Auto-generated user UID
- Remember me functionality (7 days vs 30 days)
- Password reset with secure tokens
- Session management with device tracking
- Comprehensive audit logging
- Account locking after failed attempts
- Password change with session invalidation

✅ Security Features
- JWT-based authentication
- Bcrypt password hashing
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation with Joi
- Row-level security ready

✅ Performance
- Response compression
- Request logging
- Performance monitoring
- Slow query detection

## 🚀 Next Steps

1. **Start the backend:**
   ```bash
   npm run dev
   ```

2. **Test the API:**
   - Use Postman or curl to test endpoints
   - Check `http://localhost:3000/health` for server status

3. **Connect frontend:**
   - Update frontend API URL to `http://localhost:3000/api`
   - Test authentication flow

4. **Deploy:**
   - Update environment variables for production
   - Deploy to Heroku, AWS, or DigitalOcean
   - Set up MongoDB Atlas production cluster

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in console
3. Check MongoDB Atlas connection status
4. Verify environment variables are set correctly

---

**Happy Coding! 🎉**
