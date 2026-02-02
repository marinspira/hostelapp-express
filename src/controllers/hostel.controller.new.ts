import { Post, Route, Request, Get, Put, Delete, Body, Consumes } from 'tsoa';

import { HostelService } from '../services/hostel.service.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { UnauthorizedError } from '../utils/errors.ts';
import type {
  ICreateHostelResponse,
  IHostelByIdResponse,
  IGuestListResponse,
  IHostel,
} from '../interfaces/hostel.interface.ts';
import type { AuthenticatedRequest, BackendResponse } from '../interfaces/index.interface.ts';
// @ts-ignore
import { getRelativeFilePath } from '../middleware/saveUploads.js';

@Route('/api/hostels')
export class HostelController {
  private hostelService: HostelService;

  constructor() {
    const hostelRepository = new HostelRepository();
    const reservationRepository = new ReservationRepository();
    const guestRepository = new GuestRepository();
    this.hostelService = new HostelService(
      hostelRepository,
      reservationRepository,
      guestRepository
    );
  }

  @Post('create')
  @Consumes('multipart/form-data')
  async create(@Request() req: AuthenticatedRequest): Promise<ICreateHostelResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    const hostelData =
      typeof req.body.hostel === 'string' ? JSON.parse(req.body.hostel) : req.body.hostel;
    const logoPath = (req as any).file ? getRelativeFilePath(req, (req as any).file) : undefined;

    return this.hostelService.create(hostelData, user._id, logoPath);
  }

  @Get(':id')
  async getHostel(@Request() req: AuthenticatedRequest): Promise<IHostelByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    const hostelId = req.params.id;
    return this.hostelService.getById(hostelId);
  }

  @Put('update')
  async update(
    @Request() req: AuthenticatedRequest,
    @Body() hostelData: Partial<IHostel>
  ): Promise<IHostelByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.hostelService.update(user._id, hostelData);
  }

  @Delete('delete')
  async delete(@Request() req: AuthenticatedRequest): Promise<BackendResponse<null>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.hostelService.delete(user._id);
  }

  @Get('guests/current')
  async getCurrentGuests(@Request() req: AuthenticatedRequest): Promise<IGuestListResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.hostelService.getAllCurrentGuests(user._id);
  }
}
