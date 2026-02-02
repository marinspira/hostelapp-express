import { Controller, Route, Get, Put, Delete, Path, Query, Request, Security, Tags } from 'tsoa';

import { NotificationService } from '../services/notification.service.ts';
import { NotificationRepository } from '../repositories/notification.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import type {
  INotificationListItemResponse,
  INotificationByIdResponse,
  IUnreadCountResponse,
} from '../interfaces/notification.interface.ts';
import type { BackendResponse, AuthenticatedRequest } from '../interfaces/index.interface.ts';
import { UnauthorizedError } from '../utils/errors.ts';

@Route('notifications')
@Tags('Notifications')
export class NotificationController extends Controller {
  private notificationService: NotificationService;

  constructor() {
    super();
    const notificationRepository = new NotificationRepository();
    const hostelRepository = new HostelRepository();
    const guestRepository = new GuestRepository();

    this.notificationService = new NotificationService(
      notificationRepository,
      hostelRepository,
      guestRepository
    );
  }

  @Get('/user')
  @Security('jwt')
  public async getUserNotifications(
    @Request() request: AuthenticatedRequest
  ): Promise<INotificationListItemResponse> {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID not found in request');
    }

    return this.notificationService.getNotificationsForUser(userId);
  }

  @Get('/hostel/{hostelId}')
  @Security('jwt')
  public async getHostelNotifications(
    @Path() hostelId: string,
    @Request() request: AuthenticatedRequest
  ): Promise<INotificationListItemResponse> {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID not found in request');
    }

    return this.notificationService.getNotificationsForHostel(hostelId);
  }

  @Put('/{notificationId}/read')
  @Security('jwt')
  public async markAsRead(
    @Path() notificationId: string,
    @Request() request: AuthenticatedRequest
  ): Promise<INotificationByIdResponse> {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID not found in request');
    }

    return this.notificationService.markAsRead(notificationId);
  }

  @Put('/user/mark-all-read')
  @Security('jwt')
  public async markAllAsReadForUser(
    @Request() request: AuthenticatedRequest
  ): Promise<BackendResponse<null>> {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID not found in request');
    }

    return this.notificationService.markAllAsReadForUser(userId);
  }

  @Put('/hostel/{hostelId}/mark-all-read')
  @Security('jwt')
  public async markAllAsReadForHostel(
    @Path() hostelId: string,
    @Request() request: AuthenticatedRequest
  ): Promise<BackendResponse<null>> {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID not found in request');
    }

    return this.notificationService.markAllAsReadForHostel(hostelId);
  }

  @Delete('/{notificationId}')
  @Security('jwt')
  public async deleteNotification(
    @Path() notificationId: string,
    @Request() request: AuthenticatedRequest
  ): Promise<BackendResponse<null>> {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID not found in request');
    }

    return this.notificationService.deleteNotification(notificationId);
  }

  @Get('/unread-count')
  @Security('jwt')
  public async getUnreadCount(
    @Query() hostelId?: string,
    @Request() request?: AuthenticatedRequest
  ): Promise<IUnreadCountResponse> {
    const userId = request?.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID not found in request');
    }

    return this.notificationService.getUnreadCount(userId, hostelId);
  }
}
