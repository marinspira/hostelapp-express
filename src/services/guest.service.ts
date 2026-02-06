import { Types } from 'mongoose';
import type {
  IGuestDocument,
  IGuestByIdResponse,
  IGuest,
  IGuestResponse,
} from '../interfaces/guest.interface.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { BackendResponse } from '../interfaces/index.interface.ts';
import { BadRequestError, NotFoundError } from '../utils/errors.ts';
// @ts-ignore
import generateUniqueUsername from '../utils/generateUniqueUsername.js';
import User from '../models/user.model.ts';

export class GuestService {
  private guestRepo: GuestRepository;
  private hostelRepo: HostelRepository;

  constructor(guestRepository: GuestRepository, hostelRepository: HostelRepository) {
    this.guestRepo = guestRepository;
    this.hostelRepo = hostelRepository;
  }

  async create(
    guestData: IGuest,
    userId: Types.ObjectId,
    imagePaths?: string[]
  ): Promise<IGuestResponse> {
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

    if (!guest) {
      throw new BadRequestError('Failed to create guest profile');
    } else {
      await User.updateOne({ _id: userId }, { isNewUser: false });
    }

    return {
      success: true,
      message: 'Guest profile created successfully!',
      data: guest,
    };
  }

  async getByGuestId(guestId: string): Promise<IGuestByIdResponse> {
    const guest = await this.guestRepo.findById(guestId);
    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    return {
      success: true,
      message: 'Guest retrieved successfully',
      data: guest,
    };
  }

  async getByUserId(userId: Types.ObjectId): Promise<IGuestByIdResponse> {
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
    userId: Types.ObjectId,
    guestData: Partial<IGuest>,
    imagePaths?: string[]
  ): Promise<IGuestResponse> {
    const guest = await this.guestRepo.findByUserId(userId);
    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    if (imagePaths && imagePaths.length > 0) {
      const existingPhotos = guest.guest_photos || [];
      guestData.guest_photos = [...existingPhotos, ...imagePaths];
    }

    const allowedFields: (keyof IGuest)[] = [
      'name',
      'username',
      'phone',
      'guest_photos',
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

  async deleteGuest(guestId: string, userId: string): Promise<BackendResponse> {
    const guest = await this.guestRepo.findById(guestId);
    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    if (guest.user.toString() !== userId.toString()) {
      throw new BadRequestError('You are not authorized to delete this guest profile');
    }

    await this.guestRepo.delete(guestId);
    await this.guestRepo.deleteUser(userId);

    return {
      success: true,
      message: 'User deleted successfully',
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
}
