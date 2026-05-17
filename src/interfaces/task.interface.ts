import { Document, Types } from 'mongoose';

import { BackendResponse } from './index.interface';

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done'
  | 'rejected'
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskCategory =
  | 'cleaning'
  | 'reception'
  | 'maintenance'
  | 'event'
  | 'breakfast'

export type AssigneeType = 'staff' | 'volunteer' | 'owner';

export interface ITaskChecklistItem {
  label: string;
  done: boolean;
}

export interface ITaskProofPhoto {
  url: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface ITask {
  hostelId: Types.ObjectId;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status?: TaskStatus;
  assigneeId?: Types.ObjectId;
  assigneeType?: AssigneeType;
  createdBy: Types.ObjectId;
  scheduledDate?: Date;
  startTime?: string;
  endTime?: string;
  estimatedMinutes?: number;
  checklist?: ITaskChecklistItem[];
  proofPhotos?: ITaskProofPhoto[];
  requiresProofPhoto?: boolean;
  approvalRequired?: boolean;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  startedAt?: Date;
  completedAt?: Date;
  roleId?: Types.ObjectId;
  generationSource?: 'manual' | 'role_schedule' | 'cleaning_checkouts';
}

export interface ITaskDocument extends ITask, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  assigneeId?: string;
  assigneeType?: AssigneeType;
  scheduledDate?: string;
}

export interface ITaskStatusSummary {
  todo: number;
  in_progress: number;
  in_review: number;
  done: number;
  rejected: number;
  cancelled: number;
}

export interface IListTasksData {
  tasks: ITaskDocument[];
  summary: ITaskStatusSummary;
}

export interface ICreateTaskRequest {
  title: string;
  description?: string;
  category: TaskCategory;
  priority?: TaskPriority;
  assigneeId?: string;
  assigneeType?: AssigneeType;
  scheduledDate?: string | Date;
  startTime?: string;
  endTime?: string;
  estimatedMinutes?: number;
  checklist?: ITaskChecklistItem[];
  requiresProofPhoto?: boolean;
  approvalRequired?: boolean;
}

export interface IUpdateTaskRequest {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  assigneeId?: string | null;
  assigneeType?: AssigneeType | null;
  scheduledDate?: string | Date | null;
  startTime?: string | null;
  endTime?: string | null;
  estimatedMinutes?: number | null;
  checklist?: ITaskChecklistItem[];
  requiresProofPhoto?: boolean;
  approvalRequired?: boolean;
}

export interface ITaskStatusUpdateRequest {
  status: TaskStatus;
}

export interface ITaskRejectionRequest {
  reason: string;
}

export interface ITaskChecklistUpdateRequest {
  checklist: ITaskChecklistItem[];
}

export interface ITaskResponse extends BackendResponse<ITaskDocument> {}

export interface ITaskListResponse extends BackendResponse<IListTasksData> {}

export interface IMyTaskListResponse extends BackendResponse<ITaskDocument[]> {}
