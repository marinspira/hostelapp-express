import type { AuthenticatedRequest, UploadedFile } from '../interfaces/index.interface';
import type {
  ICreateTaskRequest,
  IMyTaskListResponse,
  ITaskFilters,
  ITaskListResponse,
  ITaskRejectionRequest,
  ITaskResponse,
  ITaskStatusUpdateRequest,
  IUpdateTaskRequest,
} from '../interfaces/task.interface';
import { HostelRepository } from '../repositories/hostel.repository';
import { TaskRepository } from '../repositories/task.repository';
import { TaskService } from '../services/task.service';
import { UnauthorizedError } from '../utils/errors';
import { getRelativeFilePath } from '../middleware/saveUploads';
import {
  validateRejectionPayload,
  validateStatusUpdatePayload,
} from '../modules/tasks/task.validation';

export class TaskController {
  private readonly taskService: TaskService;

  constructor() {
    const taskRepository = new TaskRepository();
    const hostelRepository = new HostelRepository();
    this.taskService = new TaskService(taskRepository, hostelRepository);
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?._id?.toString();
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }
    return userId;
  }

  async create(req: AuthenticatedRequest): Promise<ITaskResponse> {
    const userId = this.getUserId(req);
    const payload = req.body as ICreateTaskRequest;
    return this.taskService.create(req.params.hostelId, userId, payload);
  }

  async listByHostel(req: AuthenticatedRequest): Promise<ITaskListResponse> {
    const userId = this.getUserId(req);
    const filters = req.query as ITaskFilters;
    return this.taskService.listByHostelId(req.params.hostelId, userId, filters);
  }

  async listMine(req: AuthenticatedRequest): Promise<IMyTaskListResponse> {
    const userId = this.getUserId(req);
    return this.taskService.listMyTasks(req.params.hostelId, userId);
  }

  async getById(req: AuthenticatedRequest): Promise<ITaskResponse> {
    const userId = this.getUserId(req);
    return this.taskService.getById(req.params.taskId, userId);
  }

  async update(req: AuthenticatedRequest): Promise<ITaskResponse> {
    const userId = this.getUserId(req);
    const payload = req.body as IUpdateTaskRequest;
    return this.taskService.update(req.params.taskId, userId, payload);
  }

  async updateStatus(req: AuthenticatedRequest): Promise<ITaskResponse> {
    const userId = this.getUserId(req);
    const payload = req.body as ITaskStatusUpdateRequest;
    validateStatusUpdatePayload(payload);
    return this.taskService.updateStatus(req.params.taskId, userId, payload);
  }

  async start(req: AuthenticatedRequest): Promise<ITaskResponse> {
    const userId = this.getUserId(req);
    return this.taskService.start(req.params.taskId, userId);
  }

  async complete(req: AuthenticatedRequest): Promise<ITaskResponse> {
    const userId = this.getUserId(req);
    return this.taskService.complete(req.params.taskId, userId, req.body?.checklist);
  }

  async addProofPhotos(req: AuthenticatedRequest): Promise<ITaskResponse> {
    const userId = this.getUserId(req);
    const uploadedFiles = (req.files ?? []) as UploadedFile[];
    const imagePaths = uploadedFiles.map(file => getRelativeFilePath(req, file));
    return this.taskService.addProofPhotos(req.params.taskId, userId, imagePaths);
  }

  async approve(req: AuthenticatedRequest): Promise<ITaskResponse> {
    const userId = this.getUserId(req);
    return this.taskService.approve(req.params.taskId, userId);
  }

  async reject(req: AuthenticatedRequest): Promise<ITaskResponse> {
    const userId = this.getUserId(req);
    const payload = req.body as ITaskRejectionRequest;
    validateRejectionPayload(payload);
    return this.taskService.reject(req.params.taskId, userId, payload.reason);
  }

  async cancel(req: AuthenticatedRequest): Promise<ITaskResponse> {
    const userId = this.getUserId(req);
    return this.taskService.cancel(req.params.taskId, userId);
  }
}
