import Notification from '../models/Notification.js';
import { User } from '../models/index.js';
import { getIO } from '../socket/socketServer.js';

class NotificationService {
  // Create notification for a single user
  async createNotification(userId, type, title, message, relatedId = null, relatedType = null, metadata = {}) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        metadata
      });

      // Get unread count
      const unreadCount = await this.getUnreadCount(userId);

      // Emit real-time notification via WebSocket
      try {
        const io = getIO();
        io.to(`user:${userId}`).emit('new_notification', {
          notification,
          unreadCount
        });
        console.log(`📬 Notification sent via WebSocket to user: ${userId}`);
      } catch (socketError) {
        console.error('WebSocket error (notification still saved):', socketError);
        // Don't throw - notification is saved even if WebSocket fails
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create notification for all admin users
  async notifyAdmins(type, title, message, relatedId = null, relatedType = null, metadata = {}) {
    try {
      const admins = await User.find({ role: 'admin' });
      const notifications = await Promise.all(
        admins.map(admin => 
          this.createNotification(admin._id, type, title, message, relatedId, relatedType, metadata)
        )
      );

      // Also emit to admin room for broadcast
      try {
        const io = getIO();
        io.to('admin').emit('admin_notification', {
          type,
          title,
          message,
          relatedId,
          relatedType,
          timestamp: new Date()
        });
      } catch (socketError) {
        console.error('WebSocket broadcast error:', socketError);
      }

      return notifications;
    } catch (error) {
      console.error('Error notifying admins:', error);
      throw error;
    }
  }

  // Create notification for a vendor
  async notifyVendor(vendorId, type, title, message, relatedId = null, relatedType = null, metadata = {}) {
    return this.createNotification(vendorId, type, title, message, relatedId, relatedType, metadata);
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    if (notification) {
      // Emit update via WebSocket
      try {
        const io = getIO();
        const unreadCount = await this.getUnreadCount(userId);
        io.to(`user:${userId}`).emit('notification_read', {
          notificationId,
          unreadCount
        });
      } catch (socketError) {
        console.error('WebSocket error:', socketError);
      }
    }

    return notification;
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    // Emit update via WebSocket
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('all_notifications_read', {
        unreadCount: 0
      });
    } catch (socketError) {
      console.error('WebSocket error:', socketError);
    }

    return result;
  }

  // Get unread count
  async getUnreadCount(userId) {
    return Notification.countDocuments({ userId, isRead: false });
  }
}

export default new NotificationService();

