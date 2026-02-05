import { Post, Route, Request, Path, Get, Delete, Tags, Security } from 'tsoa';
import { Types } from 'mongoose';
import { EventRepository } from '../repositories/event.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import { EventService } from '../services/event.service.ts';
import type {
  ICreateEventRequest,
  IEventResponse,
  IEvent,
  IEventListItemResponse,
  GetEventByIdResponse,
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
@Tags('Events')
export class EventsController {
  private eventService: EventService;

  constructor() {
    const eventRepository = new EventRepository();
    const guestRepository = new GuestRepository();
    const hostelRepository = new HostelRepository();
    this.eventService = new EventService(eventRepository, guestRepository, hostelRepository);
  }

  async create(@Request() req: ICreateEventRequest): Promise<IEventResponse> {
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

  async update(
    @Request() req: ICreateEventRequest,
    @Path() eventId: string
  ): Promise<IEventResponse> {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedError('User not authenticated');
    }

    const eventObject: IEvent =
      typeof req.body.event === 'string' ? JSON.parse(req.body.event) : req.body.event;

    const uploadedFiles = (
      Array.isArray(req.files) ? req.files : (req.files?.['images'] ?? [])
    ) as UploadedFile[];
    const imagePaths = uploadedFiles.map(file => getRelativeFilePath(req, file));

    return this.eventService.update(user._id, eventId, eventObject, imagePaths);
  }

  @Get('{hostelId}/list')
  @Security('jwt')
  async listByHostelId(
    @Request() _req: AuthenticatedRequest,
    @Path() hostelId: string
  ): Promise<IEventListItemResponse> {
    const hostelObjectId = new Types.ObjectId(hostelId);
    return this.eventService.listByHostelId(hostelObjectId);
  }

  @Delete('{eventId}/delete')
  @Security('jwt')
  async delete(
    @Request() req: AuthenticatedRequest,
    @Path() eventId: string
  ): Promise<BackendResponse<null>> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }
    return this.eventService.delete(eventId, user._id);
  }

  @Get('{eventId}')
  @Security('jwt')
  async getEventDetails(
    @Request() req: AuthenticatedRequest,
    @Path() eventId: string
  ): Promise<GetEventByIdResponse> {
    const user = req.user;
    if (!user?._id) {
      throw new UnauthorizedError('User not authenticated');
    }
    return this.eventService.getByEventId(eventId.toString());
  }
}

@Route('/api/events/guest')
@Tags('Events Guest')
export class GuestEventsController {
  private eventService: EventService;

  constructor() {
    const eventRepository = new EventRepository();
    const hostelRepository = new HostelRepository();
    const guestRepository = new GuestRepository();
    this.eventService = new EventService(eventRepository, guestRepository, hostelRepository);

  }

  @Get('current-stay')
  @Security('jwt')
  async listEventsForCurrentStay(
    @Request() req: AuthenticatedRequest
  ): Promise<IEventListItemResponse> {
    const user = req.user;
    if (user.role !== 'guest' || !user?._id) {
      throw new UnauthorizedError('User not authenticated as guest');
    }
    return this.eventService.listEventsForCurrentStay(user._id);
  }

  @Get('public/{city}/{country}')
  @Security('jwt')
  async listPublicEvents(
    @Path() city: string,
    @Path() country: string
  ): Promise<IEventListItemResponse> {
    return this.eventService.listPublicEvents(city, country);
  }

  @Post('join/{eventId}')
  @Security('jwt')
  async joinEvent(
    @Request() req: AuthenticatedRequest,
    @Path() eventId: string
  ): Promise<BackendResponse<null>> {
    const user = req.user;
    if (user.role !== 'guest' || !user?._id) {
      throw new UnauthorizedError('User not authenticated as guest');
    }
    return this.eventService.joinEvent(user._id, eventId);
  }

  @Post('leave/{eventId}')
  @Security('jwt')
  async leaveEvent(
    @Request() req: AuthenticatedRequest,
    @Path() eventId: string
  ): Promise<BackendResponse<null>> {
    const user = req.user;
    if (user.role !== 'guest' || !user?._id) {
      throw new UnauthorizedError('User not authenticated as guest');
    }
    return this.eventService.leaveEvent(user._id, eventId);
  }
}
