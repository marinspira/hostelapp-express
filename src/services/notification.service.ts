import { Types } from 'mongoose';

import type {
  ICreateNotificationResponse,
  INotificationListItemResponse,
  INotificationByIdResponse,
  IUnreadCountResponse,
  INotificationData,
} from '../interfaces/notification.interface.ts';
import INotification from '../interfaces/notification.interface.ts';
import { NotificationRepository } from '../repositories/notification.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { BackendResponse } from '../interfaces/index.interface.ts';
import { NotFoundError } from '../utils/errors.ts';

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

  async getNotificationsForHostel(hostelId: string): Promise<INotificationListItemResponse> {
    const notifications = await this.notificationRepo.findByHostelId(new Types.ObjectId(hostelId));
    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications,
    };
  }

  async markAsRead(notificationId: string): Promise<INotificationByIdResponse> {
    const notification = await this.notificationRepo.markAsRead(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    return {
      success: true,
      message: 'Notification marked as read',
      data: notification,
    };
  }

  async markAllAsReadForUser(userId: string): Promise<BackendResponse<null>> {
    await this.notificationRepo.markAllAsReadForUser(userId);
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  async markAllAsReadForHostel(hostelId: string): Promise<BackendResponse<null>> {
    await this.notificationRepo.markAllAsReadForHostel(hostelId);
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  async deleteNotification(notificationId: string): Promise<BackendResponse<null>> {
    const notification = await this.notificationRepo.delete(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }
    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }

  async getUnreadCount(userId?: string, hostelId?: string): Promise<IUnreadCountResponse> {
    let count = 0;
    if (userId) {
      count = await this.notificationRepo.getUnreadCountForUser(userId);
    } else if (hostelId) {
      count = await this.notificationRepo.getUnreadCountForHostel(hostelId);
    }

    return {
      success: true,
      message: 'Unread count retrieved successfully',
      data: { unreadCount: count },
    };
  }

  async createReservationNotification(
    reservationId: string,
    hostelId: string,
    guestUserId: string,
    roomNumber: string,
    bedNumber: string,
    checkinDate: Date,
    checkoutDate: Date
  ): Promise<void> {
    try {
      const guest = await this.guestRepo.findByUserId(guestUserId);
      const guestName = guest?.name || 'Unknown Guest';

      const hostel = await this.hostelRepo.findById(hostelId);

      if (hostel?.user_id_owners) {
        const owners = Array.isArray(hostel.user_id_owners)
          ? hostel.user_id_owners
          : [hostel.user_id_owners];

        for (const ownerId of owners) {
          const notificationData: INotificationData = {
            reservationId,
            roomNumber,
            bedNumber,
            guestId: guestUserId,
            guestName,
            hostelId,
            checkinDate,
            checkoutDate,
          };

          await this.notificationRepo.create({
            recipient: { user: new Types.ObjectId(ownerId) },
            type: 'reservation_created',
            title: 'Nova Reserva',
            message: `${guestName} fez uma nova reserva no seu hostel.`,
            data: notificationData,
          });
        }
      }

      const guestNotificationData: INotificationData = {
        reservationId,
        roomNumber,
        bedNumber,
        hostelId,
        hostelName: hostel?.name,
        checkinDate,
        checkoutDate,
      };

      await this.notificationRepo.create({
        recipient: { user: new Types.ObjectId(guestUserId) },
        type: 'reservation_created',
        title: 'Reserva Confirmada',
        message: `Sua reserva no quarto ${roomNumber}, cama ${bedNumber} foi confirmada!`,
        data: guestNotificationData,
      });
    } catch (error) {
      console.error('Error creating reservation notification:', error);
    }
  }

  async createCheckoutNotification(
    reservationId: string,
    hostelId: string,
    guestUserId: string,
    roomNumber: string,
    bedNumber: string
  ): Promise<void> {
    try {
      const guest = await this.guestRepo.findByUserId(guestUserId);
      const guestName = guest?.name || 'Unknown Guest';

      const hostel = await this.hostelRepo.findById(hostelId);

      if (hostel?.user_id_owners) {
        const owners = Array.isArray(hostel.user_id_owners)
          ? hostel.user_id_owners
          : [hostel.user_id_owners];

        for (const ownerId of owners) {
          const notificationData: INotificationData = {
            reservationId,
            roomNumber,
            bedNumber,
            guestId: guestUserId,
            guestName,
            hostelId,
          };

          await this.notificationRepo.create({
            recipient: { user: new Types.ObjectId(ownerId) },
            type: 'guest_checkedout',
            title: 'Checkout Realizado',
            message: `${guestName} fez checkout do quarto ${roomNumber}, cama ${bedNumber}`,
            data: notificationData,
          });
        }
      }

      const guestNotificationData: INotificationData = {
        reservationId,
        roomNumber,
        bedNumber,
        hostelId,
        hostelName: hostel?.name,
      };

      await this.notificationRepo.create({
        recipient: { user: new Types.ObjectId(guestUserId) },
        type: 'guest_checkedout',
        title: 'Checkout Confirmado',
        message: `Seu checkout do quarto ${roomNumber} foi processado com sucesso!`,
        data: guestNotificationData,
      });
    } catch (error) {
      console.error('Error creating checkout notification:', error);
    }
  }
}
