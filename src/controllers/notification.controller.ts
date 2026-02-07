import { Controller, Route, Get, Put, Request, Security, Tags } from 'tsoa';

import { NotificationService } from '../services/notification.service.ts';
import { NotificationRepository } from '../repositories/notification.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import type {
  INotificationListItemResponse,
  IUnreadCountResponse,
} from '../interfaces/notification.interface.ts';
import type { BackendResponse, AuthenticatedRequest } from '../interfaces/index.interface.ts';
import { UnauthorizedError } from '../utils/errors.ts';

@Route('/api/notifications')
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

  @Get('/list')
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

  @Put('/mark-all-read')
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

  @Get('/unread-count')
  @Security('jwt')
  public async getUnreadCount(
    @Request() request?: AuthenticatedRequest
  ): Promise<IUnreadCountResponse> {
    const userId = request?.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User ID not found in request');
    }

    return this.notificationService.getUnreadCount(userId);
  }
}
