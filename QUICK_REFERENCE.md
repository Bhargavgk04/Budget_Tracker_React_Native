# Quick Reference Guide - Budget Tracker

## 🚀 Quick Start

### Start Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3000
```

### Start Frontend
```bash
cd frontend
npm install
npm start
# Expo runs on http://localhost:19006
```

---

## 📝 Common Tasks

### Add a Transaction
1. Click "+" button or "Add Transaction"
2. Enter amount
3. Select type (Income/Expense)
4. Choose category
5. Select payment mode
6. Add notes (optional)
7. Click "Add Transaction"

### View Transactions
- Dashboard shows recent transactions
- Transactions tab shows full list
- Filter by date, category, or type
- Search by notes or category

### Split with Friends
1. Add transaction
2. Select friends to split with
3. Configure split (equal/custom)
4. Transaction automatically creates split

---

## 🔧 Configuration

### Backend Environment Variables
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/budget-tracker
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Frontend API Configuration
```javascript
// frontend/app/services/api.jsx
const API_BASE_URL = "http://192.168.0.125:3000/api";
```

---

## 🐛 Troubleshooting

### Transaction Not Saving
1. Check backend is running
2. Verify MongoDB connection
3. Check auth token is valid
4. Review console logs for errors

### Slow Performance
1. Check network connection
2. Verify no duplicate syncs in logs
3. Clear app cache
4. Restart app

### Network Errors
1. Verify backend URL is correct
2. Check CORS settings
3. Ensure auth token is valid
4. Check rate limiting

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats` - Get statistics

### Analytics
- `GET /api/analytics/summary` - Get summary
- `GET /api/analytics/category-breakdown` - Category breakdown

---

## 🔑 Key Features

### Optimistic Updates
- UI updates immediately
- Background sync happens automatically
- No waiting for server response

### Smart Syncing
- Batches multiple operations (500ms delay)
- Throttles requests (3s minimum)
- Silent background failures

### Error Handling
- Graceful degradation
- User-friendly error messages
- Automatic retry on network restore

### Security
- JWT authentication
- User data isolation
- Rate limiting
- Input validation

---

## 📈 Performance Tips

### Do's
✅ Use optimistic updates
✅ Batch operations when possible
✅ Implement proper throttling
✅ Cache frequently accessed data
✅ Use indexes for queries

### Don'ts
❌ Don't sync on every state change
❌ Don't block UI for background operations
❌ Don't show errors for background failures
❌ Don't fetch unnecessary data
❌ Don't skip validation

---

## 🎯 Best Practices

### Frontend
1. Always validate input before submission
2. Show loading states for user actions
3. Handle errors gracefully
4. Use optimistic updates for better UX
5. Implement proper error boundaries

### Backend
1. Validate all inputs
2. Use proper HTTP status codes
3. Implement rate limiting
4. Log errors for debugging
5. Use transactions for critical operations

### Database
1. Create proper indexes
2. Use lean queries when possible
3. Implement soft deletes
4. Regular backups
5. Monitor query performance

---

## 📚 Documentation Files

1. **OPTIMIZATION_COMPLETE.md** - Complete optimization summary
2. **TRANSACTION_FLOW_VERIFICATION.md** - Transaction flow details
3. **TRANSACTION_SPEED_FIX.md** - Speed optimization details
4. **PERFORMANCE_FIXES.md** - Performance improvements
5. **FINAL_OPTIMIZATION_CHECKLIST.md** - Comprehensive checklist
6. **QUICK_REFERENCE.md** - This file

---

## 🆘 Getting Help

### Check Logs
```bash
# Backend logs
cd backend && npm start

# Frontend logs
cd frontend && npm start
# Check browser console or terminal
```

### Common Issues

**Issue**: "Network request failed"
**Solution**: Check backend is running and URL is correct

**Issue**: "Session expired"
**Solution**: Login again to refresh token

**Issue**: Transactions not appearing
**Solution**: Check sync is working, refresh manually

**Issue**: Slow performance
**Solution**: Check for duplicate syncs in logs

---

## 🎉 Quick Wins

### Add Loading Skeleton
Shows placeholder while loading data

### Add Pull-to-Refresh
Swipe down to manually refresh

### Add Haptic Feedback
Vibration feedback on actions

### Add Toast Notifications
Non-intrusive success messages

### Add Keyboard Shortcuts
Ctrl+S to save (web)

---

## 📞 Support Checklist

Before asking for help:
- [ ] Checked backend is running
- [ ] Verified MongoDB connection
- [ ] Reviewed console logs
- [ ] Checked auth token validity
- [ ] Tested with different data
- [ ] Cleared cache and restarted
- [ ] Reviewed documentation

---

**Last Updated**: December 8, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
