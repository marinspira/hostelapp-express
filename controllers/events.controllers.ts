import { Response } from 'express';

// @ts-ignore
import Hostel from '../models/hostel.model.js';
import Event, { IEventDocument } from '../models/event.model.js';
// @ts-ignore
import { getRelativeFilePath } from '../middleware/saveUploads.js';
import { AuthenticatedRequest } from '../types/index.js';
import { IEvent } from '../interfaces/event';
import { BackendResponse } from '../interfaces/response';

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

  console.log('Raw req.body:', req.body);
  console.log('Event:', event);
  console.log('Event address:', event.address);
  console.log('Event address type:', typeof event.address);

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

  console.log('Parsed address:', parsedAddress);

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

  const event: IEventDocument[] = await Event.find({ hostel_id: hostel._id });

  return res.status(200).json({
    message: 'Event found successfully',
    success: true,
    data: event,
  });
};
