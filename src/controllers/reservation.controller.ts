import { Delete, Get, Post, Route, Request, Path, Put, Body } from 'tsoa';

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
} from '../interfaces/reservation.interface.ts';
import IReservation from '../interfaces/reservation.interface.ts';

@Route('/api/reservations')
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
  async create(@Request() req: AuthenticatedRequest): Promise<ICreateReservationResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    const reservationData = req.body;
    return this.reservationService.create(reservationData, user._id);
  }

  @Get('/')
  async listAll(@Request() req: AuthenticatedRequest): Promise<IReservationListItemResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.reservationService.getHostelReservations(user._id);
  }

  @Get('{id}')
  async findById(
    @Request() req: AuthenticatedRequest,
    @Path() id: string
  ): Promise<IReservationByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.reservationService.getReservationById(id);
  }

  @Put('{id}/update')
  async update(
    @Request() req: AuthenticatedRequest,
    @Path() id: string,
    @Body() reservationData: Partial<IReservation>
  ): Promise<IReservationByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.reservationService.updateReservation(id, reservationData);
  }

  @Delete('{id}/delete')
  async delete(
    @Request() req: AuthenticatedRequest,
    @Path() id: string
  ): Promise<BackendResponse<null>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.reservationService.deleteReservation(id);
  }

  @Put('{id}/checkout')
  async checkout(
    @Request() req: AuthenticatedRequest,
    @Path() id: string
  ): Promise<IReservationByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.reservationService.checkoutReservation(id);
  }
}

@Route('/api/reservations/guest')
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

  @Get('current')
  async getCurrentReservation(
    @Request() req: AuthenticatedRequest
  ): Promise<IReservationByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.reservationService.getCurrentGuestReservation(user._id);
  }

  @Get('history')
  async getReservationHistory(
    @Request() req: AuthenticatedRequest
  ): Promise<IReservationListItemResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.reservationService.getGuestReservationHistory(user._id);
  }
}
