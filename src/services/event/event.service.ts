import type { IEventDocument } from '../../models/event.model.ts';
import { EventRepository } from '../../repositories/event.repository.ts';
import { HostelRepository } from '../../repositories/hostel.repository.ts';
import type { IEvent } from '../../interfaces/event.ts';

export class EventService {
  private readonly eventRepo: EventRepository;
  private readonly hostelRepo: HostelRepository;

  constructor(eventRepo: EventRepository, hostelRepo: HostelRepository) {
    this.eventRepo = eventRepo;
    this.hostelRepo = hostelRepo;
  }

  async createEvent(userId: string, event: IEvent, imagePaths: string[]): Promise<IEventDocument> {
    const hostel = await this.hostelRepo.findByOwner(userId);

    console.log('imagePaths:', imagePaths);

    if (!hostel) {
      throw new Error('Hostel does not exist');
    }

    const parsedEvent = typeof event === 'string' ? JSON.parse(event) : event;

    const parsedAddress =
      typeof parsedEvent.address === 'string'
        ? JSON.parse(parsedEvent.address)
        : parsedEvent.address;

    if (parsedEvent.name === undefined || parsedEvent.name === null) {
      throw new Error('Event name is required');
    }

    if (parsedEvent.description === undefined || parsedEvent.description === null) {
      throw new Error('Event description is required');
    }

    if (parsedEvent.hostel_location === undefined || parsedEvent.hostel_location === null) {
      throw new Error('Hostel location flag is required');
    }

    if (parsedEvent.unlimited_spots === undefined || parsedEvent.unlimited_spots === null) {
      throw new Error('Unlimited spots flag is required');
    }

    if (parsedEvent.free_entry === undefined || parsedEvent.free_entry === null) {
      throw new Error('Free entry flag is required');
    }

    if (parsedEvent.event_recurring === undefined || parsedEvent.event_recurring === null) {
      throw new Error('Event recurring flag is required');
    }

    if (!parsedEvent.payment_methods || !Array.isArray(parsedEvent.payment_methods)) {
      throw new Error('Payment methods are required');
    }

    if (
      parsedEvent.free_entry === false &&
      !parsedEvent.payment_to_hostel &&
      !parsedEvent.price &&
      !parsedEvent.receive_payment_online &&
      !parsedEvent.payment_methods?.length
    ) {
      throw new Error('Payment details are required');
    }

    if (
      (!parsedEvent.hostel_location && !parsedAddress) ||
      (parsedEvent.hostel_location === true && parsedAddress)
    ) {
      throw new Error('Address only is required when hostel_location is false');
    }

    if (
      parsedEvent.unlimited_spots === false &&
      (parsedEvent.spots_available === undefined || parsedEvent.spots_available < 0)
    ) {
      throw new Error(
        'Spots available must be provided and non-negative when unlimited_spots is false'
      );
    }

    const eventData: any = {
      name: parsedEvent.name,
      description: parsedEvent.description,
      hostel_location: parsedEvent.hostel_location,
      startDate: parsedEvent.startDate,
      endDate: parsedEvent.endDate,
      photos_last_event: imagePaths || [],
      unlimited_spots: parsedEvent.unlimited_spots,
      free_entry: parsedEvent.free_entry,
      event_recurring: parsedEvent.event_recurring,
      payment_methods: parsedEvent.payment_methods,
      hostel_id: hostel._id,
      status: 'approved',
    };

    // Only add address if hostel_location is false
    if (!parsedEvent.hostel_location && parsedAddress) {
      eventData.address = {
        street: parsedAddress.street,
        city: parsedAddress.city,
        zip: parsedAddress.zip,
      };
    }

    // Only add spots_available if unlimited_spots is false
    if (!parsedEvent.unlimited_spots) {
      eventData.spots_available = parsedEvent.spots_available;
    }

    // Only add price if free_entry is false
    if (!parsedEvent.free_entry) {
      eventData.price = parsedEvent.price;
      eventData.payment_to_hostel = parsedEvent.payment_to_hostel;
    }

    // Only add receive_payment_online if provided
    if (parsedEvent.receive_payment_online !== undefined) {
      eventData.receive_payment_online = parsedEvent.receive_payment_online;
    }

    // Only add event_frequency if event_recurring is true
    if (parsedEvent.event_recurring && parsedEvent.event_frequency) {
      eventData.event_frequency = parsedEvent.event_frequency;
    }

    return this.eventRepo.create(eventData);
  }
}
