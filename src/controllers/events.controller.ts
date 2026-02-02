import { Post, Route, Request, Consumes, Path, Get, Put, Delete } from 'tsoa';
import { Types } from 'mongoose';

import { EventRepository } from '../repositories/event.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { EventService, GuestEventService } from '../services/event.service.ts';
import type {
  ICreateEventRequest,
  ICreateEventResponse,
  IEvent,
  IEventListItemResponse,
} from '../interfaces/event.interface.ts';
import { UnauthorizedError } from '../utils/errors.ts';
import type {
  AuthenticatedRequest,
  BackendResponse,
  UploadedFile,
} from '../interfaces/index.interface.ts';
// @ts-ignore
import { getRelativeFilePath } from '../middleware/saveUploads.js';
import { GuestRepository } from '../repositories/guest.repository.ts';

@Route('/api/events')
export class EventsController {
  private eventService: EventService;

  constructor() {
    const eventRepository = new EventRepository();
    this.eventService = new EventService(eventRepository);
  }

  @Post('create')
  @Consumes('multipart/form-data')
  async create(@Request() req: ICreateEventRequest): Promise<ICreateEventResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    const eventObject: IEvent =
      typeof req.body.event === 'string' ? JSON.parse(req.body.event) : req.body.event;

    const uploadedFiles = (req.files ?? []) as UploadedFile[];
    const imagePaths = uploadedFiles.map(file => getRelativeFilePath(req, file));

    return this.eventService.create(user._id, eventObject, imagePaths);
  }

  @Get('{hostelId}/list')
  async listByHostelId(
    @Request() req: AuthenticatedRequest,
    @Path() hostelId: string
  ): Promise<IEventListItemResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    const hostelObjectId = new Types.ObjectId(hostelId);
    return this.eventService.listByHostelId(hostelObjectId);
  }

  @Put('{eventId}/update')
  @Consumes('multipart/form-data')
  async update(
    @Request() req: AuthenticatedRequest,
    @Path() eventId: string,
  ): Promise<BackendResponse<null>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }

    const eventObject: IEvent =
      typeof req.body.event === 'string' ? JSON.parse(req.body.event) : req.body.event;

    // const uploadedFiles = (req.files ?? []) as UploadedFile[];
    // const imagePaths = uploadedFiles.map(file => getRelativeFilePath(req, file));

    return this.eventService.update(eventId, eventObject);
  }

  @Delete('{eventId}/{hostelId}/delete')
  async delete(
    @Request() req: AuthenticatedRequest,
    @Path() eventId: string,
    @Path() hostelId: string
  ): Promise<BackendResponse<null>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }
    return this.eventService.delete(eventId, hostelId);
  }
}

@Route('/api/events/guest')
export class GuestEventsController {
  private eventService: GuestEventService;

  constructor() {
    const eventRepository = new EventRepository();
    const hostelRepository = new HostelRepository();
    const guestRepo = new GuestRepository();
    this.eventService = new GuestEventService(eventRepository, hostelRepository, guestRepo);
  }

  @Get('current-stay')
  async listEventsForCurrentStay(
    @Request() req: AuthenticatedRequest
  ): Promise<IEventListItemResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }
    return this.eventService.listEventsForCurrentStay(user._id);
  }

  @Get('public/{city}/{country}')
  async listPublicEvents(
    @Path() city: string,
    @Path() country: string
  ): Promise<IEventListItemResponse> {
    return this.eventService.listPublicEvents(city, country);
  }

  @Post('join/{eventId}')
  async joinEvent(
    @Request() req: AuthenticatedRequest,
    @Path() eventId: string
  ): Promise<BackendResponse<null>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }
    return this.eventService.joinEvent(user._id, eventId);
  }

  @Post('leave/{eventId}')
  async leaveEvent(
    @Request() req: AuthenticatedRequest,
    @Path() eventId: string
  ): Promise<BackendResponse<null>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }
    return this.eventService.leaveEvent(user._id, eventId);
  }
}
