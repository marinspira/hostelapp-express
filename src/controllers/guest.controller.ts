import fs from 'fs';
import path from 'path';
import { Post, Route, Request, Get, Delete, Path, Consumes, Tags, Security } from 'tsoa';
import { GuestService } from '../services/guest.service.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';
import { UnauthorizedError } from '../utils/errors.ts';
import type {
  IGuestByIdResponse,
  IGuest,
  IGuestCurrentStayResponse,
  IGuestDocument,
  ICreateGuestRequest,
  IGuestResponse,
} from '../interfaces/guest.interface.ts';
import type {
  AuthenticatedRequest,
  BackendResponse,
  UploadedFile,
} from '../interfaces/index.interface.ts';
// @ts-ignore
import { getRelativeFilePath } from '../middleware/saveUploads.js';

@Route('/api/guests')
@Tags('Guests')
export class GuestController {
  private guestService: GuestService;

  constructor() {
    const guestRepository = new GuestRepository();
    const hostelRepository = new HostelRepository();
    const reservationRepository = new ReservationRepository();
    this.guestService = new GuestService(guestRepository, hostelRepository, reservationRepository);
  }

  async create(req: ICreateGuestRequest): Promise<IGuestResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (user.role !== 'guest') {
      throw new UnauthorizedError(
        'Only users signed up with guest role can create a guest profile'
      );
    }

    const guestData =
      typeof req.body.guest === 'string' ? JSON.parse(req.body.guest) : req.body.guest;

    const uploadedFiles = (req.files ?? []) as UploadedFile[];
    const imagePaths = uploadedFiles.map(file => getRelativeFilePath(req, file));

    return this.guestService.create(guestData, user._id, imagePaths);
  }

  async update(
    @Request() req: ICreateGuestRequest,
    @Path() guestId: string
  ): Promise<IGuestResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (user.role !== 'guest') {
      throw new UnauthorizedError('Only guests can update their profile');
    }

    const guestData =
      typeof req.body.guest === 'string' ? JSON.parse(req.body.guest) : req.body.guest;

    const uploadedFiles = (req.files ?? []) as UploadedFile[];
    const imagePaths = uploadedFiles.map(file => getRelativeFilePath(req, file));

    return this.guestService.update(user._id, guestData, imagePaths);
  }

  @Get('current-stay')
  @Security('jwt')
  async getCurrentStay(@Request() req: AuthenticatedRequest): Promise<IGuestCurrentStayResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.guestService.getCurrentStay(user._id);
  }

  @Get('search/{username}')
  @Security('jwt')
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

  @Delete('photos/{imageId}')
  @Security('jwt')
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

    const response = {
      success: result.success,
      message: result.message,
    };

    return response;
  }

  @Get('{guestId}')
  @Security('jwt')
  async getProfile(
    @Request() _req: AuthenticatedRequest,
    @Path() guestId: string
  ): Promise<IGuestByIdResponse> {
    return this.guestService.getByGuestId(guestId);
  }

  @Delete('{guestId}/delete')
  @Security('jwt')
  async deleteGuest(
    @Request() req: AuthenticatedRequest,
    @Path() guestId: string
  ): Promise<BackendResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.guestService.deleteGuest(guestId, user._id);
  }
}
