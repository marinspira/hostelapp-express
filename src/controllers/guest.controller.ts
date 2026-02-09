import fs from 'fs';
import path from 'path';

import { Route, Request, Get, Delete, Path, Tags, Security } from 'tsoa';

import { GuestService } from '../services/guest.service';
import { GuestRepository } from '../repositories/guest.repository';
import { HostelRepository } from '../repositories/hostel.repository';
import { UnauthorizedError } from '../utils/errors';
import type {
  IGuestByIdResponse,
  IGuestDocument,
  ICreateGuestRequest,
  IGuestResponse,
} from '../interfaces/guest.interface';
import type {
  AuthenticatedRequest,
  BackendResponse,
  UploadedFile,
} from '../interfaces/index.interface';
// @ts-ignore
import { getRelativeFilePath } from '../middleware/saveUploads';

@Route('/api/guests')
@Tags('Guests')
export class GuestController {
  private guestService: GuestService;

  constructor() {
    const guestRepository = new GuestRepository();
    const hostelRepository = new HostelRepository();
    this.guestService = new GuestService(guestRepository, hostelRepository);
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

  async update(@Request() req: ICreateGuestRequest): Promise<IGuestResponse> {
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

  @Get('me')
  @Security('jwt')
  async getMyProfile(@Request() req: AuthenticatedRequest): Promise<IGuestByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.guestService.getByUserId(user._id);
  }

  @Get('{guestId}')
  @Security('jwt')
  async getProfile(
    @Request() req: AuthenticatedRequest,
    @Path() guestId: string
  ): Promise<IGuestByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

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
