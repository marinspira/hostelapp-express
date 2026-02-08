import { Types } from 'mongoose';

import Notification from '../models/notification.model';
import type INotification from '../interfaces/notification.interface';
import type { INotificationDocument, INotificationDTO } from '../interfaces/notification.interface';

export class NotificationRepository {
  create(data: INotification): Promise<INotificationDocument> {
    return Notification.create(data);
  }

  async findByUserId(userId: Types.ObjectId): Promise<INotificationDTO[]> {
    const notifications = await Notification.find({ 'recipients.userId': userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    return notifications.map((notification: INotificationDocument) => {
      const recipient = notification.recipients.find((r: any) => r.userId.equals(userId));
      return {
        _id: notification._id,
        message: notification.message,
        data: notification.data,
        type: notification.type,
        title: notification.title,
        createdAt: notification.createdAt,
        recipient: recipient?.userId,
        read: recipient?.read,
      } as INotificationDTO;
    });
  }

  findById(id: string): Promise<INotificationDocument | null> {
    return Notification.findById(id).exec() as Promise<INotificationDocument | null>;
  }

  markAsRead(id: string): Promise<INotificationDocument | null> {
    return Notification.findByIdAndUpdate(
      id,
      { $set: { 'recipients.$.read': true } },
      { new: true }
    ).exec() as Promise<INotificationDocument | null>;
  }

  markAsReadForUser(
    notificationId: string,
    userId: Types.ObjectId
  ): Promise<INotificationDocument | null> {
    return Notification.findOneAndUpdate(
      { _id: notificationId, 'recipients.userId': userId },
      { $set: { 'recipients.$.read': true } },
      { new: true }
    ).exec() as Promise<INotificationDocument | null>;
  }

  markAllAsReadForUser(userId: Types.ObjectId): Promise<any> {
    return Notification.updateMany(
      { 'recipients.userId': userId },
      { $set: { 'recipients.$.read': true } }
    );
  }

  async getUnreadCountForUser(userId: Types.ObjectId): Promise<number> {
    const result = await Notification.aggregate([
      { $match: { 'recipients.userId': userId } },
      { $unwind: '$recipients' },
      { $match: { 'recipients.userId': userId, 'recipients.read': false } },
      { $count: 'unreadCount' },
    ]);

    return result.length > 0 ? result[0].unreadCount : 0;
  }

  deleteOldNotifications(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete notifications that are old and ALL recipients have read them
    return Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      'recipients.read': { $not: { $elemMatch: { $eq: false } } },
    });
  }
}
