import Event from '../models/event.model.ts';
import type { IEventDocument } from '../interfaces/event.ts';

export class EventRepository {
  async create(event: Partial<IEventDocument>): Promise<IEventDocument> {
    const newEvent = new Event(event);
    return newEvent.save();
  }

  async findById(id: string): Promise<IEventDocument | null> {
    return Event.findById(id);
  }

  async findByHostelId(hostelId: string): Promise<IEventDocument[]> {
    return Event.find({ hostel_id: hostelId })
      .populate('attendees', 'name email profileImage');
  }

  async findUpcomingByHostelId(hostelId: string): Promise<IEventDocument[]> {
    return Event.find({ 
      hostel_id: hostelId,
      endDate: { $gte: new Date() }
    })
    .sort({ startDate: 1 })
    .populate('attendees', 'name email profileImage');
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

  async findPublicUpcomingEvents(city: string, country: string, hostelIds: string[]): Promise<IEventDocument[]> {
    const query = {
      open_to_public: true,
      endDate: { $gte: new Date() }, // Only upcoming events
      $or: [
        {
          hostel_location: false,
          'address.city': { $regex: new RegExp(city, 'i') },
          'address.country': { $regex: new RegExp(country, 'i') },
        },
        {
          hostel_location: true,
          hostel_id: { $in: hostelIds },
        },
      ],
    };

    return Event.find(query)
      .sort({ startDate: 1 })
      .populate('hostel_id', 'name address')
      .populate('attendees', 'name email profileImage');
  }
}
