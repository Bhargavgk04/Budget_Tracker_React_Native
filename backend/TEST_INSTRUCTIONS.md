# Transaction and Split Testing Instructions

This document explains how to test if transactions are being added to the database properly and if the split with friends functionality is working correctly.

## Prerequisites

1. MongoDB should be running and connected
2. At least one user account should exist in the database
3. For split tests, at least two user accounts are needed
4. Backend server should be running (for API tests)

## Test Files

### 1. `test-simple-transaction.js` - Direct Database Test

This test directly connects to MongoDB and creates transactions to verify database operations.

**What it tests:**
- Basic transaction creation
- Transaction with split information
- Database queries
- Transaction model methods

**How to run:**
```bash
cd backend
node test-simple-transaction.js
```

**Expected output:**
- ✓ Connected to MongoDB
- ✓ Simple transaction created successfully
- ✓ Transaction verified in database
- ✓ Split transaction created successfully
- ✓ Split amounts sum correctly
- ✓ All tests completed successfully

### 2. `test-transaction-split.js` - API Integration Test

This test uses the REST API to create transactions and splits, simulating real user interactions.

**What it tests:**
- Basic transaction creation via API
- Transaction with friend UID
- Equal split creation
- Percentage split creation
- Custom split creation
- Retrieving shared transactions
- Invalid split validation

**Setup:**
Before running, update the test user credentials in the file:
```javascript
const testUsers = {
  user1: {
    email: 'your-test-user1@example.com',  // Update this
    password: 'YourPassword123'             // Update this
  },
  user2: {
    email: 'your-test-user2@example.com',  // Update this
    password: 'YourPassword123'             // Update this
  }
};
```

**How to run:**
```bash
cd backend
# Make sure your backend server is running first!
node test-transaction-split.js
```

**Expected output:**
- ✓ User 1 logged in
- ✓ User 2 logged in
- ✓ PASS: basicTransaction
- ✓ PASS: transactionWithFriend
- ✓ PASS: equalSplit
- ✓ PASS: percentageSplit
- ✓ PASS: customSplit
- ✓ PASS: sharedTransactions
- ✓ PASS: verifyInDB
- ✓ PASS: invalidSplit
- 🎉 All tests passed!

## Manual Testing via API

You can also test manually using tools like Postman or curl.

### 1. Create a Basic Transaction

```bash
POST http://localhost:5000/api/transactions
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "amount": 500,
  "category": "Food",
  "type": "expense",
  "paymentMode": "upi",
  "notes": "Lunch",
  "date": "2025-12-03T10:00:00.000Z"
}
```

### 2. Create Transaction with Friend

```bash
POST http://localhost:5000/api/transactions
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "amount": 1000,
  "category": "Food",
  "type": "expense",
  "paymentMode": "cash",
  "notes": "Dinner with friend",
  "date": "2025-12-03T19:00:00.000Z",
  "friendUid": "FRIEND_UID_HERE"
}
```

### 3. Add Equal Split to Transaction

```bash
POST http://localhost:5000/api/transactions/TRANSACTION_ID/split
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json

Body:
{
  "splitType": "equal",
  "paidBy": "YOUR_USER_ID",
  "participants": [
    {
      "user": "YOUR_USER_ID",
      "share": 500,
      "percentage": 50
    },
    {
      "user": "FRIEND_USER_ID",
      "share": 500,
      "percentage": 50
    }
  ]
}
```

### 4. Get Shared Transactions

```bash
GET http://localhost:5000/api/transactions/shared
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

## Checking Database Directly

You can also check MongoDB directly using MongoDB Compass or the mongo shell:

```javascript
// Connect to your database
use your_database_name

// View all transactions
db.transactions.find().pretty()

// View only shared transactions
db.transactions.find({ "splitInfo.isShared": true }).pretty()

// Count transactions
db.transactions.countDocuments()

// View transactions with splits
db.transactions.find({ 
  "splitInfo.isShared": true 
}).forEach(tx => {
  print("Transaction ID:", tx._id)
  print("Amount:", tx.amount)
  print("Split Type:", tx.splitInfo.splitType)
  print("Participants:", tx.splitInfo.participants.length)
  print("---")
})
```

## Common Issues and Solutions

### Issue: "No users found in database"
**Solution:** Create at least one user account first using the signup endpoint or directly in MongoDB.

### Issue: "Login error: Invalid credentials"
**Solution:** Update the test user credentials in `test-transaction-split.js` with actual user accounts.

### Issue: "All registered participants must be friends with the payer"
**Solution:** Make sure the users are friends before creating a split. Send and accept a friend request first.

### Issue: "Split amounts must sum to transaction amount"
**Solution:** Ensure the sum of all participant shares equals the transaction amount exactly.

### Issue: "Connection refused"
**Solution:** Make sure your backend server is running on the correct port (default: 5000).

## What to Look For

### ✓ Transactions are working correctly if:
1. Transactions are created successfully
2. Transactions appear in the database
3. Transaction data is accurate (amount, category, date, etc.)
4. Transactions can be queried and retrieved

### ✓ Splits are working correctly if:
1. Split information is saved with the transaction
2. Participant shares sum to the transaction amount
3. Split types (equal, percentage, custom) work as expected
4. Shared transactions can be retrieved
5. Invalid splits are rejected with appropriate error messages
6. Balance calculations are accurate

## Next Steps

After running these tests, you should know:
- ✅ Whether transactions are being saved to the database
- ✅ Whether split functionality is working
- ✅ Whether friend integration is working
- ✅ Any errors or issues that need to be fixed

If all tests pass, your transaction and split system is working correctly! 🎉
