import { Route, Request, Get, Delete, Tags, Security } from 'tsoa';
import { Types } from 'mongoose';

import { HostelService } from '../services/hostel.service';
import { HostelRepository } from '../repositories/hostel.repository';
import { UnauthorizedError } from '../utils/errors';
import type { ICreateHostelResponse, IHostelByIdResponse } from '../interfaces/hostel.interface';
import type { AuthenticatedRequest, BackendResponse } from '../interfaces/index.interface';
// @ts-ignore
import { getRelativeFilePath } from '../middleware/saveUploads';

@Route('/api/hostels')
@Tags('Hostels')
export class HostelController {
  private hostelService: HostelService;

  constructor() {
    const hostelRepository = new HostelRepository();
    this.hostelService = new HostelService(hostelRepository);
  }

  async create(req: AuthenticatedRequest): Promise<ICreateHostelResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (user.role !== 'host') {
      throw new UnauthorizedError(
        'Only users signed up with hostel_owner role can create a hostel profile'
      );
    }

    const hostelData =
      typeof req.body.hostel === 'string' ? JSON.parse(req.body.hostel) : req.body.hostel;

    const logoPath = (req as any).file ? getRelativeFilePath(req, (req as any).file) : undefined;

    return this.hostelService.create(hostelData, user._id, logoPath);
  }

  async update(req: AuthenticatedRequest): Promise<IHostelByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    const hostelData =
      typeof req.body.hostel === 'string' ? JSON.parse(req.body.hostel) : req.body.hostel;

    const logoPath = (req as any).file ? getRelativeFilePath(req, (req as any).file) : undefined;

    return this.hostelService.update(user._id, hostelData, logoPath);
  }

  @Delete('delete')
  @Security('jwt')
  async delete(@Request() req: AuthenticatedRequest): Promise<BackendResponse<null>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    if (user.role !== 'host') {
      throw new UnauthorizedError('Only hostel owners can delete their hostel profile');
    }

    return this.hostelService.delete(user._id);
  }

  @Get('mine')
  @Security('jwt')
  async getMyHostel(@Request() req: AuthenticatedRequest): Promise<IHostelByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    return this.hostelService.getByOwnerId(user._id);
  }

  @Get(':id')
  @Security('jwt')
  async getHostel(@Request() req: AuthenticatedRequest): Promise<IHostelByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    const hostelId = new Types.ObjectId(req.params.id);
    return this.hostelService.getById(hostelId, user._id);
  }
}
