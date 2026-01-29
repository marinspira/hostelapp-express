import mongoose from 'mongoose';
import type { IReservationDocument } from '../interfaces/reservation.ts';
import IReservation from '../interfaces/reservation.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { NotificationService } from './notification.service.ts';
import { NotificationRepository } from '../repositories/notification.repository.ts';
import Guest from '../models/guest.model.ts';
import Hostel from '../models/hostel.model.ts';

export class ReservationService {
  private readonly _notificationService: NotificationService;

  constructor(
    private readonly _reservationRepo: ReservationRepository,
    private readonly _hostelRepo: HostelRepository
  ) {
    // Initialize notification service
    const notificationRepository = new NotificationRepository();
    this._notificationService = new NotificationService(notificationRepository);
  }

  async create(data: IReservation, ownerId: string): Promise<IReservationDocument> {
    const hostel = await this._hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new Error('Hostel not found for this user');
    }

    if (!data.user_id_guest) {
      throw new Error('User ID (Guest) is required');
    }

    const existingReservation = await this._reservationRepo.findActiveByGuestId(
      data.user_id_guest.toString()
    );
    if (existingReservation) {
      throw new Error('Guest already has an active reservation');
    }

    if (!data.room) {
      throw new Error('Room number is required');
    }

    if (!data.bed) {
      throw new Error('Bed number is required');
    }

    if (!data.checkin_date || !data.checkout_date) {
      throw new Error('Check-in and check-out dates are required');
    }

    const reservationData = {
      ...data,
      hostel_id: hostel._id,
    };

    const reservation = await this._reservationRepo.create(reservationData);

    try {
      // TODO CHAT: Implement adding guest to hostel group
      // await addGuestToHostelGroup(hostel._id, data.user_id_guest);
    } catch (error) {
      console.error('Error adding guest to hostel group:', error);
    }

    // Create notification for new reservation
    try {
      await this._notificationService.createReservationNotification(
        reservation._id.toString(),
        hostel._id.toString(),
        data.user_id_guest.toString(),
        data.room,
        data.bed,
        data.checkin_date,
        data.checkout_date
      );
    } catch (error) {
      console.error('Error creating reservation notification:', error);
    }

    return reservation;
  }

  getReservations() {
    return this._reservationRepo.findAll();
  }

  getReservationById(id: string) {
    return this._reservationRepo.findById(id);
  }

  updateReservation(id: string, data: Partial<IReservation>) {
    return this._reservationRepo.update(id, data);
  }

  deleteReservation(id: string) {
    return this._reservationRepo.delete(id);
  }

  async checkoutReservation(reservationId: string): Promise<IReservationDocument | null> {
    const session = await mongoose.startSession();

    try {
      let result: IReservationDocument | null = null;

      await session.withTransaction(async () => {
        const reservation = await this._reservationRepo.findById(reservationId);
        if (!reservation || reservation.status === 'checked out') {
          throw new Error('Reservation not found or already checked out');
        }

        const guestUserId = reservation.user_id_guest;
        const hostelId = reservation.hostel_id;

        await this._reservationRepo.update(reservationId, {
          status: 'checked out',
          checkout_processed_at: new Date(),
        });

        // TODO ROOM: Update room bed to remove reservation_id
        // await Room.updateOne(
        //   {
        //     name: reservation.room,
        //     'beds.bed': reservation.bed,
        //   },
        //   { $set: { 'beds.$.reservation_id': null } },
        //   { session }
        // );

        // 3) Remove guest reservation reference
        await Guest.updateOne(
          { user: guestUserId },
          { $pull: { reservations: reservationId } },
          { session }
        );

        // 4) Remove guest do grupo e da lista do hostel
        try {
          // TODO CHAT: Implement removing guest from hostel group
          // await removeGuestFromHostelGroup(hostelId, guestUserId);

          await Hostel.updateOne(
            { _id: hostelId },
            { $pull: { user_id_guests: guestUserId } },
            { session }
          );
        } catch (error) {
          console.error('Warning: failed to remove guest from hostel group or guest list', error);
        }

        result = await this._reservationRepo.findById(reservationId);

        // Create checkout notification
        try {
          if (!reservation.room || !reservation.bed) {
            throw new Error('Reservation room or bed is missing');
          }
          await this._notificationService.createCheckoutNotification(
            reservationId,
            hostelId.toString(),
            guestUserId.toString(),
            reservation.room,
            reservation.bed
          );
        } catch (error) {
          console.error('Error creating checkout notification:', error);
        }
      });

      return result;
    } catch (error) {
      console.error('Error during checkout:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
