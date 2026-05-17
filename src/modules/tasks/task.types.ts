import type { AssigneeType, TaskCategory, TaskPriority, TaskStatus } from '../../interfaces/task.interface';

export const TASK_STATUSES: TaskStatus[] = [
  'todo',
  'in_progress',
  'in_review',
  'done',
  'rejected',
  'cancelled',
];

export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

export const TASK_CATEGORIES: TaskCategory[] = [
  'cleaning',
  'reception',
  'maintenance',
  'event',
  'breakfast',
];

export const TASK_ASSIGNEE_TYPES: AssigneeType[] = ['staff', 'volunteer', 'owner'];

export const EMPTY_TASK_SUMMARY = {
  todo: 0,
  in_progress: 0,
  in_review: 0,
  done: 0,
  rejected: 0,
  cancelled: 0,
};
