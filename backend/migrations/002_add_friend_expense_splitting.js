/**
 * Migration: Add Friend & Expense Splitting Features
 * 
 * This migration adds:
 * - splitInfo field to Transaction model
 * - friendUid and friendId fields to Transaction model
 * - Friendship collection
 * - Settlement collection
 * - Group collection
 * - Notification collection
 * - Required indexes for performance
 */

const mongoose = require('mongoose');

async function up() {
  console.log('Starting migration: Add Friend & Expense Splitting Features');

  try {
    const db = mongoose.connection.db;

    // 1. Update Transaction schema - add new fields
    console.log('1. Updating Transaction collection...');
    const transactionCollection = db.collection('transactions');
    
    // Add indexes for new fields
    await transactionCollection.createIndex({ friendUid: 1 }, { sparse: true });
    await transactionCollection.createIndex({ friendId: 1 }, { sparse: true });
    await transactionCollection.createIndex({ 'splitInfo.isShared': 1 });
    await transactionCollection.createIndex({ 'splitInfo.paidBy': 1 });
    await transactionCollection.createIndex({ 'splitInfo.groupId': 1 }, { sparse: true });
    
    console.log('✓ Transaction collection updated');

    // 2. Create Friendship collection
    console.log('2. Creating Friendship collection...');
    const friendshipExists = await db.listCollections({ name: 'friendships' }).hasNext();
    
    if (!friendshipExists) {
      await db.createCollection('friendships');
      const friendshipCollection = db.collection('friendships');
      
      // Create indexes
      await friendshipCollection.createIndex({ requester: 1, recipient: 1 }, { unique: true });
      await friendshipCollection.createIndex({ requester: 1, status: 1 });
      await friendshipCollection.createIndex({ recipient: 1, status: 1 });
      await friendshipCollection.createIndex({ status: 1 });
      
      console.log('✓ Friendship collection created');
    } else {
      console.log('✓ Friendship collection already exists');
    }

    // 3. Create Settlement collection
    console.log('3. Creating Settlement collection...');
    const settlementExists = await db.listCollections({ name: 'settlements' }).hasNext();
    
    if (!settlementExists) {
      await db.createCollection('settlements');
      const settlementCollection = db.collection('settlements');
      
      // Create indexes
      await settlementCollection.createIndex({ payer: 1, recipient: 1, date: -1 });
      await settlementCollection.createIndex({ payer: 1, status: 1 });
      await settlementCollection.createIndex({ recipient: 1, status: 1 });
      await settlementCollection.createIndex({ status: 1, createdAt: 1 });
      await settlementCollection.createIndex({ groupId: 1 }, { sparse: true });
      
      console.log('✓ Settlement collection created');
    } else {
      console.log('✓ Settlement collection already exists');
    }

    // 4. Create Group collection
    console.log('4. Creating Group collection...');
    const groupExists = await db.listCollections({ name: 'groups' }).hasNext();
    
    if (!groupExists) {
      await db.createCollection('groups');
      const groupCollection = db.collection('groups');
      
      // Create indexes
      await groupCollection.createIndex({ createdBy: 1, isActive: 1 });
      await groupCollection.createIndex({ 'members.user': 1, isActive: 1 });
      await groupCollection.createIndex({ isActive: 1, isSettled: 1 });
      await groupCollection.createIndex({ type: 1 });
      
      console.log('✓ Group collection created');
    } else {
      console.log('✓ Group collection already exists');
    }

    // 5. Create Notification collection
    console.log('5. Creating Notification collection...');
    const notificationExists = await db.listCollections({ name: 'notifications' }).hasNext();
    
    if (!notificationExists) {
      await db.createCollection('notifications');
      const notificationCollection = db.collection('notifications');
      
      // Create indexes
      await notificationCollection.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
      await notificationCollection.createIndex({ userId: 1, type: 1, createdAt: -1 });
      await notificationCollection.createIndex({ userId: 1 });
      await notificationCollection.createIndex({ type: 1 });
      
      console.log('✓ Notification collection created');
    } else {
      console.log('✓ Notification collection already exists');
    }

    // 6. Add pushToken field to User collection
    console.log('6. Updating User collection...');
    const userCollection = db.collection('users');
    await userCollection.createIndex({ pushToken: 1 }, { sparse: true });
    
    console.log('✓ User collection updated');

    console.log('\n✅ Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  console.log('Starting rollback: Remove Friend & Expense Splitting Features');

  try {
    const db = mongoose.connection.db;

    // 1. Remove indexes from Transaction collection
    console.log('1. Removing Transaction indexes...');
    const transactionCollection = db.collection('transactions');
    
    try {
      await transactionCollection.dropIndex('friendUid_1');
      await transactionCollection.dropIndex('friendId_1');
      await transactionCollection.dropIndex('splitInfo.isShared_1');
      await transactionCollection.dropIndex('splitInfo.paidBy_1');
      await transactionCollection.dropIndex('splitInfo.groupId_1');
    } catch (error) {
      console.log('Some indexes may not exist, continuing...');
    }
    
    console.log('✓ Transaction indexes removed');

    // 2. Drop Friendship collection
    console.log('2. Dropping Friendship collection...');
    await db.dropCollection('friendships').catch(() => {
      console.log('Friendship collection does not exist');
    });
    console.log('✓ Friendship collection dropped');

    // 3. Drop Settlement collection
    console.log('3. Dropping Settlement collection...');
    await db.dropCollection('settlements').catch(() => {
      console.log('Settlement collection does not exist');
    });
    console.log('✓ Settlement collection dropped');

    // 4. Drop Group collection
    console.log('4. Dropping Group collection...');
    await db.dropCollection('groups').catch(() => {
      console.log('Group collection does not exist');
    });
    console.log('✓ Group collection dropped');

    // 5. Drop Notification collection
    console.log('5. Dropping Notification collection...');
    await db.dropCollection('notifications').catch(() => {
      console.log('Notification collection does not exist');
    });
    console.log('✓ Notification collection dropped');

    console.log('\n✅ Rollback completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };
