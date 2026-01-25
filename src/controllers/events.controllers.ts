import type { Response } from 'express';

// @ts-ignore
import Hostel from '../models/hostel.model.ts';
import Event from '../models/event.model.ts';
import Reservation from '../models/reservation.model.ts';
import type { IEventDocument } from '../interfaces/event.ts';
// @ts-ignore
import { getRelativeFilePath } from '../middleware/saveUploads.js';
import type { AuthenticatedRequest } from '../interfaces/index.ts';
import type { IEvent } from '../interfaces/event.ts';
import type { IUserDocument } from '../interfaces/user.ts';
import type { BackendResponse } from '../interfaces/response.ts';
import { formatPrice } from '../utils/formatPrice.ts';
import { EventService } from '../services/event/event.service.ts';
import { EventRepository } from '../repositories/event.repository.ts';
import { HostelRepository } from '../repositories/hostel.repository.ts';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

interface CreateEventRequest extends AuthenticatedRequest {
  body: {
    event: string;
  };
  files: {
    map: (_callback: (_file: UploadedFile) => string) => string[];
  };
  user: IUserDocument;
}

export const createEvent = async (
  req: CreateEventRequest,
  res: Response<BackendResponse<IEventDocument>>
) => {
  try {
    const imagePaths = req.files ? req.files.map(file => getRelativeFilePath(req, file)) : [];

    const eventService = new EventService(new EventRepository(), new HostelRepository());

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or missing user ID',
      });
    }
    const userId = req.user._id.toString();

    const eventObject: IEvent =
      typeof req.body.event === 'string' ? JSON.parse(req.body.event) : req.body.event;

    const event = await eventService.createEvent(userId, eventObject, imagePaths);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllEvents = async (
  req: AuthenticatedRequest & { params: { hostelId: string } },
  res: Response<BackendResponse<IEventDocument[]>>
): Promise<Response<BackendResponse<IEventDocument[]>>> => {
  try {
    const { hostelId } = req.params;

    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found',
      });
    }

    const events: IEventDocument[] = await Event.find({ hostel_id: hostel._id })
      .populate('attendees', 'name email profileImage');

    const formattedEvents = events.map(event => ({
      ...event.toObject(),
      price: formatPrice(event.price),
    }));

    return res.status(200).json({
      message: 'Events found successfully',
      success: true,
      data: formattedEvents,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

export const updateEvent = async (
  req: CreateEventRequest & { params: { id: string } },
  res: Response<BackendResponse<IEventDocument>>
): Promise<Response<BackendResponse<IEventDocument>>> => {
  const user = req.user;
  const eventId = req.params.id;
  const hostel = await Hostel.findOne({
    user_id_owners: user._id,
  });

  const event: IEvent =
    typeof req.body.event === 'string' ? JSON.parse(req.body.event) : req.body.event;

  let parsedAddress;
  if (typeof event.address === 'string') {
    try {
      parsedAddress = JSON.parse(event.address);
    } catch (e) {
      console.log('Failed to parse address string:', e);
      parsedAddress = null;
    }
  } else {
    parsedAddress = event.address;
  }

  const imagePaths: string[] = req.files
    ? req.files.map(file => getRelativeFilePath(req, file))
    : [];

  if (!hostel) {
    return res.status(400).json({
      success: false,
      message: 'Hostel does not exist!',
    });
  }

  const existingEvent = await Event.findOne({ _id: eventId, hostel_id: hostel._id });

  if (!existingEvent) {
    return res.status(404).json({
      success: false,
      message: 'Event not found or unauthorized!',
    });
  }

  const updateData = {
    name: event.name,
    description: event.description,
    hostel_location: event.hostel_location,
    address: {
      street: parsedAddress?.street,
      city: parsedAddress?.city,
      zip: parsedAddress?.zip,
    },
    startDate: event.startDate,
    endDate: event.endDate,
    // Only update photos if new ones were provided
    ...(imagePaths.length > 0 && { photos_last_event: imagePaths }),
    unlimited_spots: event.unlimited_spots,
    spots_available: event.spots_available,
    free_entry: event.free_entry,
    price: event.price,
    payment_to_hostel: event.payment_to_hostel,
    receive_payment_online: event.receive_payment_online,
    event_recurring: event.event_recurring,
    event_frequency: event.event_frequency,
    payment_methods: event.payment_methods,
  };

  const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedEvent) {
    return res.status(404).json({
      success: false,
      message: 'Event not found!',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: updatedEvent,
  });
};

export const deleteEvent = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response<BackendResponse<null>>
): Promise<Response<BackendResponse<null>>> => {
  const user = req.user;
  const eventId = req.params.id;

  const hostel = await Hostel.findOne({
    user_id_owners: user._id,
  });

  if (!hostel) {
    return res.status(400).json({
      success: false,
      message: 'Hostel does not exist!',
    });
  }

  const deletedEvent = await Event.findOneAndDelete({
    _id: eventId,
    hostel_id: hostel._id,
  });

  if (!deletedEvent) {
    return res.status(404).json({
      success: false,
      message: 'Event not found or unauthorized!',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Event deleted successfully',
    data: null,
  });
};

export const getPublicEvents = async (
  req: AuthenticatedRequest & { query: { city?: string; country?: string } },
  res: Response<BackendResponse<IEventDocument[]>>
): Promise<Response<BackendResponse<IEventDocument[]>>> => {
  try {
    const { city, country } = req.query;

    if (!city || !country) {
      return res.status(400).json({
        success: false,
        message: 'City and country parameters are required',
      });
    }

    const hostelsInLocation = await Hostel.find({
      'address.city': { $regex: new RegExp(city, 'i') },
      'address.country': { $regex: new RegExp(country, 'i') },
    }).select('_id');

    const hostelIds = hostelsInLocation.map(hostel => hostel._id);

    const query: any = {
      open_to_public: true,
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

    const events: IEventDocument[] = await Event.find(query)
      .populate('hostel_id', 'name address')
      .populate('attendees', 'name email profileImage');

    const formattedEvents = events.map(event => ({
      ...event.toObject(),
      price: formatPrice(event.price),
    }));

    return res.status(200).json({
      message: 'Public events retrieved successfully',
      success: true,
      data: formattedEvents,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

export const getCurrentStayEvents = async (
  req: AuthenticatedRequest,
  res: Response<BackendResponse<IEventDocument[]>>
): Promise<Response<BackendResponse<IEventDocument[]>>> => {
  try {
    const userId = req.user._id;

    // Find guest's current active reservation
    const activeReservation = await Reservation.findOne({
      user_id_guest: userId,
      checkin_date: { $lte: new Date() },
      checkout_date: { $gte: new Date() }
    }).populate('hostel_id');

    if (!activeReservation) {
      return res.status(404).json({
        success: false,
        message: 'No active stay found',
      });
    }

    const events: IEventDocument[] = await Event.find({ 
      hostel_id: activeReservation.hostel_id,
      // Only show current and future events
      endDate: { $gte: new Date() }
    })
    .sort({ startDate: 1 })
    .populate('attendees', 'name email profileImage');

    const formattedEvents = events.map(event => ({
      ...event.toObject(),
      price: formatPrice(event.price),
    }));

    return res.status(200).json({
      message: 'Current stay events retrieved successfully',
      success: true,
      data: formattedEvents,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

export const joinEvent = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response<BackendResponse<IEventDocument>>
): Promise<Response<BackendResponse<IEventDocument>>> => {
  try {
    const userId = req.user._id;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is already attending
    if (event.attendees && event.attendees.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already attending this event',
      });
    }

    // Check if event has unlimited spots or if there are available spots
    if (!event.unlimited_spots && event.spots_available && event.attendees) {
      if (event.attendees.length >= event.spots_available) {
        return res.status(400).json({
          success: false,
          message: 'Event is full',
        });
      }
    }

    // Add user to attendees
    if (!event.attendees) {
      event.attendees = [];
    }
    event.attendees.push(userId);
    
    await event.save();

    const updatedEvent = await Event.findById(eventId).populate('attendees', 'name email');

    if (!updatedEvent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve updated event',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully joined event',
      data: updatedEvent,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

export const leaveEvent = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response<BackendResponse<IEventDocument>>
): Promise<Response<BackendResponse<IEventDocument>>> => {
  try {
    const userId = req.user._id;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user is attending
    if (!event.attendees || !event.attendees.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not attending this event',
      });
    }

    // Remove user from attendees
    event.attendees = event.attendees.filter(attendeeId => !attendeeId.equals(userId));
    
    await event.save();

    const updatedEvent = await Event.findById(eventId).populate('attendees', 'name email');

    if (!updatedEvent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve updated event',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully left event',
      data: updatedEvent,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
