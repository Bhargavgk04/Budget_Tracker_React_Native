const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  /**
   * Create notification for friend request
   */
  static async createFriendRequestNotification(requesterId, recipientId) {
    try {
      const requester = await User.findById(requesterId);
      const recipient = await User.findById(recipientId);

      if (!requester || !recipient) {
        throw new Error('User not found');
      }

      // Check notification preferences
      if (!recipient.preferences?.notifications) {
        return null;
      }

      const notification = await Notification.create({
        userId: recipientId,
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${requester.name} sent you a friend request`,
        data: {
          requesterId: requesterId,
          requesterName: requester.name,
          requesterUid: requester.uid
        },
        actionUrl: `/friends/requests`
      });

      // TODO: Send push notification
      await this.sendPushNotification(recipient, notification);

      return notification;
    } catch (error) {
      console.error('Error creating friend request notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for shared expense
   */
  static async createSharedExpenseNotification(transactionId, payerId, participantIds) {
    try {
      const payer = await User.findById(payerId);
      if (!payer) {
        throw new Error('Payer not found');
      }

      const notifications = [];

      for (const participantId of participantIds) {
        if (participantId === payerId) continue;

        const participant = await User.findById(participantId);
        if (!participant || !participant.preferences?.notifications) {
          continue;
        }

        const notification = await Notification.create({
          userId: participantId,
          type: 'shared_expense',
          title: 'New Shared Expense',
          message: `${payer.name} added a shared expense`,
          data: {
            transactionId,
            payerId,
            payerName: payer.name
          },
          actionUrl: `/transactions/${transactionId}`
        });

        await this.sendPushNotification(participant, notification);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating shared expense notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for settlement
   */
  static async createSettlementNotification(settlementId, payerId, recipientId, amount) {
    try {
      const payer = await User.findById(payerId);
      const recipient = await User.findById(recipientId);

      if (!payer || !recipient) {
        throw new Error('User not found');
      }

      if (!recipient.preferences?.notifications) {
        return null;
      }

      const notification = await Notification.create({
        userId: recipientId,
        type: 'settlement',
        title: 'Settlement Recorded',
        message: `${payer.name} recorded a payment of ₹${amount.toFixed(2)}`,
        data: {
          settlementId,
          payerId,
          payerName: payer.name,
          amount
        },
        actionUrl: `/settlements/${settlementId}`
      });

      await this.sendPushNotification(recipient, notification);

      return notification;
    } catch (error) {
      console.error('Error creating settlement notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for group activity
   */
  static async createGroupActivityNotification(groupId, actorId, memberIds, activityType, details) {
    try {
      const actor = await User.findById(actorId);
      if (!actor) {
        throw new Error('Actor not found');
      }

      const notifications = [];

      for (const memberId of memberIds) {
        if (memberId === actorId) continue;

        const member = await User.findById(memberId);
        if (!member || !member.preferences?.notifications) {
          continue;
        }

        let title, message;
        switch (activityType) {
          case 'group_created':
            title = 'Added to Group';
            message = `${actor.name} added you to ${details.groupName}`;
            break;
          case 'expense_added':
            title = 'New Group Expense';
            message = `${actor.name} added an expense to ${details.groupName}`;
            break;
          case 'member_added':
            title = 'New Group Member';
            message = `${actor.name} added ${details.newMemberName} to ${details.groupName}`;
            break;
          case 'group_settled':
            title = 'Group Settled';
            message = `${details.groupName} has been marked as settled`;
            break;
          default:
            title = 'Group Activity';
            message = `New activity in ${details.groupName}`;
        }

        const notification = await Notification.create({
          userId: memberId,
          type: 'group_activity',
          title,
          message,
          data: {
            groupId,
            actorId,
            actorName: actor.name,
            activityType,
            ...details
          },
          actionUrl: `/groups/${groupId}`
        });

        await this.sendPushNotification(member, notification);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating group activity notification:', error);
      throw error;
    }
  }

  /**
   * Create reminder notification for pending settlements
   */
  static async createSettlementReminderNotifications() {
    try {
      const Settlement = require('../models/Settlement');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const pendingSettlements = await Settlement.find({
        status: 'pending',
        createdAt: { $lte: sevenDaysAgo }
      }).populate('payer recipient');

      const notifications = [];

      for (const settlement of pendingSettlements) {
        if (!settlement.recipient.preferences?.notifications) {
          continue;
        }

        const notification = await Notification.create({
          userId: settlement.recipient._id,
          type: 'settlement_reminder',
          title: 'Pending Settlement',
          message: `Reminder: ${settlement.payer.name} recorded a payment of ₹${settlement.amount.toFixed(2)} ${Math.floor((Date.now() - settlement.createdAt) / (1000 * 60 * 60 * 24))} days ago`,
          data: {
            settlementId: settlement._id,
            payerId: settlement.payer._id,
            payerName: settlement.payer.name,
            amount: settlement.amount,
            daysOld: Math.floor((Date.now() - settlement.createdAt) / (1000 * 60 * 60 * 24))
          },
          actionUrl: `/settlements/${settlement._id}`
        });

        await this.sendPushNotification(settlement.recipient, notification);
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating settlement reminder notifications:', error);
      throw error;
    }
  }

  /**
   * Send push notification (placeholder for actual implementation)
   */
  static async sendPushNotification(user, notification) {
    // TODO: Implement actual push notification sending
    // This would integrate with services like Firebase Cloud Messaging, OneSignal, etc.
    
    // For now, just log
    console.log(`Push notification would be sent to ${user.email}:`, {
      title: notification.title,
      message: notification.message
    });

    // Example implementation with Expo Push Notifications:
    /*
    if (user.pushToken) {
      const message = {
        to: user.pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.message,
        data: notification.data
      };
      
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });
    }
    */
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId, filters = {}) {
    try {
      const query = { userId };

      if (filters.isRead !== undefined) {
        query.isRead = filters.isRead;
      }

      if (filters.type) {
        query.type = filters.type;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50);

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId, userId) {
    try {
      await Notification.findOneAndDelete({ _id: notificationId, userId });
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
