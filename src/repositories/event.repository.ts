import { Types } from 'mongoose';

import Event from '../models/event.model.ts';
import type {
  IEventAttendee,
  IEventDocument,
  IEventListItem,
} from '../interfaces/event.interface.ts';

export class EventRepository {
  async create(event: Partial<IEventDocument>): Promise<IEventDocument> {
    const newEvent = new Event(event);
    return newEvent.save();
  }

  async findById(eventId: string): Promise<IEventDocument | null> {
    return Event.findById(eventId);
  }

  async findByNameAndHostel(
    name: string,
    created_by: Types.ObjectId
  ): Promise<IEventDocument | null> {
    return Event.findOne({ name, created_by });
  }

  async findByIdWithAttendeeProfiles(eventId: string): Promise<IEventDocument | null> {
    const event = await Event.findById(eventId)
      .populate('attendees', 'profile_image')
      .populate({ path: 'hostel_id', select: 'currency' })
      .lean();

    if (!event) return null;

    return {
      ...event,
      attendees: (event.attendees as IEventAttendee[]).map((guest: any) => ({
        _id: guest._id?.toString(),
        profile_image: guest.profile_image,
      })),
    } as IEventDocument;
  }

  async findUpcomingByHostelId(hostelId: Types.ObjectId): Promise<IEventListItem[]> {
    const events = await Event.find({ hostel_id: hostelId, end_date: { $gte: new Date() } })
      .sort({ start_date: 1 })
      .populate({ path: 'attendees', select: 'profile_image' })
      .populate({ path: 'hostel_id', select: 'currency' })
      .lean();
    return events.map(event => ({
      _id: event._id.toString(),
      name: event.name,
      photos_last_event: event.photos_last_event,
      start_date: event.start_date,
      attendees:
        (event.attendees as IEventAttendee[])?.map(guest => ({
          profile_image: guest.profile_image,
          _id: guest._id.toString(),
        })) ?? [],
      price: event.free_entry ? undefined : event.price,
      currency: event.currency,
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

  async deleteByIdAndCreatedBy(eventId: string, userId: string): Promise<IEventDocument | null> {
    return Event.findOneAndDelete({
      _id: eventId,
      created_by: userId,
    });
  }

  async findPublicUpcomingEvents(
    city: string,
    country: string,
    hostelIds: string[]
  ): Promise<IEventListItem[]> {
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
      _id: event._id.toString(),
      name: event.name,
      photos_last_event: event.photos_last_event,
      start_date: event.start_date,
      attendees:
        (event.attendees as IEventAttendee[])?.map(guest => ({
          _id: guest._id.toString(),
          profile_image: guest.profile_image,
        })) ?? [],
      price: event.free_entry ? undefined : event.price,
      currency: event.currency,
      free_entry: event.free_entry,
    }));
  }
}
