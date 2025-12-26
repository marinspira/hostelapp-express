// @ts-ignore
import Hostel from '../models/hostel.model.js';

export class HostelRepository {
  async findByOwner(ownerId: string) {
    return Hostel.findOne({ user_id_owners: ownerId });
  }
}