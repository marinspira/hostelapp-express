// @ts-ignore
import { Types } from 'mongoose';

import Hostel from '../models/hostel.model.ts';
import { IHostel, IHostelDocument } from '../interfaces/hostel.interface.ts';
import User from '../models/user.model.ts';

export class HostelRepository {
  async findByOwner(ownerId: Types.ObjectId | string): Promise<IHostelDocument | null> {
    return Hostel.findOne({ user_id_owners: ownerId });
  }

  async findOwnerByHostelId(hostelId: Types.ObjectId | string): Promise<Types.ObjectId[] | null> {
    const hostel = await Hostel.findById(hostelId).select('user_id_owners');
    return hostel && hostel.user_id_owners ? hostel.user_id_owners : null;
  }

  async findById(id: Types.ObjectId): Promise<IHostelDocument | null> {
    return Hostel.findById(id);
  }

  async findByLocation(city: string, country: string): Promise<IHostelDocument[]> {
    return Hostel.find({
      'address.city': { $regex: new RegExp(city.trim(), 'i') },
      'address.country': { $regex: new RegExp(country.trim(), 'i') },
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

  async delete(hostelId: Types.ObjectId): Promise<IHostelDocument | null> {
    return await Hostel.findByIdAndDelete(hostelId);
  }

  async deleteUser(userId: Types.ObjectId): Promise<void> {
    await User.deleteOne({ _id: userId });
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

  async checkUserAccessToHostel(
    hostelId: Types.ObjectId,
    userId: string | Types.ObjectId
  ): Promise<boolean> {
    const hostel = await Hostel.findOne({
      _id: hostelId,
      $or: [{ user_id_owners: userId }, { user_id_guests: userId }, { user_id_staffs: userId }],
    });
    return !!hostel;
  }
}
