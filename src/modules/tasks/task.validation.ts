import { Types } from 'mongoose';

import type {
  ICreateTaskRequest,
  ITaskChecklistItem,
  ITaskRejectionRequest,
  ITaskStatusUpdateRequest,
  IUpdateTaskRequest,
} from '../../interfaces/task.interface';
import { BadRequestError, ValidationError } from '../../utils/errors';
import {
  TASK_ASSIGNEE_TYPES,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from './task.types';

const isBlank = (value?: string | null): boolean => !value || !value.trim();

const ensureValidObjectId = (value: string, fieldName: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new BadRequestError(`${fieldName} is invalid`);
  }
};

export const normalizeChecklist = (checklist?: ITaskChecklistItem[]): ITaskChecklistItem[] => {
  if (!checklist) {
    return [];
  }

  if (!Array.isArray(checklist)) {
    throw new ValidationError('Checklist must be an array');
  }

  return checklist.map((item, index) => {
    if (isBlank(item?.label)) {
      throw new ValidationError(`Checklist item #${index + 1} must have a label`);
    }

    return {
      label: item.label.trim(),
      done: Boolean(item.done),
    };
  });
};

export const validateCreateTaskPayload = (payload: ICreateTaskRequest): void => {
  if (isBlank(payload.title)) {
    throw new ValidationError('Task title is required');
  }

  if (!TASK_CATEGORIES.includes(payload.category)) {
    throw new ValidationError('Task category is invalid');
  }

  if (payload.priority && !TASK_PRIORITIES.includes(payload.priority)) {
    throw new ValidationError('Task priority is invalid');
  }

  if (payload.assigneeType && !TASK_ASSIGNEE_TYPES.includes(payload.assigneeType)) {
    throw new ValidationError('Task assignee type is invalid');
  }

  if (payload.assigneeId) {
    ensureValidObjectId(payload.assigneeId, 'Assignee id');
  }

  if ((payload.assigneeId && !payload.assigneeType) || (!payload.assigneeId && payload.assigneeType)) {
    throw new ValidationError('Assignee id and assignee type must be informed together');
  }

  if (payload.estimatedMinutes !== undefined && payload.estimatedMinutes < 0) {
    throw new ValidationError('Estimated minutes must be positive');
  }

  if (payload.requiresProofPhoto !== undefined && typeof payload.requiresProofPhoto !== 'boolean') {
    throw new ValidationError('Requires proof photo must be a boolean');
  }

  normalizeChecklist(payload.checklist);
};

export const validateUpdateTaskPayload = (payload: IUpdateTaskRequest): void => {
  if (payload.title !== undefined && isBlank(payload.title)) {
    throw new ValidationError('Task title cannot be empty');
  }

  if (payload.category !== undefined && !TASK_CATEGORIES.includes(payload.category)) {
    throw new ValidationError('Task category is invalid');
  }

  if (payload.priority !== undefined && !TASK_PRIORITIES.includes(payload.priority)) {
    throw new ValidationError('Task priority is invalid');
  }

  if (
    payload.assigneeType !== undefined &&
    payload.assigneeType !== null &&
    !TASK_ASSIGNEE_TYPES.includes(payload.assigneeType)
  ) {
    throw new ValidationError('Task assignee type is invalid');
  }

  if (payload.assigneeId !== undefined && payload.assigneeId !== null) {
    ensureValidObjectId(payload.assigneeId, 'Assignee id');
  }

  if (
    (payload.assigneeId === null && payload.assigneeType !== null && payload.assigneeType !== undefined) ||
    (payload.assigneeType === null && payload.assigneeId !== null && payload.assigneeId !== undefined)
  ) {
    throw new ValidationError('Assignee id and assignee type must be cleared together');
  }

  if (payload.estimatedMinutes !== undefined && payload.estimatedMinutes !== null && payload.estimatedMinutes < 0) {
    throw new ValidationError('Estimated minutes must be positive');
  }

  if (payload.requiresProofPhoto !== undefined && typeof payload.requiresProofPhoto !== 'boolean') {
    throw new ValidationError('Requires proof photo must be a boolean');
  }

  if (payload.checklist !== undefined) {
    normalizeChecklist(payload.checklist);
  }
};

export const validateStatusUpdatePayload = (payload: ITaskStatusUpdateRequest): void => {
  if (!TASK_STATUSES.includes(payload.status)) {
    throw new ValidationError('Task status is invalid');
  }
};

export const validateRejectionPayload = (payload: ITaskRejectionRequest): void => {
  if (isBlank(payload.reason)) {
    throw new ValidationError('Rejection reason is required');
  }
};
