import { Query, Types } from 'mongoose';

import Notification from '../models/notification.model';
import type INotification from '../interfaces/notification.ts';
import type { INotificationDocument } from '../interfaces/notification.ts';

export class NotificationRepository {
  create(data: INotification): Promise<INotificationDocument> {
    return Notification.create(data);
  }

  findByUserId(userId: Types.ObjectId): Promise<INotificationDocument[]> {
    return Notification.find({ 'recipient.user': userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec() as Promise<INotificationDocument[]>;
  }

  findByHostelId(hostelId: Types.ObjectId): Promise<INotificationDocument[]> {
    return Notification.find({ 'recipient.hostel': hostelId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec() as Promise<INotificationDocument[]>;
  }

  findById(id: string): Promise<INotificationDocument | null> {
    return Notification.findById(id).exec() as Promise<INotificationDocument | null>;
  }

  markAsRead(id: string): Promise<INotificationDocument | null> {
    return Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    ).exec() as Promise<INotificationDocument | null>;
  }

  markAllAsReadForUser(userId: string): Promise<any> {
    return Notification.updateMany({ 'recipient.user': userId, read: false }, { read: true });
  }

  markAllAsReadForHostel(hostelId: string): Promise<any> {
    return Notification.updateMany({ 'recipient.hostel': hostelId, read: false }, { read: true });
  }

  delete(id: string): Promise<INotificationDocument | null> {
    return Notification.findByIdAndDelete(id).exec() as Promise<INotificationDocument | null>;
  }

  getUnreadCountForUser(userId: string): Promise<number> {
    return Notification.countDocuments({
      'recipient.user': userId,
      read: false,
    });
  }

  getUnreadCountForHostel(hostelId: string): Promise<number> {
    return Notification.countDocuments({
      'recipient.hostel': hostelId,
      read: false,
    });
  }

  // Clean up old notifications (older than 30 days)
  deleteOldNotifications(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      read: true,
    });
  }
}
