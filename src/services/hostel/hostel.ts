// @ts-ignore
import Hostel from '../../models/hostel.model.js';
import { IUser } from '../../interfaces/index.js';

export default class HostelService {
  constructor() {
    // Initialization code
  }

  public async findHostelsByOwner(user: IUser) {
    const hostel = await Hostel.findOne({ user_id_owners: user._id });
    return hostel;
  }

  async createHostel(_hostelData: any) {
    // Create hostel logic
  }

  async getHostelDetails(_hostelId: string) {
    // Fetch hostel details logic
  }

  async updateHostelInfo(_hostelId: string, _updateData: any) {
    // Update hostel information logic
  }

  async deleteHostel(_hostelId: string) {
    // Delete hostel logic
  }
}
