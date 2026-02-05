import { Types } from 'mongoose';

import Notification from '../models/notification.model';
import type INotification from '../interfaces/notification.interface.ts';
import type { INotificationDocument } from '../interfaces/notification.interface.ts';

export class NotificationRepository {
  create(data: INotification): Promise<INotificationDocument> {
    return Notification.create(data);
  }

  findByUserId(userId: Types.ObjectId): Promise<INotificationDocument[]> {
    return Notification.find({ recipients: { $elemMatch: { user: userId } } })
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

  markAllAsReadForUser(userId: Types.ObjectId): Promise<any> {
    return Notification.updateMany({ recipient: { user: userId }, read: false }, { read: true });
  }

  getUnreadCountForUser(userId: Types.ObjectId): Promise<number> {
    return Notification.countDocuments({
      recipient: { user: userId },
      read: false,
    });
  }

  deleteOldNotifications(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      read: true,
    });
  }
}
