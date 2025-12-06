# Quick Start: Testing Transactions and Splits

Follow these steps to verify that transactions are being added to the database and splits are working correctly.

## Step 0: Create Test Users (If Needed)

If you don't have test users yet, create them first:

```bash
cd backend
node create-test-users.js
```

This will create:
- Test User 1 (testuser1@example.com / Test@123)
- Test User 2 (testuser2@example.com / Test@123)
- A friendship between them

**Save the UIDs and IDs shown - you'll need them for testing!**

## Step 1: Check Current Database Status

Now let's see what's in your database:

```bash
node check-database-status.js
```

This will show you:
- How many users exist
- How many transactions exist
- How many shared transactions exist
- How many friendships exist
- Recommendations for what to test

## Step 2: Run Simple Database Test

This test directly creates transactions in the database:

```bash
node test-simple-transaction.js
```

**What this tests:**
- ✅ Basic transaction creation
- ✅ Transaction with split information
- ✅ Database storage verification
- ✅ Split amount validation

**Expected Result:**
```
✓ Connected to MongoDB
✓ Found test user: user@example.com
✓ Simple transaction created successfully
✓ Transaction verified in database
✓ Split transaction created successfully
✓ Split amounts sum correctly to transaction amount
✓ All tests completed successfully!
```

## Step 3: Run API Integration Tests (Optional)

If you want to test the full API flow:

### 3a. Update Test User Credentials

Edit `test-transaction-split.js` and update these lines:

```javascript
const testUsers = {
  user1: {
    email: 'your-actual-user1@example.com',  // ← Change this
    password: 'YourActualPassword'            // ← Change this
  },
  user2: {
    email: 'your-actual-user2@example.com',  // ← Change this
    password: 'YourActualPassword'            // ← Change this
  }
};
```

### 3b. Make Sure Backend is Running

```bash
# In a separate terminal
cd backend
npm start
```

### 3c. Run the API Tests

```bash
# In your original terminal
node test-transaction-split.js
```

**What this tests:**
- ✅ User authentication
- ✅ Transaction creation via API
- ✅ Friend integration
- ✅ Equal split
- ✅ Percentage split
- ✅ Custom split
- ✅ Retrieving shared transactions
- ✅ Invalid split rejection

## Step 4: Check Database Again

After running tests, check the database again to see the new data:

```bash
node check-database-status.js
```

You should see:
- Increased transaction count
- New shared transactions
- Transaction statistics

## Quick Troubleshooting

### Problem: "No users found in database"

**Solution:** Create a user first. You can either:

1. Use the signup API:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

2. Or use MongoDB Compass to add a user directly

### Problem: "All registered participants must be friends"

**Solution:** Make the users friends first:

```bash
# Send friend request
curl -X POST http://localhost:5000/api/friends/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientId": "FRIEND_USER_ID"}'

# Accept friend request
curl -X POST http://localhost:5000/api/friends/FRIENDSHIP_ID/accept \
  -H "Authorization: Bearer FRIEND_TOKEN"
```

### Problem: "Connection refused"

**Solution:** Make sure your backend server is running:
```bash
cd backend
npm start
```

## What Success Looks Like

### ✅ Transactions Working:
```
✓ Simple transaction created successfully
✓ Transaction verified in database
Total transactions: 5
```

### ✅ Splits Working:
```
✓ Split transaction created successfully
✓ Split amounts sum correctly
Shared transactions: 3
```

### ✅ All Tests Passing:
```
Total: 8/8 tests passed
🎉 All tests passed! Transactions and splits are working correctly.
```

## Next Steps

Once all tests pass:

1. ✅ Transactions are being saved to database correctly
2. ✅ Split functionality is working
3. ✅ Friend integration is working
4. ✅ Balance calculations are accurate

You can now:
- Use the frontend to create transactions
- Test with real user scenarios
- Monitor the database for any issues
- Deploy with confidence!

## Need Help?

If tests are failing:
1. Check the error messages carefully
2. Verify your `.env` file has correct MongoDB URI
3. Ensure MongoDB is running
4. Check that you have at least one user in the database
5. Review the TEST_INSTRUCTIONS.md for detailed troubleshooting

## Summary Commands

```bash
# Quick test sequence
cd backend

# 1. Check current state
node check-database-status.js

# 2. Run simple test
node test-simple-transaction.js

# 3. Check state again
node check-database-status.js

# 4. (Optional) Run full API tests
node test-transaction-split.js
```

That's it! 🚀
