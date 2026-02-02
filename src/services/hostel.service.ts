import { Types } from 'mongoose';
import type { 
  IHostelDocument,
  ICreateHostelResponse,
  IHostelByIdResponse,
  IGuestListResponse,
  IHostel 
} from '../interfaces/hostel.interface.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { BackendResponse } from '../interfaces/index.ts';
import { BadRequestError, NotFoundError } from '../utils/errors.ts';
// @ts-ignore
import generateUniqueUsername from '../utils/generateUniqueUsername.js';
// @ts-ignore
import countries from '../utils/coutries.js';
import IReservation from '../interfaces/reservation.interface.ts';

export class HostelService {
  private hostelRepo: HostelRepository;
  private reservationRepo: ReservationRepository;
  private guestRepo: GuestRepository;

  constructor(
    hostelRepository: HostelRepository,
    reservationRepository: ReservationRepository,
    guestRepository: GuestRepository
  ) {
    this.hostelRepo = hostelRepository;
    this.reservationRepo = reservationRepository;
    this.guestRepo = guestRepository;
  }

  async getById(hostelId: string): Promise<IHostelByIdResponse> {
    const hostel = await this.hostelRepo.findById(hostelId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found');
    }

    return {
      success: true,
      message: 'Hostel found successfully!',
      data: hostel
    };
  }

  async create(hostelData: any, ownerId: string, logoPath?: string): Promise<ICreateHostelResponse> {
    if (!hostelData || !hostelData.name || hostelData.name.trim() === '') {
      throw new BadRequestError('Hostel name is required');
    }

    const existingHostel = await this.hostelRepo.findByOwner(ownerId);
    if (existingHostel) {
      throw new BadRequestError('Hostel already exists');
    }

    const countryData = countries.find((c: any) => c.country === hostelData.country);
    const currency = countryData ? countryData.currency : 'EUR';

    const username = await generateUniqueUsername(hostelData.name);

    const newHostelData: Partial<IHostel> = {
      username: username,
      name: hostelData.name,
      logo: logoPath,
      address: {
        street: hostelData.street,
        city: hostelData.city,
        country: hostelData.country,
        zip: hostelData.zip,
      },
      currency: currency,
      phone: hostelData.phone,
      email: hostelData.email,
      website: hostelData.website,
      experience_with_volunteers: hostelData.experience_with_volunteers,
      user_id_owners: [new Types.ObjectId(ownerId)],
      policies: false,
    };

    const hostel = await this.hostelRepo.create(newHostelData);

    return {
      success: true,
      message: 'Hostel created!',
      data: hostel
    };
  }

  async getByOwnerId(ownerId: string): Promise<IHostelByIdResponse> {
    const hostel = await this.hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found');
    }

    return {
      success: true,
      message: 'Hostel found successfully!',
      data: hostel
    };
  }

  async update(ownerId: string, updateData: Partial<IHostel>): Promise<IHostelByIdResponse> {
    const hostel = await this.hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found');
    }

    const updatedHostel = await this.hostelRepo.update(hostel._id.toString(), updateData);
    if (!updatedHostel) {
      throw new NotFoundError('Failed to update hostel');
    }

    return {
      success: true,
      message: 'Hostel updated successfully',
      data: updatedHostel
    };
  }

  async delete(ownerId: string): Promise<BackendResponse<null>> {
    const hostel = await this.hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found');
    }

    await this.hostelRepo.delete(hostel._id.toString());

    return {
      success: true,
      message: 'Hostel deleted successfully'
    };
  }

  async getAllCurrentGuests(ownerId: string): Promise<IGuestListResponse> {
    const hostel = await this.hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found');
    }

    // Get current reservations (in house and walking in status)
    const currentReservations = await this.reservationRepo.findCurrentGuestsByHostelId(hostel._id.toString());

    if (!currentReservations.length) {
      return {
        success: true,
        message: 'No current guests found',
        data: []
      };
    }

    // Group reservations by guest and keep only the most recent one for each guest
    const guestReservationsMap = new Map();

    currentReservations.forEach((reservation: IReservation) => {
      const guestId = reservation.user_id_guest._id ? reservation.user_id_guest._id.toString() : reservation.user_id_guest.toString();
      const existingReservation = guestReservationsMap.get(guestId);

      if (!existingReservation) {
        guestReservationsMap.set(guestId, reservation);
      } else {
        // Keep the reservation with the most recent checkin date
        const currentReservationDate = new Date(reservation.checkin_date);
        const existingReservationDate = new Date(existingReservation.checkin_date);

        if (currentReservationDate > existingReservationDate) {
          guestReservationsMap.set(guestId, reservation);
        }
      }
    });

    const uniqueReservations = Array.from(guestReservationsMap.values());

    // Get guest details for unique reservations
    const guests = [];
    
    for (const reservation of uniqueReservations) {
      const guestUserId = reservation.user_id_guest._id || reservation.user_id_guest;
      const guestData = await this.guestRepo.findByUserId(guestUserId);
      
      guests.push({
        user_id: guestUserId,
        name: guestData?.name || 'Unknown',
        email: reservation.user_id_guest.email || 'Unknown',
        first_photo: guestData?.guest_photos?.[0] || '',
        room: reservation.room,
        bed: reservation.bed,
        checkin_date: reservation.checkin_date,
        checkout_date: reservation.checkout_date,
        reservation_id: reservation._id,
      });
    }

    return {
      success: true,
      message: 'Guests retrieved successfully',
      data: guests
    };
  }
}
