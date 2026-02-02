import mongoose from 'mongoose';
import type { 
  IReservationDocument, 
  ICreateReservationResponse, 
  IReservationListItemResponse,
  IReservationByIdResponse 
} from '../interfaces/reservation.ts';
import IReservation from '../interfaces/reservation.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { NotificationService } from './notification.service.ts';
import { BackendResponse } from '../interfaces/index.ts';
import { BadRequestError, NotFoundError } from '../utils/errors.ts';

export class ReservationService {
  private notificationService: NotificationService;
  private reservationRepo: ReservationRepository;
  private hostelRepo: HostelRepository;
  private guestRepo: GuestRepository;

  constructor(
    reservationRepository: ReservationRepository,
    hostelRepository: HostelRepository,
    guestRepository: GuestRepository,
    notificationService: NotificationService
  ) {
    this.reservationRepo = reservationRepository;
    this.hostelRepo = hostelRepository;
    this.guestRepo = guestRepository;
    this.notificationService = notificationService;
  }
 
  async create(data: IReservation, ownerId: string): Promise<ICreateReservationResponse> {
    const hostel = await this.hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found for this user');
    }

    if (!data.user_id_guest) {
      throw new BadRequestError('User ID (Guest) is required');
    }

    const existingReservation = await this.reservationRepo.findActiveByGuestId(
      data.user_id_guest.toString()
    );

    if (existingReservation) {
      throw new BadRequestError('Guest already has an active reservation');
    }

    if (!data.room) {
      throw new BadRequestError('Room number is required');
    }

    if (!data.bed) {
      throw new BadRequestError('Bed number is required');
    }

    if (!data.checkin_date || !data.checkout_date) {
      throw new BadRequestError('Check-in and check-out dates are required');
    }

    const reservationData = {
      ...data,
      hostel_id: hostel._id,
    };

    const reservation = await this.reservationRepo.create(reservationData);

    // Create notification for new reservation
    try {
      await this.notificationService.createReservationNotification(
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

    return { 
      success: true, 
      message: 'Reservation created successfully', 
      data: reservation 
    };
  }

  async getHostelReservations(ownerId: string): Promise<IReservationListItemResponse> {
    const hostel = await this.hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found for this user');
    }

    const reservations = await this.reservationRepo.findByHostelId(hostel._id.toString());
    return { 
      success: true, 
      message: 'Reservations retrieved successfully', 
      data: reservations 
    };
  }

  async getReservationById(id: string): Promise<IReservationByIdResponse> {
    const reservation = await this.reservationRepo.findById(id);
    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }
    return { 
      success: true, 
      message: 'Reservation retrieved successfully', 
      data: reservation 
    };
  }

  async updateReservation(id: string, data: Partial<IReservation>): Promise<IReservationByIdResponse> {
    const updated = await this.reservationRepo.update(id, data);
    if (!updated) {
      throw new NotFoundError('Reservation not found');
    }
    return { 
      success: true, 
      message: 'Reservation updated successfully', 
      data: updated 
    };
  }

  async deleteReservation(id: string): Promise<BackendResponse<null>> {
    const deleted = await this.reservationRepo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Reservation not found');
    }
    return { 
      success: true, 
      message: 'Reservation deleted successfully' 
    };
  }

  async checkoutReservation(reservationId: string): Promise<IReservationByIdResponse> {
    const session = await mongoose.startSession();

    try {
      let result: IReservationDocument | null = null;

      await session.withTransaction(async () => {
        // 1. Find and validate reservation
        const reservation = await this.reservationRepo.findById(reservationId);
        if (!reservation) {
          throw new NotFoundError('Reservation not found');
        }
        
        if (reservation.status === 'checked out') {
          throw new BadRequestError('Reservation is already checked out');
        }

        const guestUserId = reservation.user_id_guest;
        const hostelId = reservation.hostel_id;

        // 2. Update reservation status
        await this.reservationRepo.update(reservationId, {
          status: 'checked out',
          checkout_processed_at: new Date(),
        });

        // 3. Clean up guest and hostel relationships
        try {
          // Remove guest reservation reference
          await this.guestRepo.removeReservation(guestUserId, reservationId, session);

          // Remove guest from hostel guest list
          await this.hostelRepo.removeGuestFromHostel(hostelId, guestUserId, session);
          
        } catch (error) {
          console.error('Warning: failed to update guest/hostel relationships during checkout', error);
          // Continue with checkout process even if cleanup fails
        }

        // 4. Get updated reservation
        result = await this.reservationRepo.findById(reservationId);

        // 5. Create checkout notification
        try {
          if (!reservation.room || !reservation.bed) {
            throw new Error('Reservation room or bed information is missing');
          }
          await this.notificationService.createCheckoutNotification(
            reservationId,
            hostelId.toString(),
            guestUserId.toString(),
            reservation.room,
            reservation.bed
          );
        } catch (error) {
          console.error('Error creating checkout notification:', error);
          // Don't fail the checkout if notification creation fails
        }
      });

      if (!result) {
        throw new NotFoundError('Unable to retrieve reservation after checkout');
      }

      return { 
        success: true, 
        message: 'Checkout completed successfully', 
        data: result 
      };
    } catch (error) {
      console.error('Error during checkout process:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getCurrentGuestReservation(guestUserId: string): Promise<IReservationByIdResponse> {
    const reservation = await this.reservationRepo.findActiveByGuestId(guestUserId);
    if (!reservation) {
      throw new NotFoundError('No active reservation found');
    }
    return { 
      success: true, 
      message: 'Current reservation retrieved successfully', 
      data: reservation 
    };
  }

  async getGuestReservationHistory(guestUserId: string): Promise<IReservationListItemResponse> {
    const reservations = await this.reservationRepo.findByGuestId(guestUserId);
    return { 
      success: true, 
      message: 'Reservation history retrieved successfully', 
      data: reservations 
    };
  }
}
