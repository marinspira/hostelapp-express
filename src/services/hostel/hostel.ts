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

  async createHostel(hostelData: any) {
    // Create hostel logic
  }

  async getHostelDetails(hostelId: string) {
    // Fetch hostel details logic
  }

    async updateHostelInfo(hostelId: string, updateData: any) {
    // Update hostel information logic
  }

    async deleteHostel(hostelId: string) {
    // Delete hostel logic
  }
}