import { EventRepository } from '../repositories/event.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';
import type {
  GetEventByIdResponse,
  ICreateEventResponse,
  IEvent,
  IEventDocument,
  IEventListItem,
  IEventListItemResponse,
} from '../interfaces/event.interface.ts';
import { BadRequestError, NotFoundError } from '../utils/errors.ts';
import { Types } from 'mongoose';
import { BackendResponse } from '../interfaces/index.ts';
import { GuestRepository } from '../repositories/guest.repository.ts';
import { ReservationRepository } from '../repositories/reservation.repository.ts';

export class EventService {
  private readonly eventRepo: EventRepository;

  constructor(eventRepo: EventRepository) {
    this.eventRepo = eventRepo;
  }

  async create(
    hostelId: Types.ObjectId,
    event: IEvent,
    imagePaths: string[]
  ): Promise<ICreateEventResponse> {
    if (event.name === undefined || event.name === null) {
      throw new BadRequestError('Event name is required');
    }

    if (event.description === undefined || event.description === null) {
      throw new BadRequestError('Event description is required');
    }

    if (event.hostel_location === undefined || event.hostel_location === null) {
      throw new BadRequestError('Hostel location flag is required');
    }

    if (event.free_entry === undefined || event.free_entry === null) {
      throw new BadRequestError('Free entry flag is required');
    }

    if (
      event.free_entry === false &&
      !event.payment_to_hostel &&
      !event.price &&
      !event.receive_payment_online &&
      !event.payment_methods?.length
    ) {
      throw new BadRequestError('Payment details are required');
    }

    if (
      event.unlimited_spots === false &&
      (event.spots_available === undefined || event.spots_available < 0)
    ) {
      throw new Error(
        'Spots available must be provided and non-negative when unlimited_spots is false'
      );
    }

    event.hostel_id = hostelId;
    event.photos_last_event = imagePaths as string[];

    const createdEvent: IEventDocument = await this.eventRepo.create(event);

    return { message: 'Event created successfully', success: true, data: createdEvent };
  }

  async getByEventId(eventId: string): Promise<GetEventByIdResponse> {
    const event = await this.eventRepo.findByIdWithAttendeeProfiles(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    return { success: true, message: 'Event retrieved successfully', data: event };
  }

  async listByHostelId(hostelId: Types.ObjectId): Promise<IEventListItemResponse> {
    const events = await this.eventRepo.findUpcomingByHostelId(hostelId);

    if (!events || events.length === 0) {
      throw new NotFoundError('No upcoming events found for the hostel');
    }
    return { success: true, message: 'Events retrieved successfully', data: events };
  }

  // TODO: FINISH THIS
  async update(
    eventId: string,
    eventData: Partial<IEvent>,
    imagePaths: string[]
  ): Promise<BackendResponse<null>> {
    const existingEvent = await this.eventRepo.findById(eventId);
    if (!existingEvent) {
      throw new NotFoundError('Event not found');
    }

    Object.assign(existingEvent, eventData);

    await this.eventRepo.update(eventId, existingEvent);
    return { success: true, message: 'Event updated successfully' };
  }

  async delete(eventId: string, hostelId: string): Promise<BackendResponse<null>> {
    const deletedEvent = await this.eventRepo.deleteByIdAndHostel(eventId, hostelId);

    if (!deletedEvent) {
      throw new NotFoundError('Event not found');
    }
    return { success: true, message: 'Event deleted successfully' };
  }
}

export class GuestEventService {
  private readonly eventRepo: EventRepository;
  private readonly hostelRepo: HostelRepository;
  private readonly guestRepo: GuestRepository;

  constructor(
    eventRepo: EventRepository,
    hostelRepo: HostelRepository,
    guestRepo: GuestRepository
  ) {
    this.eventRepo = eventRepo;
    this.hostelRepo = hostelRepo;
    this.guestRepo = guestRepo;
  }

  async listPublicEvents(city: string, country: string): Promise<IEventListItemResponse> {
    if (!city || !country) {
      throw new BadRequestError('City and country are required');
    }

    const hostelsInLocation = await this.hostelRepo.findByLocation(city, country);
    const hostelIds = hostelsInLocation.map(hostel => hostel._id.toString());

    const events = await this.eventRepo.findPublicUpcomingEvents(city, country, hostelIds);

    return { success: true, message: 'Public events retrieved successfully', data: events };
  }

  async joinEvent(userId: Types.ObjectId, eventId: string): Promise<BackendResponse<null>> {
    const event = await this.eventRepo.findById(eventId);
    const guest = await this.guestRepo.findById(userId);

    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if user is already attending
    if (event.attendees && event.attendees.includes(guest._id)) {
      throw new BadRequestError('User already joined the event');
    }

    // Check if event has unlimited spots or if there are available spots
    if (!event.unlimited_spots && event.spots_available && event.attendees) {
      if (event.attendees.length >= event.spots_available) {
        throw new BadRequestError('Event is full');
      }
    }

    // Add user to attendees
    if (!event.attendees) {
      event.attendees = [];
    }
    event.attendees.push(guest._id);

    await this.eventRepo.update(eventId, event);

    return { success: true, message: 'Successfully joined event' };
  }

  async leaveEvent(userId: Types.ObjectId, eventId: string): Promise<BackendResponse<null>> {
    const event = await this.eventRepo.findById(eventId);
    const guest = await this.guestRepo.findById(userId);

    if (!guest) {
      throw new NotFoundError('Guest not found');
    }

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if user is attending
    if (!event.attendees || !event.attendees.includes(guest._id)) {
      throw new BadRequestError('User is not attending the event');
    }

    // Remove user from attendees
    event.attendees = event.attendees.filter(
      attendeeId => attendeeId.toString() !== guest._id.toString()
    );

    await this.eventRepo.update(eventId, event);

    return { success: true, message: 'Successfully left event' };
  }

  async listEventsForCurrentStay(userId: string): Promise<IEventListItemResponse> {
    const reservationRepository = new ReservationRepository();

    const activeReservation = await reservationRepository.findCurrentStayByGuestId(userId);

    if (!activeReservation) {
      throw new NotFoundError('No active reservation found');
    }

    const events = await this.eventRepo.findUpcomingByHostelId(activeReservation.hostel_id);

    return { success: true, message: 'Events retrieved successfully', data: events };
  }
}
