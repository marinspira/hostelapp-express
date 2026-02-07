import { Types } from 'mongoose';

import type {
  ICreateNotificationResponse,
  INotificationListItemResponse,
  IUnreadCountResponse,
} from '../interfaces/notification.interface.ts';
import INotification from '../interfaces/notification.interface.ts';
import { NotificationRepository } from '../repositories/notification.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { BackendResponse } from '../interfaces/index.interface.ts';

export class NotificationService {
  private notificationRepo: NotificationRepository;
  private hostelRepo: HostelRepository;
  private guestRepo: GuestRepository;

  constructor(
    notificationRepository: NotificationRepository,
    hostelRepository: HostelRepository,
    guestRepository: GuestRepository
  ) {
    this.notificationRepo = notificationRepository;
    this.hostelRepo = hostelRepository;
    this.guestRepo = guestRepository;
  }

  async createNotification(data: INotification): Promise<ICreateNotificationResponse> {
    const notification = await this.notificationRepo.create(data);
    return {
      success: true,
      message: 'Notification created successfully',
      data: notification,
    };
  }

  async getNotificationsForUser(userId: string): Promise<INotificationListItemResponse> {
    const notifications = await this.notificationRepo.findByUserId(new Types.ObjectId(userId));
    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications,
    };
  }

  async markAllAsReadForUser(userId: Types.ObjectId): Promise<BackendResponse<null>> {
    await this.notificationRepo.markAllAsReadForUser(userId);
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  async getUnreadCount(userId: Types.ObjectId): Promise<IUnreadCountResponse> {
    const count = await this.notificationRepo.getUnreadCountForUser(userId);

    return {
      success: true,
      message: 'Unread count retrieved successfully',
      data: { unreadCount: count },
    };
  }
}
