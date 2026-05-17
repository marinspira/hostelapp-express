import type { AuthenticatedRequest } from '../interfaces/index.interface';
import type {
  ICreateCleaningTasksFromCheckoutsRequest,
  ICreateRoleScheduleRequest,
  IRoleScheduleListResponse,
  IRoleScheduleResponse,
  IUpdateRoleScheduleRequest,
} from '../interfaces/role-schedule.interface';
import { HostelRepository } from '../repositories/hostel.repository';
import { ReservationRepository } from '../repositories/reservation.repository';
import { RoleScheduleRepository } from '../repositories/role-schedule.repository';
import { TaskRepository } from '../repositories/task.repository';
import { RoleScheduleService } from '../services/role-schedule.service';
import { UnauthorizedError } from '../utils/errors';

export class RoleScheduleController {
  private readonly roleService: RoleScheduleService;

  constructor() {
    this.roleService = new RoleScheduleService(
      new RoleScheduleRepository(),
      new TaskRepository(),
      new HostelRepository(),
      new ReservationRepository()
    );
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?._id?.toString();
    if (!userId) throw new UnauthorizedError('User not authenticated');
    return userId;
  }

  async create(req: AuthenticatedRequest): Promise<IRoleScheduleResponse> {
    const userId = this.getUserId(req);
    return this.roleService.createOrUpdate(req.params.hostelId, userId, req.body as ICreateRoleScheduleRequest);
  }

  async list(req: AuthenticatedRequest): Promise<IRoleScheduleListResponse> {
    const userId = this.getUserId(req);
    return this.roleService.listByHostel(req.params.hostelId, userId);
  }

  async update(req: AuthenticatedRequest): Promise<IRoleScheduleResponse> {
    const userId = this.getUserId(req);
    return this.roleService.update(req.params.roleId, userId, req.body as IUpdateRoleScheduleRequest);
  }

  async remove(req: AuthenticatedRequest): Promise<IRoleScheduleResponse> {
    const userId = this.getUserId(req);
    return this.roleService.remove(req.params.roleId, userId);
  }

  async createCleaningFromCheckouts(req: AuthenticatedRequest) {
    const userId = this.getUserId(req);
    return this.roleService.createCleaningTasksFromCheckouts(
      req.params.hostelId,
      userId,
      req.body as ICreateCleaningTasksFromCheckoutsRequest
    );
  }
}
