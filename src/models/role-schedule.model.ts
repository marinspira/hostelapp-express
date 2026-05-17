import mongoose, { Model, Schema } from 'mongoose';

import type { IRoleScheduleDocument } from '../interfaces/role-schedule.interface';
import { TASK_CATEGORIES } from '../modules/tasks/task.types';

export type IRoleScheduleModel = Model<IRoleScheduleDocument>;

const RoleTimeWindowSchema = new Schema(
  {
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const RoleScheduleSchema = new Schema<IRoleScheduleDocument>(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
      index: true,
    },
    staffUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: TASK_CATEGORIES,
      required: true,
      index: true,
    },
    active: { type: Boolean, default: true, index: true },
    agreedWeeklyHours: { type: Number, required: true, min: 1 },
    weekDays: { type: [Number], required: true, default: [] },
    timeWindows: { type: [RoleTimeWindowSchema], required: true, default: [] },
    autoSplitCleaningCheckouts: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RoleScheduleSchema.index({ hostelId: 1, staffUserId: 1, category: 1 }, { unique: true });

const RoleSchedule: IRoleScheduleModel = mongoose.model<IRoleScheduleDocument, IRoleScheduleModel>(
  'RoleSchedule',
  RoleScheduleSchema
);

export default RoleSchedule;
