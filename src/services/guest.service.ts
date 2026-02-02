import { Types } from 'mongoose';
import type {
  IGuestDocument,
  ICreateGuestResponse,
  IGuestByIdResponse,
  IGuest,
  IGuestCurrentStayResponse,
  IGuestCurrentStay,
} from '../interfaces/guest.interface.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { BackendResponse } from '../interfaces/index.ts';
import { BadRequestError, NotFoundError } from '../utils/errors.ts';
// @ts-ignore
import generateUniqueUsername from '../utils/generateUniqueUsername.js';

export class GuestService {
  private guestRepo: GuestRepository;
  private hostelRepo: HostelRepository;
  private reservationRepo: ReservationRepository;

  constructor(
    guestRepository: GuestRepository,
    hostelRepository: HostelRepository,
    reservationRepository: ReservationRepository
  ) {
    this.guestRepo = guestRepository;
    this.hostelRepo = hostelRepository;
    this.reservationRepo = reservationRepository;
  }

  async create(
    guestData: IGuest,
    userId: string,
    imagePaths?: string[]
  ): Promise<ICreateGuestResponse> {
    if (!guestData || !guestData.name || guestData.name.trim() === '') {
      throw new BadRequestError('Guest name is required');
    }

    const existingGuest = await this.guestRepo.findByUserId(userId);
    if (existingGuest) {
      throw new BadRequestError('Guest already exists');
    }

    const username = await generateUniqueUsername(guestData.name);

    const newGuestData = {
      name: guestData.name,
      username: username,
      guest_photos: imagePaths,
      phone: guestData.phone,
      birthday: guestData.birthday,
      country: guestData.country,
      passaportPhoto: guestData.passaportPhoto,
      interests: guestData.interests,
      description: guestData.description,
      languages: guestData.languages,
      digitalNomad: guestData.digitalNomad,
      smoker: guestData.smoker,
      pets: guestData.pets,
      showProfileAuthorization: guestData.showProfileAuthorization,
      user: new Types.ObjectId(userId),
    };

    const guest = await this.guestRepo.create(newGuestData);

    return {
      success: true,
      message: 'Guest profile created successfully!',
      data: guest,
    };
  }

  async getByUserId(userId: string): Promise<IGuestByIdResponse> {
    const guest = await this.guestRepo.findByUserId(userId);
    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    return {
      success: true,
      message: 'Guest retrieved successfully',
      data: guest,
    };
  }

  async update(
    userId: string,
    guestData: Partial<IGuest>
  ): Promise<BackendResponse<IGuestDocument>> {
    const guest = await this.guestRepo.findByUserId(userId);
    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    const allowedFields: (keyof IGuest)[] = [
      'name',
      'username',
      'guest_photos',
      'phone',
      'birthday',
      'country',
      'passaportPhoto',
      'interests',
      'description',
      'languages',
      'digitalNomad',
      'smoker',
      'pets',
      'instagram',
      'linkedin',
      'twitter',
      'showProfileAuthorization',
    ];

    const updateData: any = {};
    Object.keys(guestData).forEach(key => {
      if (allowedFields.includes(key as keyof IGuest)) {
        updateData[key as keyof IGuest] = guestData[key as keyof IGuest];
      }
    });

    const updatedGuest = await this.guestRepo.update(guest._id.toString(), updateData);
    if (!updatedGuest) {
      throw new NotFoundError('Failed to update guest');
    }

    return {
      success: true,
      message: 'Guest updated successfully',
      data: updatedGuest,
    };
  }

  async searchGuests(
    username: string,
    hostelOwnerId: string
  ): Promise<BackendResponse<IGuestDocument[]>> {
    const hostel = await this.hostelRepo.findByOwner(hostelOwnerId);
    if (!hostel) {
      throw new BadRequestError('Hostel not found for this user');
    }

    const guests = await this.guestRepo.searchByUsernameOrEmail(username, hostel._id.toString());

    if (guests.length === 0) {
      return {
        success: true,
        message: 'No guest or user found with the given username.',
        data: [],
      };
    }

    return {
      success: true,
      message: 'Guest(s) found successfully.',
      data: guests,
    };
  }

  async updateGuestPhoto(
    userId: string,
    imageId: number,
    imagePath: string
  ): Promise<BackendResponse<{ imagePath: string }>> {
    let guest = await this.guestRepo.findByUserId(userId);

    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    if (imageId < guest.guest_photos.length) {
      guest.guest_photos[imageId] = imagePath;
    } else {
      guest.guest_photos.push(imagePath);
    }

    await this.guestRepo.update(guest._id.toString(), { guest_photos: guest.guest_photos });

    return {
      success: true,
      message: 'Guest images updated.',
    };
  }

  async deleteGuestPhoto(
    userId: string,
    imageId: number
  ): Promise<BackendResponse<{ imagePath: string }>> {
    const guest = await this.guestRepo.findByUserId(userId);
    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    if (imageId >= guest.guest_photos.length) {
      throw new NotFoundError('Image not found');
    }

    const imagePath = guest.guest_photos[imageId];
    guest.guest_photos.splice(imageId, 1);

    await this.guestRepo.update(guest._id.toString(), { guest_photos: guest.guest_photos });

    return {
      success: true,
      message: 'Image successfully deleted',
      data: { imagePath },
    };
  }

  async getCurrentStay(userId: string): Promise<IGuestCurrentStayResponse> {
    const guest = await this.guestRepo.findByUserId(userId);
    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    const reservation = await this.reservationRepo.findCurrentStayByGuestId(userId);
    if (!reservation) {
      return {
        success: true,
        message: 'No current reservation',
      };
    }

    const hostel = await this.hostelRepo.findById(reservation.hostel_id.toString());
    const now = new Date();

    const activeReservation: IGuestCurrentStay = {
      reservationId: reservation._id.toString(),
      hostel: {
        _id: hostel?._id.toString(),
        name: hostel?.name,
        logo: hostel?.logo,
        address: hostel?.address,
        phone: hostel?.phone,
        email: hostel?.email,
      },
      room: reservation.room,
      bed: reservation.bed,
      checkinDate: reservation.checkin_date,
      checkoutDate: reservation.checkout_date,
      status: reservation.status,
      daysRemaining: Math.ceil(
        (new Date(reservation.checkout_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    };

    return {
      success: true,
      message: 'Guest is currently staying at hostel(s)',
      data: activeReservation,
    };
  }
}
