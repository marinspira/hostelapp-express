import { Response } from 'express';

// @ts-ignore
import Hostel from '../models/hostel.model.js';
import Event, { IEventDocument } from '../models/event.model.js';
// @ts-ignore
import { getRelativeFilePath } from '../middleware/saveUploads.js';
import { AuthenticatedRequest } from '../types/index.js';
import { IEvent } from '../interfaces/event';
import { BackendResponse } from '../interfaces/response';
import { formatPrice } from '../utils/formatPrice.js';

interface UploadedFile {
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
    event: IEvent;
  };
  files: {
    map: (_callback: (_file: UploadedFile) => string) => string[];
  };
}

export const createEvent = async (
  req: CreateEventRequest,
  res: Response<BackendResponse<IEventDocument>>
): Promise<Response<BackendResponse<IEventDocument>>> => {
  const user = req.user;
  const hostel = await Hostel.findOne({
    user_id_owners: user._id,
  });

  const event: IEvent = req.body.event;

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

  const newEvent: IEventDocument = new Event({
    name: event.name,
    description: event.description,
    hostel_location: event.hostel_location,
    address: {
      street: parsedAddress?.street,
      city: parsedAddress?.city,
      zip: parsedAddress?.zip,
    },
    date: event.date,
    endDate: event.endDate,
    photos_last_event: imagePaths,
    unlimited_spots: event.unlimited_spots,
    spots_available: event.spots_available,
    free_entry: event.free_entry,
    price: event.price,
    payment_to_hostel: event.payment_to_hostel,
    receive_payment_online: event.receive_payment_online,
    event_recurring: event.event_recurring,
    event_frequency: event.event_frequency,
    payment_methods: event.payment_methods,
    hostel_id: hostel._id,
    status: hostel ? 'approved' : 'pending',
  });

  console.log('New Event:', newEvent);
  await newEvent.save();

  return res.status(201).json({
    success: true,
    message: 'Event created successfully',
    data: newEvent,
  });
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
    price: formatPrice(event.price)
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

  const event: IEvent = req.body.event;

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
    date: event.date,
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
