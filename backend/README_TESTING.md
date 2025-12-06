# Transaction and Split Testing Guide

## 🎯 Purpose

This guide helps you verify that:
1. **Transactions are being added to the database properly**
2. **Split with friends functionality is working correctly**

## 🚀 Quick Start (3 Minutes)

```bash
cd backend

# 1. Create test users
node create-test-users.js

# 2. Run simple test
node test-simple-transaction.js

# 3. Check results
node check-database-status.js
```

**That's it!** If all three commands succeed, your system is working! ✅

## 📁 Test Files

| File | Purpose | Time |
|------|---------|------|
| `create-test-users.js` | Create 2 test users + friendship | 5 sec |
| `check-database-status.js` | View current database state | 5 sec |
| `test-simple-transaction.js` | Test transactions directly | 10 sec |
| `test-transaction-split.js` | Full API integration tests | 30 sec |

## 📖 Documentation Files

| File | Description |
|------|-------------|
| `QUICK_START_TESTING.md` | Step-by-step quick start guide |
| `TEST_INSTRUCTIONS.md` | Detailed testing instructions |
| `TESTING_SUMMARY.md` | Complete testing overview |
| `README_TESTING.md` | This file |

## ✅ What Gets Tested

### Transactions
- [x] Create basic transaction
- [x] Save to database
- [x] Retrieve from database
- [x] Transaction with friend UID
- [x] Friend auto-population

### Splits
- [x] Equal split (50-50)
- [x] Percentage split (60-40)
- [x] Custom split (any amounts)
- [x] Amount validation
- [x] Percentage validation
- [x] Invalid split rejection

### Database
- [x] Data persistence
- [x] Query operations
- [x] Indexes working
- [x] Relationships maintained

## 🎬 Example Output

### ✅ Success:
```
✓ Connected to MongoDB
✓ Found test user: testuser1@example.com
✓ Simple transaction created successfully
✓ Transaction verified in database
✓ Split transaction created successfully
✓ Split amounts sum correctly
✓ All tests completed successfully!

Transactions are being saved to the database correctly.
Split functionality is working as expected.
```

### ❌ Failure:
```
✗ No users found in database
⚠️  Please create users first
```
**Solution:** Run `node create-test-users.js`

## 🔧 Troubleshooting

### Problem: "No users found"
```bash
node create-test-users.js
```

### Problem: "Connection refused"
```bash
# Check MongoDB is running
# Check .env has correct MONGODB_URI
```

### Problem: "Users not friends"
```bash
# create-test-users.js creates friendship automatically
# Or manually create friendship via API
```

## 📊 Understanding Results

### Database Status Check
```
Total users: 2              ← Need at least 1
Total transactions: 5       ← Shows activity
Shared transactions: 3      ← Splits working
Total friendships: 1        ← Users are friends
```

### Transaction Test
```
✓ Simple transaction created    ← Basic functionality works
✓ Split transaction created     ← Split functionality works
✓ Split amounts sum correctly   ← Validation works
```

## 🎯 Success Criteria

Your system is working correctly if:

1. ✅ `create-test-users.js` creates users successfully
2. ✅ `test-simple-transaction.js` passes all tests
3. ✅ `check-database-status.js` shows transactions in database
4. ✅ Split amounts sum to transaction totals
5. ✅ No validation errors occur

## 📝 Test Credentials

After running `create-test-users.js`:

```
User 1:
  Email: testuser1@example.com
  Password: Test@123

User 2:
  Email: testuser2@example.com
  Password: Test@123
```

## 🔄 Complete Test Flow

```bash
# 1. Setup
cd backend
node create-test-users.js

# 2. Check initial state
node check-database-status.js

# 3. Run tests
node test-simple-transaction.js

# 4. Verify results
node check-database-status.js

# 5. (Optional) Full API tests
node test-transaction-split.js
```

## 📈 What to Look For

### In Database Status:
- User count > 0
- Transaction count increasing
- Shared transactions present
- Friendships exist

### In Test Output:
- All ✓ checkmarks
- No ✗ errors
- "All tests passed" message
- Correct amounts and calculations

## 🎓 Understanding the Code

### Transaction Model
```javascript
// Basic transaction
{
  userId: "user123",
  amount: 500,
  category: "Food",
  type: "expense"
}

// Transaction with split
{
  userId: "user123",
  amount: 1000,
  splitInfo: {
    isShared: true,
    paidBy: "user123",
    splitType: "equal",
    participants: [
      { user: "user123", share: 500 },
      { user: "user456", share: 500 }
    ]
  }
}
```

### Split Types

**Equal Split:**
```javascript
{
  splitType: "equal",
  participants: [
    { user: "user1", share: 500, percentage: 50 },
    { user: "user2", share: 500, percentage: 50 }
  ]
}
```

**Percentage Split:**
```javascript
{
  splitType: "percentage",
  participants: [
    { user: "user1", share: 600, percentage: 60 },
    { user: "user2", share: 400, percentage: 40 }
  ]
}
```

**Custom Split:**
```javascript
{
  splitType: "custom",
  participants: [
    { user: "user1", share: 700 },
    { user: "user2", share: 300 }
  ]
}
```

## 🚨 Common Errors

### "Split amounts must sum to transaction amount"
**Cause:** Participant shares don't add up
**Fix:** Ensure shares sum exactly to transaction amount

### "Percentages must sum to 100"
**Cause:** Percentages don't add to 100%
**Fix:** Ensure percentages sum to exactly 100

### "All registered participants must be friends"
**Cause:** Users aren't friends
**Fix:** Run `create-test-users.js` or create friendship

## 📚 Additional Resources

- `QUICK_START_TESTING.md` - Quick start guide
- `TEST_INSTRUCTIONS.md` - Detailed instructions
- `TESTING_SUMMARY.md` - Complete overview
- Spec files in `.kiro/specs/friend-expense-splitting/`

## 🎉 Success!

If all tests pass, you can confidently say:

✅ **Transactions are being added to the database properly**
✅ **Split with friends is working correctly**

Your backend is ready for:
- Frontend integration
- Mobile app testing
- Production deployment

## 💡 Tips

1. Run `check-database-status.js` anytime to see current state
2. Use `test-simple-transaction.js` for quick verification
3. Use `test-transaction-split.js` for comprehensive testing
4. Keep test users for ongoing testing
5. Monitor database after each test

## 🆘 Need Help?

1. Check error messages carefully
2. Review documentation files
3. Verify .env configuration
4. Ensure MongoDB is running
5. Check that users exist

## 📞 Support

If issues persist:
1. Check MongoDB connection
2. Verify user accounts exist
3. Ensure friendships are established
4. Review validation rules
5. Check API endpoints are accessible

---

**Ready to test?** Start with:
```bash
node create-test-users.js
```

Good luck! 🚀
