// @ts-ignore
import { Types } from 'mongoose';

import Hostel from '../models/hostel.model.ts';
import { IHostel, IHostelDocument } from '../interfaces/hostel.interface.ts';

export class HostelRepository {
  async findByOwner(ownerId: Types.ObjectId | string): Promise<IHostelDocument | null> {
    return Hostel.findOne({ user_id_owners: ownerId });
  }

  async findById(id: string): Promise<IHostelDocument | null> {
    return Hostel.findById(id);
  }

  async findByLocation(city: string, country: string): Promise<IHostelDocument[]> {
    return Hostel.find({
      'address.city': { $regex: new RegExp(city, 'i') },
      'address.country': { $regex: new RegExp(country, 'i') },
    }).select('_id');
  }

  async create(hostelData: Partial<IHostel>): Promise<IHostelDocument> {
    const hostel = new Hostel(hostelData);
    return await hostel.save();
  }

  async update(hostelId: string, updateData: Partial<IHostel>): Promise<IHostelDocument | null> {
    return await Hostel.findByIdAndUpdate(hostelId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(hostelId: string): Promise<IHostelDocument | null> {
    return await Hostel.findByIdAndDelete(hostelId);
  }

  async removeGuestFromHostel(
    hostelId: string | Types.ObjectId,
    guestUserId: string | Types.ObjectId
  ): Promise<void> {
    await Hostel.updateOne({ _id: hostelId }, { $pull: { user_id_guests: guestUserId } });
  }

  async addGuestToHostel(
    hostelId: string | Types.ObjectId,
    guestUserId: string | Types.ObjectId
  ): Promise<void> {
    await Hostel.updateOne({ _id: hostelId }, { $addToSet: { user_id_guests: guestUserId } });
  }
}
