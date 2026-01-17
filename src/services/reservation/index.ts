import type { IReservationDocument } from "../../interfaces/reservation.ts";
import IReservation from "../../interfaces/reservation.ts";
import { ReservationRepository } from "../../repositories/reservation.repository.ts";
import { HostelRepository } from "../../repositories/hostel.repository.ts";
// @ts-ignore
import { addGuestToHostelGroup } from "../chat/groupChatManager.js";

export class ReservationService {
  constructor(
    private readonly reservationRepo: ReservationRepository,
    private readonly hostelRepo: HostelRepository
  ) {}

  async create(data: IReservation, ownerId: string): Promise<IReservationDocument> {
    const hostel = await this.hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new Error('Hostel not found for this user');
    }

    if (!data.user_id_guest) {
      throw new Error('User ID (Guest) is required');
    }

    const existingReservation = await this.reservationRepo.findActiveByGuestId(data.user_id_guest.toString());
    if (existingReservation) {
      throw new Error('Guest already has an active reservation');
    }

    if (!data.room_number) {
      throw new Error('Room number is required');
    }

    if (!data.bed_number) {
      throw new Error('Bed number is required');
    }

    if (!data.checkin_date || !data.checkout_date) {
      throw new Error('Check-in and check-out dates are required');
    }

    const reservationData = {
      ...data,
      hostel_id: hostel._id
    };

    const reservation = await this.reservationRepo.create(reservationData);

    try {
      await addGuestToHostelGroup(hostel._id, data.user_id_guest);
    } catch (error) {
      console.error('Error adding guest to hostel group:', error);
    }

    return reservation;
  }

  getReservations() {
    return this.reservationRepo.findAll();
  }

  getReservationById(id: string) {
    return this.reservationRepo.findById(id);
  }

  updateReservation(id: string, data: Partial<IReservation>) {
    return this.reservationRepo.update(id, data);
  }

  deleteReservation(id: string) {
    return this.reservationRepo.delete(id);
  }
}
