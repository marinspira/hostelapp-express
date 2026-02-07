import { Types } from 'mongoose';

import type {
  ICreateHostelResponse,
  IHostelByIdResponse,
  IGuestListResponse,
  IHostel,
} from '../interfaces/hostel.interface.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { BackendResponse } from '../interfaces/index.interface.ts';
import { BadRequestError, NotFoundError } from '../utils/errors.ts';
// @ts-ignore
import generateUniqueUsername from '../utils/generateUniqueUsername.js';
// @ts-ignore
import countries from '../utils/coutries.js';
import { IReservationDocument } from '../interfaces/reservation.interface.ts';
import { IGuest } from '../interfaces/guest.interface.ts';

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

  async getById(hostelId: Types.ObjectId, userId: Types.ObjectId): Promise<IHostelByIdResponse> {
    const hostel = await this.hostelRepo.findById(hostelId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found');
    }

    const hasAccess = await this.hostelRepo.checkUserAccessToHostel(hostelId, userId);
    if (!hasAccess) {
      throw new BadRequestError('You do not have access to this hostel');
    }

    return {
      success: true,
      message: 'Hostel found successfully!',
      data: hostel,
    };
  }

  async create(
    hostelData: any,
    ownerId: string,
    logoPath?: string
  ): Promise<ICreateHostelResponse> {
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
        street: hostelData.address?.street || hostelData.street,
        city: hostelData.address?.city || hostelData.city,
        country: hostelData.address?.country || hostelData.country,
        zip: hostelData.address?.zip || hostelData.zip,
      },
      currency: currency,
      phone: hostelData.phone,
      email: hostelData.email,
      website: hostelData.website,
      experience_with_volunteers: hostelData.experience_with_volunteers,
      user_id_owners: [new Types.ObjectId(ownerId)],
      policies: hostelData.policies || false,
    };

    const hostel = await this.hostelRepo.create(newHostelData);

    return {
      success: true,
      message: 'Hostel created!',
      data: hostel,
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
      data: hostel,
    };
  }

  async update(
    ownerId: string,
    updateData: Partial<IHostel>,
    logoPath?: string
  ): Promise<IHostelByIdResponse> {
    const hostel = await this.hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found');
    }

    if (logoPath) {
      updateData.logo = logoPath;
    }

    const allowedFields: (keyof IHostel)[] = [
      'logo',
      'name',
      'username',
      'address',
      'phone',
      'email',
      'website',
      'experience_with_volunteers',
      'currency',
      'policies',
    ];

    const filteredUpdateData: any = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key as keyof IHostel)) {
        filteredUpdateData[key as keyof IHostel] = updateData[key as keyof IHostel];
      }
    });

    const updatedHostel = await this.hostelRepo.update(hostel._id.toString(), filteredUpdateData);
    if (!updatedHostel) {
      throw new NotFoundError('Failed to update hostel');
    }

    return {
      success: true,
      message: 'Hostel updated successfully',
      data: updatedHostel,
    };
  }

  async delete(ownerId: Types.ObjectId): Promise<BackendResponse<null>> {
    const hostel = await this.hostelRepo.findByOwner(ownerId);
    if (!hostel) {
      throw new NotFoundError('Hostel not found');
    }

    await this.hostelRepo.delete(hostel._id);
    await this.hostelRepo.deleteUser(ownerId);

    return {
      success: true,
      message: 'Hostel and user deleted successfully',
    };
  }
}
