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

    console.log("imagePaths:", imagePaths);

    if (!hostel) {
      throw new Error('Hostel does not exist');
    }

    const parsedEvent = typeof event === 'string' ? JSON.parse(event) : event;

    const parsedAddress =
      typeof parsedEvent.address === 'string' ? JSON.parse(parsedEvent.address) : parsedEvent.address;

    if (
      parsedEvent.free_entry === false &&
      !parsedEvent.payment_to_hostel &&
      !parsedEvent.price &&
      !parsedEvent.receive_payment_online &&
      !parsedEvent.payment_methods?.length
    ) {
      throw new Error('Payment details are required');
    }

    if (!parsedEvent.hostel_location && !parsedAddress || parsedEvent.hostel_location && parsedAddress) {
      throw new Error('Address only is required when hostel_location is false');
    }

    if (parsedEvent.unlimited_spots === false && (parsedEvent.spots_available === undefined || parsedEvent.spots_available < 0)) {
      throw new Error('Spots available must be provided and non-negative when unlimited_spots is false');
    }

    return this.eventRepo.create({
      name: parsedEvent.name,
      description: parsedEvent.description,
      hostel_location: parsedEvent.hostel_location,
      address: {
        street: parsedAddress?.street,
        city: parsedAddress?.city,
        zip: parsedAddress?.zip,
      },
      startDate: parsedEvent.startDate,
      endDate: parsedEvent.endDate,
      photos_last_event: imagePaths,
      unlimited_spots: parsedEvent.unlimited_spots,
      spots_available: parsedEvent.spots_available,
      free_entry: parsedEvent.free_entry,
      price: parsedEvent.price,
      payment_to_hostel: parsedEvent.payment_to_hostel,
      receive_payment_online: parsedEvent.receive_payment_online,
      event_recurring: parsedEvent.event_recurring,
      event_frequency: parsedEvent.event_frequency,
      payment_methods: parsedEvent.payment_methods,
      hostel_id: hostel._id,
      status: 'approved',
    });
  }
}
