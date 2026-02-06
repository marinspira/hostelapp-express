import { Delete, Get, Post, Route, Request, Path, Put, Body, Tags, Security } from 'tsoa';
import { ReservationService } from '../services/reservation.service.ts';
import type { AuthenticatedRequest, BackendResponse } from '../interfaces/index.interface.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { NotificationService } from '../services/notification.service.ts';
import { NotificationRepository } from '../repositories/notification.repository.ts';
import { UnauthorizedError } from '../utils/errors.ts';
import type {
  ICreateReservationResponse,
  IReservationListItemResponse,
  IReservationByIdResponse,
  IReservationCreateRequest,
  IReservation,
  IOthersGuestsListResponse,
  ICurrentStayResponse,
} from '../interfaces/reservation.interface.ts';

@Route('/api/reservations')
@Tags('Reservations')
export class ReservationController {
  private reservationService: ReservationService;

  constructor() {
    const reservationRepository = new ReservationRepository();
    const hostelRepository = new HostelRepository();
    const guestRepository = new GuestRepository();
    const notificationRepository = new NotificationRepository();
    const notificationService = new NotificationService(
      notificationRepository,
      hostelRepository,
      guestRepository
    );
    this.reservationService = new ReservationService(
      reservationRepository,
      hostelRepository,
      guestRepository,
      notificationService
    );
  }

  @Post('create')
  @Security('jwt')
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() reservationData: IReservationCreateRequest
  ): Promise<ICreateReservationResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (user.role !== 'host') {
      throw new UnauthorizedError('Only users signed up with host role can create reservations');
    }

    return this.reservationService.create(reservationData, user._id);
  }

  @Get('/current-guests')
  @Security('jwt')
  async list(@Request() req: AuthenticatedRequest): Promise<IReservationListItemResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (user.role !== 'host') {
      throw new UnauthorizedError('Only users signed up with host role can view reservations');
    }

    return this.reservationService.getHostelReservations(user._id);
  }

  @Get('{reservationId}')
  @Security('jwt')
  async findById(
    @Request() req: AuthenticatedRequest,
    @Path() reservationId: string
  ): Promise<IReservationByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.reservationService.getReservationById(user._id, reservationId);
  }

  @Put('{reservationId}/update')
  @Security('jwt')
  async update(
    @Request() req: AuthenticatedRequest,
    @Path() reservationId: string,
    @Body() reservationData: Partial<IReservation>
  ): Promise<IReservationByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (user.role !== 'host') {
      throw new UnauthorizedError('Only users signed up with host role can update reservations');
    }

    return this.reservationService.updateReservation(reservationId, reservationData);
  }

  @Delete('{reservationId}/delete')
  @Security('jwt')
  async delete(
    @Request() req: AuthenticatedRequest,
    @Path() reservationId: string
  ): Promise<BackendResponse<null>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (user.role !== 'host') {
      throw new UnauthorizedError('Only users signed up with host role can delete reservations');
    }

    return this.reservationService.deleteReservation(reservationId);
  }

  @Put('{reservationId}/checkout')
  async checkout(
    @Request() req: AuthenticatedRequest,
    @Path() reservationId: string
  ): Promise<IReservationByIdResponse> {
    return this.reservationService.checkoutReservation(reservationId);
  }
}

@Route('/api/reservations/guest')
@Tags('Reservations Guest')
export class GuestReservationController {
  private reservationService: ReservationService;

  constructor() {
    const reservationRepository = new ReservationRepository();
    const hostelRepository = new HostelRepository();
    const guestRepository = new GuestRepository();
    const notificationRepository = new NotificationRepository();
    const notificationService = new NotificationService(
      notificationRepository,
      hostelRepository,
      guestRepository
    );
    this.reservationService = new ReservationService(
      reservationRepository,
      hostelRepository,
      guestRepository,
      notificationService
    );
  }

  @Get('current-stay')
  @Security('jwt')
  async getCurrentReservation(
    @Request() req: AuthenticatedRequest
  ): Promise<ICurrentStayResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.reservationService.getCurrentGuestReservation(user._id);
  }

  @Get('history')
  @Security('jwt')
  async getReservationHistory(
    @Request() req: AuthenticatedRequest
  ): Promise<IReservationListItemResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (user.role !== 'guest') {
      throw new UnauthorizedError('Only users signed up with guest role can view reservation history');
    }

    return this.reservationService.getGuestReservationHistory(user._id);
  }

  @Get('{hostelId}/reservations')
  @Security('jwt')
  async list(
    @Request() req: AuthenticatedRequest,
    @Path() hostelId: string
  ): Promise<IOthersGuestsListResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.reservationService.listOtherGuestsInHostel(hostelId);
  }
}
