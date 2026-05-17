import { Types } from 'mongoose';

import type {
  ICheckoutItemInput,
  ICreateCleaningTasksFromCheckoutsRequest,
  ICreateRoleScheduleRequest,
  IRoleScheduleDocument,
  IRoleScheduleListResponse,
  IRoleScheduleResponse,
  IUpdateRoleScheduleRequest,
} from '../interfaces/role-schedule.interface';
import { TaskCategory } from '../interfaces/task.interface';
import { HostelRepository } from '../repositories/hostel.repository';
import { ReservationRepository } from '../repositories/reservation.repository';
import { RoleScheduleRepository } from '../repositories/role-schedule.repository';
import { TaskRepository } from '../repositories/task.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';

export class RoleScheduleService {
  constructor(
    private readonly roleRepo: RoleScheduleRepository,
    private readonly taskRepo: TaskRepository,
    private readonly hostelRepo: HostelRepository,
    private readonly reservationRepo: ReservationRepository
  ) {}

  private async ensureOwner(hostelId: string, userId: string) {
    const hostel = await this.hostelRepo.findByOwner(userId);
    if (!hostel || hostel._id.toString() !== hostelId) {
      throw new ForbiddenError('Only hostel owners can manage role schedules');
    }
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private computeWeeklyHours(weekDays: number[], timeWindows: { startTime: string; endTime: string }[]): number {
    const dayMinutes = timeWindows.reduce((acc, window) => {
      const diff = this.timeToMinutes(window.endTime) - this.timeToMinutes(window.startTime);
      return acc + Math.max(diff, 0);
    }, 0);
    return (dayMinutes * weekDays.length) / 60;
  }

  private validateRolePayload(payload: ICreateRoleScheduleRequest | IUpdateRoleScheduleRequest, forUpdate = false) {
    if (!forUpdate || payload.weekDays) {
      if (!payload.weekDays?.length) throw new BadRequestError('At least one weekday is required');
    }

    if (!forUpdate || payload.timeWindows) {
      if (!payload.timeWindows?.length) throw new BadRequestError('At least one time window is required');
      payload.timeWindows.forEach(window => {
        if (!window.startTime || !window.endTime) {
          throw new BadRequestError('Every time window must include start and end time');
        }
        if (this.timeToMinutes(window.endTime) <= this.timeToMinutes(window.startTime)) {
          throw new BadRequestError('End time must be after start time');
        }
      });
    }

    if (!forUpdate || payload.agreedWeeklyHours !== undefined) {
      if (!payload.agreedWeeklyHours || payload.agreedWeeklyHours <= 0) {
        throw new BadRequestError('Agreed weekly hours must be greater than zero');
      }
    }
  }

  private async generateTasksForRole(role: IRoleScheduleDocument, ownerId: string): Promise<void> {
    if (!role.active) return;
    if (role.category === 'cleaning' && role.autoSplitCleaningCheckouts) return;

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 14);

    for (let cursor = new Date(now); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const dayOfWeek = cursor.getDay();
      if (!role.weekDays.includes(dayOfWeek)) continue;

      for (const window of role.timeWindows) {
        const alreadyExists = await this.taskRepo.findOneByRoleAndSlot(
          role._id.toString(),
          cursor,
          window.startTime,
          window.endTime
        );
        if (alreadyExists) continue;

        await this.taskRepo.create({
          hostelId: role.hostelId,
          title: `${role.category} shift`,
          description: `Auto-generated from role schedule (${role.templateType})`,
          category: role.category,
          priority: 'medium',
          status: 'todo',
          assigneeId: role.staffUserId,
          assigneeType: 'staff',
          createdBy: new Types.ObjectId(ownerId),
          scheduledDate: new Date(cursor),
          startTime: window.startTime,
          endTime: window.endTime,
          checklist: [],
          proofPhotos: [],
          requiresProofPhoto: true,
          approvalRequired: true,
          roleId: role._id,
          generationSource: 'role_schedule',
        } as any);
      }
    }
  }

  async createOrUpdate(hostelId: string, userId: string, payload: ICreateRoleScheduleRequest): Promise<IRoleScheduleResponse> {
    await this.ensureOwner(hostelId, userId);
    this.validateRolePayload(payload);

    const weeklyHours = this.computeWeeklyHours(payload.weekDays, payload.timeWindows);
    if (weeklyHours > payload.agreedWeeklyHours) {
      throw new BadRequestError(`Schedule exceeds agreed weekly hours by ${(weeklyHours - payload.agreedWeeklyHours).toFixed(2)}h`);
    }

    const role = await this.roleRepo.upsertByUnique(hostelId, payload.staffUserId, payload.category, {
      hostelId: new Types.ObjectId(hostelId),
      staffUserId: new Types.ObjectId(payload.staffUserId),
      category: payload.category,
      active: payload.active ?? true,
      agreedWeeklyHours: payload.agreedWeeklyHours,
      weekDays: payload.weekDays,
      timeWindows: payload.timeWindows,
      templateType: payload.templateType,
      autoSplitCleaningCheckouts: payload.category === 'cleaning' ? !!payload.autoSplitCleaningCheckouts : false,
    });

    await this.generateTasksForRole(role, userId);

    return { success: true, message: 'Role schedule saved successfully', data: role };
  }

  async listByHostel(hostelId: string, userId: string): Promise<IRoleScheduleListResponse> {
    await this.ensureOwner(hostelId, userId);
    const roles = await this.roleRepo.findByHostelId(hostelId);
    return { success: true, message: 'Role schedules retrieved successfully', data: roles };
  }

  async update(roleId: string, userId: string, payload: IUpdateRoleScheduleRequest): Promise<IRoleScheduleResponse> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw new NotFoundError('Role schedule not found');
    await this.ensureOwner(role.hostelId.toString(), userId);

    const nextWeekDays = payload.weekDays ?? role.weekDays;
    const nextWindows = payload.timeWindows ?? role.timeWindows;
    const nextAgreed = payload.agreedWeeklyHours ?? role.agreedWeeklyHours;

    this.validateRolePayload({ ...payload, weekDays: nextWeekDays, timeWindows: nextWindows, agreedWeeklyHours: nextAgreed } as ICreateRoleScheduleRequest);
    const weeklyHours = this.computeWeeklyHours(nextWeekDays, nextWindows as any);
    if (weeklyHours > nextAgreed) {
      throw new BadRequestError(`Schedule exceeds agreed weekly hours by ${(weeklyHours - nextAgreed).toFixed(2)}h`);
    }

    const updated = await this.roleRepo.update(roleId, {
      ...payload,
      autoSplitCleaningCheckouts:
        role.category === 'cleaning'
          ? payload.autoSplitCleaningCheckouts ?? role.autoSplitCleaningCheckouts
          : false,
    } as any);

    if (!updated) throw new NotFoundError('Role schedule not found after update');

    await this.generateTasksForRole(updated, userId);

    return { success: true, message: 'Role schedule updated successfully', data: updated };
  }

  async remove(roleId: string, userId: string): Promise<IRoleScheduleResponse> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) throw new NotFoundError('Role schedule not found');
    await this.ensureOwner(role.hostelId.toString(), userId);

    const updated = await this.roleRepo.update(roleId, { active: false });
    if (!updated) throw new NotFoundError('Role schedule not found after removal');

    await this.taskRepo.cancelFutureByRoleId(roleId);

    return { success: true, message: 'Role schedule disabled successfully', data: updated };
  }

  async createCleaningTasksFromCheckouts(
    hostelId: string,
    userId: string,
    payload: ICreateCleaningTasksFromCheckoutsRequest
  ): Promise<{ success: boolean; message: string; data: { created: number } }> {
    await this.ensureOwner(hostelId, userId);
    if (!payload.items?.length) throw new BadRequestError('At least one checkout item is required');

    const normalizedKeys = payload.items.map(item => `${item.room.trim().toLowerCase()}::${item.bed.trim().toLowerCase()}`);
    const hasDuplicates = new Set(normalizedKeys).size !== normalizedKeys.length;
    if (hasDuplicates) {
      throw new BadRequestError('Duplicated room/bed entries are not allowed');
    }

    const roles = await this.roleRepo.findActiveByHostelAndCategory(hostelId, 'cleaning');
    const splitRoles = roles.filter(role => role.autoSplitCleaningCheckouts);
    if (!splitRoles.length) {
      throw new BadRequestError('No active cleaning role with auto split enabled');
    }

    const date = payload.date ? new Date(payload.date) : new Date();
    const day = date.getDay();
    const activeToday = splitRoles.filter(role => role.weekDays.includes(day));
    if (!activeToday.length) throw new BadRequestError('No cleaning staff scheduled for this day');

    const assignments = new Map<string, ICheckoutItemInput[]>();
    activeToday.forEach(role => assignments.set(role._id.toString(), []));

    payload.items.forEach((item, index) => {
      const role = activeToday[index % activeToday.length];
      assignments.get(role._id.toString())!.push(item);
    });

    let created = 0;
    for (const role of activeToday) {
      const assignedItems = assignments.get(role._id.toString()) || [];
      if (!assignedItems.length) continue;

      const firstWindow = role.timeWindows[0];
      const checklist = assignedItems.map(item => ({ label: `Room ${item.room} • Bed ${item.bed}`, done: false }));

      await this.taskRepo.create({
        hostelId: role.hostelId,
        title: 'Cleaning checkouts',
        description: `Auto-split checkout cleaning (${assignedItems.length} items)`,
        category: 'cleaning',
        priority: 'medium',
        status: 'todo',
        assigneeId: role.staffUserId,
        assigneeType: 'staff',
        createdBy: new Types.ObjectId(userId),
        scheduledDate: date,
        startTime: firstWindow?.startTime,
        endTime: firstWindow?.endTime,
        checklist,
        proofPhotos: [],
        requiresProofPhoto: true,
        approvalRequired: true,
        roleId: role._id,
        generationSource: 'cleaning_checkouts',
      } as any);
      created += 1;
    }

    return { success: true, message: 'Cleaning tasks created from checkouts successfully', data: { created } };
  }
}
