import Event from '../models/event.model.ts';
import type { EventAttendee, IEventDocument, IEventListItemDTO } from '../interfaces/event.ts';

export class EventRepository {
  async create(event: Partial<IEventDocument>): Promise<IEventDocument> {
    const newEvent = new Event(event);
    return newEvent.save();
  }

  async findById(eventId: string): Promise<IEventDocument | null> {
    return Event.findById(eventId);
  }

  async findByIdWithAttendeeProfiles(
    eventId: string
  ): Promise<
    | (Omit<IEventDocument, 'attendees'> & { attendees: { id: string; profileImage?: string }[] })
    | null
  > {
    const event = await Event.findById(eventId)
      .populate('attendees', 'profileImage')
      .populate({ path: 'hostel_id', select: 'currency' })
      .lean();

    if (!event) return null;

    return {
      ...event,
      attendees: (event.attendees as any[]).map((guest: any) => ({
        id: guest._id?.toString(),
        profileImage: guest.profile,
      })),
      currency: (event.hostel_id as any)?.currency,
    };
  }

  async findByHostelId(hostelId: string): Promise<IEventDocument[]> {
    return Event.find({ hostel_id: hostelId }).populate('attendees', 'name email profileImage');
  }

  async findUpcomingByHostelId(hostelId: string): Promise<IEventListItemDTO[]> {
    const events = await Event.find({ hostel_id: hostelId, end_date: { $gte: new Date() } })
      .sort({ start_date: 1 })
      .populate({ path: 'attendees', select: 'profile_image' })
      .populate({ path: 'hostel_id', select: 'currency' })
      .lean();
    return events.map(event => ({
      id: event._id.toString(),
      name: event.name,
      photos_last_event: event.photos_last_event,
      start_date: event.start_date,
      attendees:
        (event.attendees as any[])?.map(a => ({
          profile_image: a.profile_image ?? null,
          id: a._id.toString(),
        })) ?? [],
      price: event.free_entry ? undefined : event.price,
      currency: (event.hostel_id as any)?.currency ?? null,
      free_entry: event.free_entry,
    }));
  }

  async update(id: string, data: Partial<IEventDocument>): Promise<IEventDocument | null> {
    return Event.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id: string): Promise<IEventDocument | null> {
    return Event.findByIdAndDelete(id);
  }

  async deleteByIdAndHostel(eventId: string, hostelId: string): Promise<IEventDocument | null> {
    return Event.findOneAndDelete({
      _id: eventId,
      hostel_id: hostelId,
    });
  }

  async findPublicUpcomingEvents(
    city: string,
    country: string,
    hostelIds: string[]
  ): Promise<IEventListItemDTO[]> {
    const query = {
      open_to_public: true,
      end_date: { $gte: new Date() },
      $or: [
        {
          hostel_location: false,
          'address.city': { $regex: new RegExp(city, 'i') },
          'address.country': { $regex: new RegExp(country, 'i') },
        },
        { hostel_location: true, hostel_id: { $in: hostelIds } },
      ],
    };
    const events = await Event.find(query)
      .select({
        name: 1,
        start_date: 1,
        photos_last_event: { $slice: 1 },
        price: 1,
        free_entry: 1,
        attendees: 1,
        hostel_id: 1,
      })
      .sort({ start_date: 1 })
      .populate({ path: 'attendees', select: 'profile_image' })
      .populate({ path: 'hostel_id', select: 'currency' })
      .lean();
    return events.map(event => ({
      id: event._id.toString(),
      name: event.name,
      photos_last_event: event.photos_last_event,
      start_date: event.start_date,
      attendees:
        (event.attendees as any[])?.map(a => ({
          profile_image: a.profile_image ?? null,
          id: a._id.toString(),
        })) ?? [],
      price: event.free_entry ? undefined : event.price,
      currency: (event.hostel_id as any)?.currency ?? null,
      free_entry: event.free_entry,
    }));
  }
}
