import { FilterQuery, Types } from 'mongoose';

import type {
  ITaskDocument,
  ITaskFilters,
  ITaskStatusSummary,
} from '../interfaces/task.interface';
import Task from '../models/task.model';
import { EMPTY_TASK_SUMMARY } from '../modules/tasks/task.types';

export class TaskRepository {
  async create(taskData: Partial<ITaskDocument>): Promise<ITaskDocument> {
    const task = new Task(taskData);
    return task.save();
  }

  async findById(taskId: string | Types.ObjectId): Promise<ITaskDocument | null> {
    return Task.findById(taskId);
  }

  async findByHostelId(
    hostelId: string | Types.ObjectId,
    filters: ITaskFilters = {}
  ): Promise<ITaskDocument[]> {
    const query: FilterQuery<ITaskDocument> = { hostelId };

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assigneeId) query.assigneeId = new Types.ObjectId(filters.assigneeId);
    if (filters.assigneeType) query.assigneeType = filters.assigneeType;
    if (filters.scheduledDate) {
      const start = new Date(filters.scheduledDate);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      start.setHours(0, 0, 0, 0);
      query.scheduledDate = { $gte: start, $lte: end };
    }

    return Task.find(query).sort({
      scheduledDate: 1,
      updatedAt: -1,
      createdAt: -1,
    });
  }

  async findAssignedToUser(
    hostelId: string | Types.ObjectId,
    assigneeId: string | Types.ObjectId
  ): Promise<ITaskDocument[]> {
    return Task.find({ hostelId, assigneeId }).sort({
      status: 1,
      scheduledDate: 1,
      createdAt: -1,
    });
  }

  async update(
    taskId: string | Types.ObjectId,
    updateData: Partial<ITaskDocument>
  ): Promise<ITaskDocument | null> {
    return Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async findOneByRoleAndSlot(
    roleId: string,
    scheduledDate: Date,
    startTime?: string,
    endTime?: string
  ): Promise<ITaskDocument | null> {
    const start = new Date(scheduledDate);
    const end = new Date(scheduledDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return Task.findOne({
      roleId: new Types.ObjectId(roleId),
      scheduledDate: { $gte: start, $lte: end },
      startTime: startTime ?? undefined,
      endTime: endTime ?? undefined,
      status: { $ne: 'cancelled' },
    });
  }

  async cancelFutureByRoleId(roleId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Task.updateMany(
      {
        roleId: new Types.ObjectId(roleId),
        scheduledDate: { $gte: today },
        status: { $in: ['todo', 'in_progress', 'in_review', 'rejected'] },
      },
      {
        $set: {
          status: 'cancelled',
          rejectionReason: 'Role schedule disabled',
        },
      }
    );
  }

  async getStatusSummary(hostelId: string | Types.ObjectId): Promise<ITaskStatusSummary> {
    const rows = await Task.aggregate<{ _id: string; count: number }>([
      { $match: { hostelId: new Types.ObjectId(hostelId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return rows.reduce<ITaskStatusSummary>((acc, row) => {
      acc[row._id as keyof ITaskStatusSummary] = row.count;
      return acc;
    }, { ...EMPTY_TASK_SUMMARY });
  }
}
