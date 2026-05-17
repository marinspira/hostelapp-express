import mongoose, { Model, Schema } from 'mongoose';

import type { ITaskDocument } from '../interfaces/task.interface';
import {
  TASK_ASSIGNEE_TYPES,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../modules/tasks/task.types';

export type ITaskModel = Model<ITaskDocument>;

const TaskChecklistItemSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const TaskProofPhotoSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITaskDocument>(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: TASK_CATEGORIES,
      default: 'cleaning',
      required: true,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'medium',
      required: true,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'todo',
      required: true,
      index: true,
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assigneeType: {
      type: String,
      enum: TASK_ASSIGNEE_TYPES,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduledDate: {
      type: Date,
    },
    startTime: {
      type: String,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    estimatedMinutes: {
      type: Number,
      min: 0,
    },
    checklist: {
      type: [TaskChecklistItemSchema],
      default: [],
    },
    proofPhotos: {
      type: [TaskProofPhotoSchema],
      default: [],
    },
    requiresProofPhoto: {
      type: Boolean,
      default: true,
    },
    approvalRequired: {
      type: Boolean,
      default: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoleSchedule',
      index: true,
    },
    generationSource: {
      type: String,
      enum: ['manual', 'role_schedule', 'cleaning_checkouts'],
      default: 'manual',
    },
  },
  { timestamps: true }
);

const Task: ITaskModel = mongoose.model<ITaskDocument, ITaskModel>('Task', TaskSchema);

export default Task;
