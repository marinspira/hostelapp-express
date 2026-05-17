import { Types } from 'mongoose';

import type { IRoleSchedule, IRoleScheduleDocument } from '../interfaces/role-schedule.interface';
import RoleSchedule from '../models/role-schedule.model';

export class RoleScheduleRepository {
  async create(data: Partial<IRoleSchedule>): Promise<IRoleScheduleDocument> {
    const role = new RoleSchedule(data);
    return role.save();
  }

  async findById(id: string): Promise<IRoleScheduleDocument | null> {
    return RoleSchedule.findById(id);
  }

  async findByHostelId(hostelId: string): Promise<IRoleScheduleDocument[]> {
    return RoleSchedule.find({ hostelId }).sort({ category: 1, createdAt: -1 });
  }

  async findActiveByHostelAndCategory(hostelId: string, category: string): Promise<IRoleScheduleDocument[]> {
    return RoleSchedule.find({ hostelId, category, active: true }).sort({ createdAt: 1 });
  }

  async findByUnique(hostelId: string, staffUserId: string, category: string): Promise<IRoleScheduleDocument | null> {
    return RoleSchedule.findOne({ hostelId, staffUserId, category });
  }

  async update(id: string, updateData: Partial<IRoleSchedule>): Promise<IRoleScheduleDocument | null> {
    return RoleSchedule.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async upsertByUnique(hostelId: string, staffUserId: string, category: string, updateData: Partial<IRoleSchedule>): Promise<IRoleScheduleDocument> {
    const updated = await RoleSchedule.findOneAndUpdate(
      { hostelId: new Types.ObjectId(hostelId), staffUserId: new Types.ObjectId(staffUserId), category },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return updated;
  }
}
