// @ts-ignore
import { Types } from 'mongoose';
import Hostel from '../models/hostel.model.ts';

export class HostelRepository {
  async findByOwner(ownerId: Types.ObjectId | string) {
    return Hostel.findOne({ user_id_owners: ownerId });
  }

  async findById(id: string) {
    return Hostel.findById(id);
  }

  async findByLocation(city: string, country: string) {
    return Hostel.find({
      'address.city': { $regex: new RegExp(city, 'i') },
      'address.country': { $regex: new RegExp(country, 'i') },
    }).select('_id');
  }
}
