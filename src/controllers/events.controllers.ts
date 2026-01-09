import type { Response } from 'express';
// @ts-ignore
import Hostel from '../models/hostel.model.ts';
import Event from '../models/event.model.ts';
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
  req: AuthenticatedRequest,
  res: Response<BackendResponse<IEventDocument[]>>
): Promise<Response<BackendResponse<IEventDocument[]>>> => {
  const user = req.user;
  const hostel = await Hostel.findOne({
    user_id_owners: user._id,
  });

  if (!hostel) {
    return res.status(400).json({
      success: false,
      message: 'Hostel does not exist!',
    });
  }

  const events: IEventDocument[] = await Event.find({ hostel_id: hostel._id });

  const formattedEvents = events.map(event => ({
    ...event.toObject(),
    price: formatPrice(event.price),
  }));

  return res.status(200).json({
    message: 'Event found successfully',
    success: true,
    data: formattedEvents,
  });
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
  req: AuthenticatedRequest & { query: { latitude?: string; longitude?: string } },
  res: Response<BackendResponse<IEventDocument[]>>
): Promise<Response<BackendResponse<IEventDocument[]>>> => {
  try {
    const { latitude, longitude } = req.query;
    let city = '';
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error('Geocoding service failed');
      }

      const data = (await response.json()) as {
        address?: { city?: string; town?: string; village?: string; municipality?: string };
      };

      city =
        (data.address?.city as string) ||
        (data.address?.town as string) ||
        (data.address?.village as string) ||
        (data.address?.municipality as string);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error with geocoding service',
      });
    }

    const query: any = {
      $or: [
        {
          open_to_public: true,
          'address.city': { $regex: new RegExp(city, 'i') },
        },
      ],
    };
    const events: IEventDocument[] = await Event.find(query);

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
