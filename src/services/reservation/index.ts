import type { IReservationDocument } from '../../interfaces/reservation.ts';
import IReservation from '../../interfaces/reservation.ts';
import { ReservationRepository } from '../../repositories/reservation.repository.ts';
import { HostelRepository } from '../../repositories/hostel.repository.ts';
// @ts-ignore
import { addGuestToHostelGroup, removeGuestFromHostelGroup } from '../chat/groupChatManager.js';
// @ts-ignore
import Room from '../../models/room.model.ts';
// @ts-ignore
import Guest from '../../models/guest.model.ts';
// @ts-ignore
import Hostel from '../../models/hostel.model.ts';
import mongoose from 'mongoose';

export class ReservationService {
  constructor(
    private readonly _reservationRepo: ReservationRepository,
    private readonly _hostelRepo: HostelRepository
  ) {}

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
      await addGuestToHostelGroup(hostel._id, data.user_id_guest);
    } catch (error) {
      console.error('Error adding guest to hostel group:', error);
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
        // Busca a reserva
        const reservation = await this._reservationRepo.findById(reservationId);
        if (!reservation || reservation.status === 'checked out') {
          throw new Error('Reservation not found or already checked out');
        }

        const guestUserId = reservation.user_id_guest;
        const hostelId = reservation.hostel_id;

        // 1) Atualiza status da reserva
        await this._reservationRepo.update(reservationId, { 
          status: 'checked out',
          checkout_processed_at: new Date()
        });

        // 2) Limpa reservation_id da cama
        await Room.updateOne(
          {
            name: reservation.room,
            'beds.bed': reservation.bed,
          },
          { $set: { 'beds.$.reservation_id': null } },
          { session }
        );

        // 3) Remove reservation da lista do guest
        await Guest.updateOne(
          { user: guestUserId },
          { $pull: { reservations: reservationId } },
          { session }
        );

        // 4) Remove guest do grupo e da lista do hostel
        try {
          await removeGuestFromHostelGroup(hostelId, guestUserId);
          
          await Hostel.updateOne(
            { _id: hostelId },
            { $pull: { user_id_guests: guestUserId } },
            { session }
          );
        } catch (error) {
          console.error('Warning: failed to remove guest from hostel group or guest list', error);
        }

        result = await this._reservationRepo.findById(reservationId);
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
