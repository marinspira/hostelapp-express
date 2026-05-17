import { Document, Types } from 'mongoose';

import { BackendResponse } from './index.interface';
import { TaskCategory } from './task.interface';

export interface IRoleTimeWindow {
  startTime: string;
  endTime: string;
}

export interface IRoleSchedule {
  hostelId: Types.ObjectId;
  staffUserId: Types.ObjectId;
  category: TaskCategory;
  active: boolean;
  agreedWeeklyHours: number;
  weekDays: number[];
  timeWindows: IRoleTimeWindow[];
  autoSplitCleaningCheckouts?: boolean;
}

export interface IRoleScheduleDocument extends IRoleSchedule, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateRoleScheduleRequest {
  staffUserId: string;
  category: TaskCategory;
  active?: boolean;
  agreedWeeklyHours: number;
  weekDays: number[];
  timeWindows: IRoleTimeWindow[];
  autoSplitCleaningCheckouts?: boolean;
}

export interface IUpdateRoleScheduleRequest extends Partial<ICreateRoleScheduleRequest> {}

export interface ICheckoutItemInput {
  room: string;
  bed: string;
}

export interface ICreateCleaningTasksFromCheckoutsRequest {
  date?: string;
  items: ICheckoutItemInput[];
}

export interface IRoleScheduleResponse extends BackendResponse<IRoleScheduleDocument> {}
export interface IRoleScheduleListResponse extends BackendResponse<IRoleScheduleDocument[]> {}
