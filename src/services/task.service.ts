import { Types } from 'mongoose';

import type {
  ICreateTaskRequest,
  IMyTaskListResponse,
  ITaskDocument,
  ITaskFilters,
  ITaskListResponse,
  ITaskResponse,
  ITaskStatusUpdateRequest,
  TaskStatus,
  IUpdateTaskRequest,
} from '../interfaces/task.interface';
import { HostelRepository } from '../repositories/hostel.repository';
import { TaskRepository } from '../repositories/task.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import {
  normalizeChecklist,
  validateCreateTaskPayload,
  validateUpdateTaskPayload,
} from '../modules/tasks/task.validation';

export class TaskService {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly hostelRepo: HostelRepository
  ) {}

  private async ensureHostelExists(hostelId: string): Promise<void> {
    const hostel = await this.hostelRepo.findById(new Types.ObjectId(hostelId));
    if (!hostel) {
      throw new NotFoundError('Hostel not found');
    }
  }

  private async ensureHostelOwner(hostelId: string, userId: string): Promise<void> {
    await this.ensureHostelExists(hostelId);
    const hostel = await this.hostelRepo.findByOwner(userId);

    if (!hostel || hostel._id.toString() !== hostelId) {
      throw new ForbiddenError('Only hostel owners can perform this action');
    }
  }

  private async ensureHostelAccess(hostelId: string, userId: string): Promise<void> {
    await this.ensureHostelExists(hostelId);
    const hasAccess = await this.hostelRepo.checkUserAccessToHostel(new Types.ObjectId(hostelId), userId);

    if (!hasAccess) {
      throw new ForbiddenError('User does not have access to this hostel');
    }
  }

  private async validateAssignee(hostelId: string, assigneeId?: string): Promise<void> {
    if (!assigneeId) {
      return;
    }

    await this.ensureHostelAccess(hostelId, assigneeId);
  }

  private isAssignee(task: ITaskDocument, userId: string): boolean {
    return task.assigneeId?.toString() === userId;
  }

  private assertAssignable(task: ITaskDocument): void {
    if (!task.assigneeId) {
      throw new BadRequestError('Task does not have an assignee');
    }

    if (task.status === 'cancelled') {
      throw new BadRequestError('Cancelled tasks cannot be updated');
    }
  }

  private toNullableObjectId(value?: string | null): Types.ObjectId | undefined {
    if (!value) return undefined;
    return new Types.ObjectId(value);
  }

  async create(hostelId: string, userId: string, payload: ICreateTaskRequest): Promise<ITaskResponse> {
    validateCreateTaskPayload(payload);
    await this.ensureHostelOwner(hostelId, userId);
    await this.validateAssignee(hostelId, payload.assigneeId);

    const createdTask = await this.taskRepo.create({
      hostelId: new Types.ObjectId(hostelId),
      title: payload.title.trim(),
      description: payload.description?.trim(),
      category: payload.category,
      priority: payload.priority ?? 'medium',
      status: 'todo',
      assigneeId: this.toNullableObjectId(payload.assigneeId),
      assigneeType: payload.assigneeType ?? undefined,
      createdBy: new Types.ObjectId(userId),
      scheduledDate: payload.scheduledDate ? new Date(payload.scheduledDate) : undefined,
      startTime: payload.startTime ?? undefined,
      endTime: payload.endTime ?? undefined,
      estimatedMinutes: payload.estimatedMinutes ?? undefined,
      checklist: normalizeChecklist(payload.checklist),
      proofPhotos: [],
      requiresProofPhoto: payload.requiresProofPhoto ?? true,
      approvalRequired: payload.approvalRequired ?? true,
    });

    return { success: true, message: 'Task created successfully', data: createdTask };
  }

  async listByHostelId(
    hostelId: string,
    userId: string,
    filters: ITaskFilters = {}
  ): Promise<ITaskListResponse> {
    await this.ensureHostelAccess(hostelId, userId);

    const [tasks, summary] = await Promise.all([
      this.taskRepo.findByHostelId(hostelId, filters),
      this.taskRepo.getStatusSummary(hostelId),
    ]);

    return {
      success: true,
      message: 'Tasks retrieved successfully',
      data: { tasks, summary },
    };
  }

  async listMyTasks(hostelId: string, userId: string): Promise<IMyTaskListResponse> {
    await this.ensureHostelAccess(hostelId, userId);

    const tasks = await this.taskRepo.findAssignedToUser(hostelId, userId);

    return { success: true, message: 'My tasks retrieved successfully', data: tasks };
  }

  async getById(taskId: string, userId: string): Promise<ITaskResponse> {
    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    await this.ensureHostelAccess(task.hostelId.toString(), userId);

    return { success: true, message: 'Task retrieved successfully', data: task };
  }

  async update(taskId: string, userId: string, payload: IUpdateTaskRequest): Promise<ITaskResponse> {
    validateUpdateTaskPayload(payload);

    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const isAssignee = this.isAssignee(task, userId);
    const isOwner = Boolean((await this.hostelRepo.findByOwner(userId))?._id?.equals(task.hostelId));

    if (!isAssignee && !isOwner) {
      throw new ForbiddenError('User cannot update this task');
    }

    if (isAssignee && !isOwner) {
      if (payload.checklist === undefined) {
        throw new ForbiddenError('Assignee can only update checklist items');
      }

      const updatedTask = await this.taskRepo.update(taskId, {
        checklist: normalizeChecklist(payload.checklist),
      });

      if (!updatedTask) {
        throw new NotFoundError('Task not found after update');
      }

      return { success: true, message: 'Task updated successfully', data: updatedTask };
    }

    await this.validateAssignee(task.hostelId.toString(), payload.assigneeId ?? undefined);

    const updatedTask = await this.taskRepo.update(taskId, {
      title: payload.title?.trim() ?? task.title,
      description:
        payload.description === undefined ? task.description : payload.description?.trim() || undefined,
      category: payload.category ?? task.category,
      priority: payload.priority ?? task.priority,
      assigneeId:
        payload.assigneeId === undefined
          ? task.assigneeId
          : payload.assigneeId === null
            ? undefined
            : new Types.ObjectId(payload.assigneeId),
      assigneeType:
        payload.assigneeType === undefined
          ? task.assigneeType
          : payload.assigneeType === null
            ? undefined
            : payload.assigneeType,
      scheduledDate:
        payload.scheduledDate === undefined
          ? task.scheduledDate
          : payload.scheduledDate === null
            ? undefined
            : new Date(payload.scheduledDate),
      startTime:
        payload.startTime === undefined ? task.startTime : payload.startTime || undefined,
      endTime: payload.endTime === undefined ? task.endTime : payload.endTime || undefined,
      estimatedMinutes:
        payload.estimatedMinutes === undefined
          ? task.estimatedMinutes
          : payload.estimatedMinutes === null
            ? undefined
            : payload.estimatedMinutes,
      checklist:
        payload.checklist === undefined ? task.checklist : normalizeChecklist(payload.checklist),
      requiresProofPhoto: payload.requiresProofPhoto ?? task.requiresProofPhoto,
      approvalRequired: payload.approvalRequired ?? task.approvalRequired,
    });

    if (!updatedTask) {
      throw new NotFoundError('Task not found after update');
    }

    return { success: true, message: 'Task updated successfully', data: updatedTask };
  }

  async updateStatus(taskId: string, userId: string, payload: ITaskStatusUpdateRequest): Promise<ITaskResponse> {
    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    await this.ensureHostelOwner(task.hostelId.toString(), userId);

    if (payload.status === 'done' || payload.status === 'rejected' || payload.status === 'in_review') {
      throw new BadRequestError('Use the dedicated complete, approve or reject endpoints for this transition');
    }

    const updatedTask = await this.taskRepo.update(taskId, {
      status: payload.status,
      rejectionReason: payload.status === 'todo' ? undefined : task.rejectionReason,
    });

    if (!updatedTask) {
      throw new NotFoundError('Task not found after status update');
    }

    return { success: true, message: 'Task status updated successfully', data: updatedTask };
  }

  async start(taskId: string, userId: string): Promise<ITaskResponse> {
    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    this.assertAssignable(task);

    if (!this.isAssignee(task, userId)) {
      throw new ForbiddenError('Only the assignee can start this task');
    }

    const currentStatus = task.status ?? 'todo';

    if (!['todo', 'rejected'].includes(currentStatus)) {
      throw new BadRequestError('Only todo or rejected tasks can be started');
    }

    const updatedTask = await this.taskRepo.update(taskId, {
      status: 'in_progress',
      startedAt: new Date(),
      rejectionReason: undefined,
    });

    if (!updatedTask) {
      throw new NotFoundError('Task not found after start');
    }

    return { success: true, message: 'Task started successfully', data: updatedTask };
  }

  async complete(
    taskId: string,
    userId: string,
    checklist?: ITaskDocument['checklist']
  ): Promise<ITaskResponse> {
    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    this.assertAssignable(task);

    if (!this.isAssignee(task, userId)) {
      throw new ForbiddenError('Only the assignee can complete this task');
    }

    const currentStatus = task.status ?? 'todo';

    if (!['todo', 'in_progress', 'rejected'].includes(currentStatus)) {
      throw new BadRequestError('Task cannot be completed from the current status');
    }

    const finalChecklist = checklist ? normalizeChecklist(checklist) : task.checklist;

    if (task.requiresProofPhoto && !(task.proofPhotos?.length)) {
      throw new BadRequestError('At least one proof photo is required to complete this task');
    }

    const nextStatus: TaskStatus = task.approvalRequired ? 'in_review' : 'done';
    const updatedTask = await this.taskRepo.update(taskId, {
      status: nextStatus,
      checklist: finalChecklist,
      completedAt: new Date(),
      approvedAt: nextStatus === 'done' ? new Date() : undefined,
      approvedBy: nextStatus === 'done' ? new Types.ObjectId(userId) : undefined,
      rejectionReason: undefined,
    });

    if (!updatedTask) {
      throw new NotFoundError('Task not found after completion');
    }

    return {
      success: true,
      message: nextStatus === 'in_review' ? 'Task sent to review successfully' : 'Task completed successfully',
      data: updatedTask,
    };
  }

  async addProofPhotos(taskId: string, userId: string, imagePaths: string[]): Promise<ITaskResponse> {
    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const isOwner = Boolean((await this.hostelRepo.findByOwner(userId))?._id?.equals(task.hostelId));
    const isAssignee = this.isAssignee(task, userId);

    if (!isOwner && !isAssignee) {
      throw new ForbiddenError('User cannot upload proof photos for this task');
    }

    if (!imagePaths.length) {
      throw new BadRequestError('At least one proof photo is required');
    }

    const existingPhotos = task.proofPhotos ?? [];
    const newPhotos = imagePaths.map(path => ({
      url: path,
      uploadedBy: new Types.ObjectId(userId),
      uploadedAt: new Date(),
    }));

    const updatedTask = await this.taskRepo.update(taskId, {
      proofPhotos: [...existingPhotos, ...newPhotos],
    });

    if (!updatedTask) {
      throw new NotFoundError('Task not found after proof upload');
    }

    return { success: true, message: 'Proof photos uploaded successfully', data: updatedTask };
  }

  async approve(taskId: string, userId: string): Promise<ITaskResponse> {
    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    await this.ensureHostelOwner(task.hostelId.toString(), userId);

    if (task.status !== 'in_review') {
      throw new BadRequestError('Only tasks in review can be approved');
    }

    const updatedTask = await this.taskRepo.update(taskId, {
      status: 'done',
      approvedBy: new Types.ObjectId(userId),
      approvedAt: new Date(),
      rejectionReason: undefined,
    });

    if (!updatedTask) {
      throw new NotFoundError('Task not found after approval');
    }

    return { success: true, message: 'Task approved successfully', data: updatedTask };
  }

  async reject(taskId: string, userId: string, reason: string): Promise<ITaskResponse> {
    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    await this.ensureHostelOwner(task.hostelId.toString(), userId);

    if (task.status !== 'in_review') {
      throw new BadRequestError('Only tasks in review can be rejected');
    }

    const updatedTask = await this.taskRepo.update(taskId, {
      status: 'rejected',
      rejectionReason: reason.trim(),
      approvedBy: undefined,
      approvedAt: undefined,
    });

    if (!updatedTask) {
      throw new NotFoundError('Task not found after rejection');
    }

    return { success: true, message: 'Task rejected successfully', data: updatedTask };
  }

  async cancel(taskId: string, userId: string): Promise<ITaskResponse> {
    const task = await this.taskRepo.findById(taskId);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    await this.ensureHostelOwner(task.hostelId.toString(), userId);

    const updatedTask = await this.taskRepo.update(taskId, {
      status: 'cancelled',
    });

    if (!updatedTask) {
      throw new NotFoundError('Task not found after cancellation');
    }

    return { success: true, message: 'Task cancelled successfully', data: updatedTask };
  }
}
