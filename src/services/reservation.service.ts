import mongoose, { Types } from 'mongoose';

import type {
  IReservationDocument,
  ICreateReservationResponse,
  IReservationListItemResponse,
  IReservationByIdResponse,
  IReservationCreateRequest,
  IReservation,
  IOthersGuestsListResponse,
  IOtherGuest,
  ICurrentStayResponse,
  IReservationsForHostResponse,
} from '../interfaces/reservation.interface.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { BackendResponse } from '../interfaces/index.interface.ts';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors.ts';

import { NotificationService } from './notification.service.ts';

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

  async create(
    data: IReservationCreateRequest,
    ownerId: string
  ): Promise<ICreateReservationResponse> {
    const hostel = await this.hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found for this user');
    }

    if (!data.user_id_guest) {
      throw new BadRequestError('User ID (Guest) is required');
    }

    const userIdGuest = new Types.ObjectId(data.user_id_guest);
    const guest = await this.guestRepo.findByUserId(userIdGuest);

    if (!guest) {
      throw new NotFoundError('Guest not found for the provided user ID');
    }

    // Check if guest already has an active reservation
    const existingGuestReservationForDates = await this.reservationRepo.findStayByGuestIdAndDate(
      userIdGuest,
      new Date(data.checkin_date),
      new Date(data.checkout_date)
    );

    if (existingGuestReservationForDates) {
      throw new BadRequestError('Guest already has an active reservation for the specified dates');
    }

    if (!data.room) {
      throw new BadRequestError('Room number is required');
    }

    if (!data.bed) {
      throw new BadRequestError('Bed number is required');
    }

    // Check if the specific room/bed combination is already reserved for overlapping dates
    const existingRoomReservation = await this.reservationRepo.findByRoomAndBedWithDateOverlap(
      hostel._id,
      data.room,
      data.bed,
      new Date(data.checkin_date),
      new Date(data.checkout_date)
    );

    if (existingRoomReservation) {
      throw new BadRequestError(
        `Room ${data.room}, bed ${data.bed} is already reserved for the specified dates`
      );
    }

    if (!data.bed) {
      throw new BadRequestError('Bed number is required');
    }

    if (!data.checkin_date || !data.checkout_date) {
      throw new BadRequestError('Check-in and check-out dates are required');
    }

    if (new Date(data.checkin_date) >= new Date(data.checkout_date)) {
      throw new BadRequestError('Check-out date must be after check-in date');
    }

    // Compare only the date part (not time) to avoid issues with same-day bookings
    const checkinDateOnly = new Date(data.checkin_date).toDateString();
    const currentDateOnly = new Date().toDateString();
    
    if (new Date(checkinDateOnly) < new Date(currentDateOnly)) {
      throw new BadRequestError('Check-in date cannot be in the past');
    }

    let status: 'walking in' | 'in house' | 'checked out';
    if (new Date(data.checkin_date) > new Date()) {
      status = 'walking in';
    } else if (
      new Date(data.checkin_date) <= new Date() &&
      new Date(data.checkout_date) > new Date()
    ) {
      status = 'in house';
    } else {
      status = 'checked out';
    }

    const reservationData: IReservation = {
      ...data,
      hostel_id: hostel._id,
      user_id_guest: userIdGuest,
      status: status,
    };

    const reservation = await this.reservationRepo.create(reservationData);

    // Create notification for new reservation
    try {
      const ownerIds = hostel.user_id_owners || [];
      const recipients = [userIdGuest, ...ownerIds];

      await this.notificationService.createNotification({
        recipients: recipients.map(userId => ({ userId, read: false })),
        type: 'reservation_created',
        title: 'New Reservation Created',
        message: `A new reservation has been created at ${hostel.name} for room ${data.room}, bed ${data.bed} from ${new Date(
          data.checkin_date
        ).toLocaleDateString()} to ${new Date(data.checkout_date).toLocaleDateString()}.`,
        data: {
          reservationId: reservation._id,
          hostelId: hostel._id,
          guestId: userIdGuest,
          guest_name: guest.name,
          hostel_name: hostel.name,
          room: data.room,
          bed: data.bed,
          checkin_date: data.checkin_date,
          checkout_date: data.checkout_date,
        },
      });
    } catch (error) {
      console.error('Error creating reservation notification:', error);
    }

    return {
      success: true,
      message: 'Reservation created successfully',
      data: reservation,
    };
  }

  async getHostelReservations(ownerId: string): Promise<IReservationsForHostResponse> {
    const hostel = await this.hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found for this user');
    }

    const reservations = await this.reservationRepo.findByHostelId(hostel._id.toString());

    const reservationsWithGuestInfo = await Promise.all(
      reservations.map(async reservation => {
        const guest = await this.guestRepo.findByUserId(reservation.user_id_guest);
        const user = guest ? await this.guestRepo.findUserByGuestId(guest._id) : null;

        if (!guest || !user) {
          console.warn(
            `Warning: Guest or user information missing for reservation ${reservation._id.toString()}`
          );
        }

        return {
          reservationId: reservation._id.toString(),
          status: reservation.status,
          hostel_id: reservation.hostel_id.toString(),
          guest: {
            _id: guest ? guest._id.toString() : '',
            username: guest ? guest.name : '',
            email: user && user.email ? user.email : '',
            phone: guest && guest.phone ? guest.phone : '',
            photo: guest && guest.guest_photos && guest.guest_photos[0] ? guest.guest_photos[0] : '',
          },
          room: reservation.room,
          bed: reservation.bed,
          checkin_date: reservation.checkin_date,
          checkout_date: reservation.checkout_date,
          checkout_processed_at: reservation.checkout_processed_at,
        };
      })
    );

    return {
      success: true,
      message: 'Reservations retrieved successfully',
      data: reservationsWithGuestInfo,
    };
  }

  async listOtherGuestsInHostel(hostelId: string): Promise<IOthersGuestsListResponse> {
    const hostelReservations = await this.reservationRepo.findCurrentGuestsByHostelId(
      new Types.ObjectId(hostelId)
    );

    const otherGuestsMap: Record<string, IOtherGuest> = {};

    for (const reservation of hostelReservations) {
      const guestId = reservation.user_id_guest.toString();
      if (!otherGuestsMap[guestId]) {
        const guest = await this.guestRepo.findByUserId(reservation.user_id_guest);
        if (guest) {
          otherGuestsMap[guestId] = {
            guestId: guest._id,
            name: guest.name,
            photo: guest.guest_photos[0] || '',
          };
        }
      }
    }

    const otherGuests = Object.values(otherGuestsMap);

    return {
      success: true,
      message: 'Other guests retrieved successfully',
      data: otherGuests,
    };
  }

  async getReservationById(
    userId: Types.ObjectId,
    reservationId: string
  ): Promise<IReservationByIdResponse> {
    const reservation: IReservationDocument | null =
      await this.reservationRepo.findById(reservationId);

    if (!reservation) {
      throw new NotFoundError('Reservation not found');
    }

    const ownersIds = await this.hostelRepo.findOwnerByHostelId(reservation.hostel_id);
    const guestId = new Types.ObjectId(reservation.user_id_guest);

    const isGuest = guestId.equals(userId);
    const isOwner = ownersIds?.some(ownerId => ownerId.equals(userId)) || false;

    if (!isGuest && !isOwner) {
      throw new UnauthorizedError('You do not have permission to view this reservation');
    }

    return {
      success: true,
      message: 'Reservation retrieved successfully',
      data: reservation,
    };
  }

  async updateReservation(
    id: string,
    updateData: Partial<IReservation>
  ): Promise<IReservationByIdResponse> {
    const allowedFields: (keyof IReservation)[] = ['checkin_date', 'checkout_date', 'room', 'bed'];

    const providedFields = Object.keys(updateData);
    const unauthorizedFields = providedFields.filter(
      field => !allowedFields.includes(field as keyof IReservation)
    );

    if (unauthorizedFields.length > 0) {
      throw new BadRequestError(
        `The following fields are not allowed to be updated: ${unauthorizedFields.join(', ')}.`
      );
    }

    // Get current reservation data to merge with updates
    const currentReservation = await this.reservationRepo.findById(id);
    if (!currentReservation) {
      throw new NotFoundError('Reservation not found');
    }

    // Merge current data with updates to validate dates properly
    const checkinDate = updateData.checkin_date
      ? new Date(updateData.checkin_date)
      : new Date(currentReservation.checkin_date);
    const checkoutDate = updateData.checkout_date
      ? new Date(updateData.checkout_date)
      : new Date(currentReservation.checkout_date);

    // Validate dates
    if (checkinDate >= checkoutDate) {
      throw new BadRequestError('Check-out date must be after check-in date');
    }

    // Compare only the date part (not time) to avoid issues with same-day bookings
    if (updateData.checkin_date) {
      const checkinDateOnly = new Date(updateData.checkin_date).toDateString();
      const currentDateOnly = new Date().toDateString();
      
      if (new Date(checkinDateOnly) < new Date(currentDateOnly)) {
        throw new BadRequestError('Check-in date cannot be in the past');
      }
    }

    // Check if the specific room/bed combination is already reserved for overlapping dates
    const existingRoomReservation = await this.reservationRepo.findByRoomAndBedWithDateOverlap(
      currentReservation.hostel_id,
      updateData.room ?? currentReservation.room,
      updateData.bed ?? currentReservation.bed,
      checkinDate,
      checkoutDate
    );

    if (
      existingRoomReservation?.user_id_guest.toString() !==
      currentReservation.user_id_guest.toString()
    ) {
      throw new BadRequestError(
        `Room ${updateData.room ?? currentReservation.room}, bed ${updateData.bed ?? currentReservation.bed} is already reserved for the specified dates`
      );
    }

    const filteredUpdateData: any = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key as keyof IReservation)) {
        filteredUpdateData[key as keyof IReservation] = updateData[key as keyof IReservation];
      }
    });

    const newCheckinDate = new Date(filteredUpdateData.checkin_date);
    const newCheckoutDate = new Date(filteredUpdateData.checkout_date);

    if (newCheckinDate < new Date()) {
      filteredUpdateData.status = 'walking in';
    } else if (newCheckinDate <= new Date() && newCheckoutDate > new Date()) {
      filteredUpdateData.status = 'in house';
    } else if (newCheckoutDate <= new Date()) {
      filteredUpdateData.status = 'checked out';
    }

    const updated = await this.reservationRepo.update(id, filteredUpdateData);
    if (!updated) {
      throw new NotFoundError('Reservation not found');
    }
    return {
      success: true,
      message: 'Reservation updated successfully',
      data: updated,
    };
  }

  async deleteReservation(id: string): Promise<BackendResponse<null>> {
    const deleted = await this.reservationRepo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Reservation not found');
    }
    return {
      success: true,
      message: 'Reservation deleted successfully',
    };
  }

  async checkoutReservation(reservationId: string): Promise<IReservationByIdResponse> {
    const session = await mongoose.startSession();

    try {
      let result: IReservationDocument | null = null;

      const reservation = await this.reservationRepo.findById(reservationId);
      if (!reservation) {
        throw new NotFoundError('Reservation not found');
      }

      if (reservation.checkin_date > new Date()) {
        throw new BadRequestError('Cannot check out a reservation that has not started yet');
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

      // 3. Remove guest from hostel guest list
      try {
        await this.hostelRepo.removeGuestFromHostel(hostelId, guestUserId);
      } catch (error) {
        console.error(
          'Warning: failed to update guest/hostel relationships during checkout',
          error
        );
      }

      // 4. Get updated reservation
      result = await this.reservationRepo.findById(reservationId);

      // 5. Create checkout notification
      try {
        if (!reservation.room || !reservation.bed) {
          throw new Error('Reservation room or bed information is missing');
        }

        const hostel = await this.hostelRepo.findById(hostelId);
        const ownerIds = hostel?.user_id_owners || [];
        const recipients = [guestUserId, ...ownerIds];

        await this.notificationService.createNotification({
          recipients: recipients.map(userId => ({ userId, read: false })),
          type: 'guest_checkedout',
          title: 'Guest Checked Out',
          message: `Guest has checked out from room ${reservation.room}, bed ${reservation.bed}.`,
          data: {
            reservationId: reservationId,
            hostelId: hostelId.toString(),
            guestId: guestUserId.toString(),
            room: reservation.room,
            bed: reservation.bed,
            checkout_processed_at: new Date(),
          },
        });
      } catch (error) {
        console.error('Error creating checkout notification:', error);
        // Don't fail the checkout if notification creation fails
      }

      if (!result) {
        throw new NotFoundError('Unable to retrieve reservation after checkout');
      }

      return {
        success: true,
        message: 'Checkout completed successfully',
        data: result,
      };
    } catch (error) {
      console.error('Error during checkout process:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getCurrentGuestReservation(guestUserId: Types.ObjectId): Promise<ICurrentStayResponse> {
    const reservation = await this.reservationRepo.findCurrentStayByGuestId(guestUserId);

    if (!reservation) {
      return {
        success: true,
        message: 'No current reservation found for this guest',
        data: null,
      };
    }

    const hostel = await this.hostelRepo.findById(reservation.hostel_id);

    const checkoutDate = new Date(reservation.checkout_date);
    const currentDate = new Date();
    const daysRemaining = Math.ceil(
      (checkoutDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24)
    );

    const transformedData = {
      reservationId: reservation._id.toString(),
      hostel: {
        id: reservation.hostel_id.toString(),
        name: hostel?.name || '',
        logo: hostel?.logo || '',
        address: {
          street: hostel?.address?.street || '',
          city: hostel?.address?.city || '',
          country: hostel?.address?.country || '',
          zip: hostel?.address?.zip || '',
        },
        phone: hostel?.phone || '',
        email: hostel?.email || '',
      },
      room: reservation.room,
      bed: reservation.bed,
      checkinDate: reservation.checkin_date,
      checkoutDate: reservation.checkout_date,
      status: reservation.status,
      daysRemaining: daysRemaining,
    };

    return {
      success: true,
      message: 'Current reservation retrieved successfully',
      data: transformedData,
    };
  }

  async getGuestReservationHistory(guestUserId: string): Promise<IReservationListItemResponse> {
    const reservations = await this.reservationRepo.findByGuestId(guestUserId);
    return {
      success: true,
      message: 'Reservation history retrieved successfully',
      data: reservations,
    };
  }
}
