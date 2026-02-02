import fs from 'fs';
import path from 'path';

import { Post, Route, Request, Get, Put, Delete, Path, Body, Consumes } from 'tsoa';

import { GuestService } from '../services/guest.service.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { UnauthorizedError } from '../utils/errors.ts';
import type {
  ICreateGuestResponse,
  IGuestByIdResponse,
  IGuest,
  IGuestCurrentStayResponse,
  IGuestDocument,
} from '../interfaces/guest.interface.ts';
import type {
  AuthenticatedRequest,
  BackendResponse,
  UploadedFile,
} from '../interfaces/index.interface.ts';
// @ts-ignore
import { getRelativeFilePath } from '../middleware/saveUploads.js';

@Route('/api/guests')
export class GuestController {
  private guestService: GuestService;

  constructor() {
    const guestRepository = new GuestRepository();
    const hostelRepository = new HostelRepository();
    const reservationRepository = new ReservationRepository();
    this.guestService = new GuestService(guestRepository, hostelRepository, reservationRepository);
  }

  @Post('create')
  @Consumes('multipart/form-data')
  async create(@Request() req: AuthenticatedRequest): Promise<ICreateGuestResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    const guestData =
      typeof req.body.guest === 'string' ? JSON.parse(req.body.guest) : req.body.guest;

    const uploadedFiles = (req.files ?? []) as UploadedFile[];
    const imagePaths = uploadedFiles.map(file => getRelativeFilePath(req, file));

    return this.guestService.create(guestData, user._id, imagePaths);
  }

  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest): Promise<IGuestByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.guestService.getByUserId(user._id);
  }

  @Put('update')
  async update(
    @Request() req: AuthenticatedRequest,
    @Body() guestData: any
  ): Promise<BackendResponse<Partial<IGuest>>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.guestService.update(user._id, guestData);
  }

  @Get('search/{username}')
  async searchGuests(
    @Request() req: AuthenticatedRequest,
    @Path() username: string
  ): Promise<BackendResponse<IGuestDocument[]>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.guestService.searchGuests(username, user._id);
  }

  @Post('photos')
  @Consumes('multipart/form-data')
  async updatePhoto(
    @Request() req: AuthenticatedRequest
  ): Promise<BackendResponse<{ imagePath: string }>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    const { imageId } = req.body;
    const imagePath = getRelativeFilePath(req, (req as any).file);

    return this.guestService.updateGuestPhoto(user._id, parseInt(imageId), imagePath);
  }

  @Delete('photos/{imageId}')
  async deletePhoto(
    @Request() req: AuthenticatedRequest,
    @Path() imageId: string
  ): Promise<BackendResponse<{ imagePath: string }>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    // Delete address from database
    const result = await this.guestService.deleteGuestPhoto(user._id, parseInt(imageId));

    // Delete physical file
    if (result.data?.imagePath) {
      const fullImagePath = path.resolve(result.data.imagePath);
      fs.unlink(fullImagePath, err => {
        if (err) {
          console.error('Error deleting file: ', err);
        }
      });
    }

    return result;
  }

  @Get('current-stay')
  async getCurrentStay(@Request() req: AuthenticatedRequest): Promise<IGuestCurrentStayResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.guestService.getCurrentStay(user._id);
  }
}
