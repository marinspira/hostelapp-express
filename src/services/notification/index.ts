import type { INotificationDocument } from '../../interfaces/notification.ts';
import INotification from "../../interfaces/notification.ts"
import { NotificationRepository } from '../../repositories/notification.repository.ts';
import { Types } from 'mongoose';
// @ts-ignore
import Hostel from '../../models/hostel.model.ts';
// @ts-ignore
import Guest from '../../models/guest.model.ts';

export class NotificationService {
  constructor(private readonly _notificationRepo: NotificationRepository) {}

  async createNotification(data: INotification): Promise<INotificationDocument> {
    return this._notificationRepo.create(data);
  }

  async getNotificationsForUser(userId: string): Promise<INotificationDocument[]> {
    return this._notificationRepo.findByUserId(new Types.ObjectId(userId));
  }

  async getNotificationsForHostel(hostelId: string): Promise<INotificationDocument[]> {
    return this._notificationRepo.findByHostelId(new Types.ObjectId(hostelId));
  }

  async markAsRead(notificationId: string): Promise<INotificationDocument | null> {
    return this._notificationRepo.markAsRead(notificationId);
  }

  async markAllAsReadForUser(userId: string): Promise<void> {
    return this._notificationRepo.markAllAsReadForUser(userId);
  }

  async markAllAsReadForHostel(hostelId: string): Promise<void> {
    return this._notificationRepo.markAllAsReadForHostel(hostelId);
  }

  async deleteNotification(notificationId: string): Promise<INotificationDocument | null> {
    return this._notificationRepo.delete(notificationId);
  }

  async getUnreadCount(userId?: string, hostelId?: string): Promise<number> {
    if (userId) {
      return this._notificationRepo.getUnreadCountForUser(userId);
    }
    if (hostelId) {
      return this._notificationRepo.getUnreadCountForHostel(hostelId);
    }
    return 0;
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
      const guest = await Guest.findOne({ user: guestUserId }).populate('user');
      const guestName = guest?.name || 'Unknown Guest';

      const hostel = await Hostel.findById(hostelId);
      const hostelOwners = await Hostel.findById(hostelId).populate('user_id_owners');
      if (hostelOwners && hostelOwners.user_id_owners) {
        const owners = Array.isArray(hostelOwners.user_id_owners) 
          ? hostelOwners.user_id_owners 
          : [hostelOwners.user_id_owners];

        for (const owner of owners) {
          await this.createNotification({
            recipient: { user: new Types.ObjectId(owner._id || owner) },
            type: 'reservation_created',
            title: 'Nova Reserva',
            message: `${guestName} fez uma nova reserva no seu hostel.`,
            data: {
              reservationId,
              roomNumber,
              bedNumber,
              guestId: guestUserId,
              guestName,
              hostelId,
              checkinDate,
              checkoutDate
            },
          });
        }
      }

      await this.createNotification({
        recipient: { user: new Types.ObjectId(guestUserId) },
        type: 'reservation_created',
        title: 'Reserva Confirmada',
        message: `Sua reserva no quarto ${roomNumber}, cama ${bedNumber} foi confirmada!`,
        data: {
          reservationId,
          roomNumber,
          bedNumber,
          hostelId,
          hostelName: hostel?.name,
          checkinDate,
          checkoutDate
        },
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
      const guest = await Guest.findOne({ user: guestUserId }).populate('user');
      const guestName = guest?.name || 'Unknown Guest';
      const hostel = await Hostel.findById(hostelId);

      const hostelOwners = await Hostel.findById(hostelId).populate('user_id_owners');
      if (hostelOwners && hostelOwners.user_id_owners) {
        const owners = Array.isArray(hostelOwners.user_id_owners) 
          ? hostelOwners.user_id_owners 
          : [hostelOwners.user_id_owners];

        for (const owner of owners) {
          await this.createNotification({
            recipient: {
              user: new Types.ObjectId(owner._id || owner.toString()),
            },
            type: 'guest_checkedout',
            title: 'Checkout Realizado',
            message: `${guestName} fez checkout do quarto ${roomNumber}, cama ${bedNumber}`,
            data: {
              reservationId,
              roomNumber,
              bedNumber,
              guestId: guestUserId,
              guestName,
              hostelId,
            },
          });
        }
      }

      await this.createNotification({
        recipient: {
          user: new Types.ObjectId(guestUserId),
        },
        type: 'guest_checkedout',
        title: 'Checkout Confirmado',
        message: `Seu checkout do quarto ${roomNumber} foi processado com sucesso!`,
        data: {
          reservationId,
          roomNumber,
          bedNumber,
          hostelId,
          hostelName: hostel?.name,
        },
      });
    } catch (error) {
      console.error('Error creating checkout notification:', error);
    }
  }
}