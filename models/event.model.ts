import mongoose, { Document, Schema, Model } from 'mongoose';

import { IEvent } from '../interfaces/event';

export interface IEventDocument extends IEvent, Document {
  _id: mongoose.Types.ObjectId;
  created_at: Date;
}

export type IEventModel = Model<IEventDocument>;

const EventSchema = new Schema<IEventDocument>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  hostel_location: {
    type: Boolean,
    required: true,
  },
  address: {
    street: {
      type: String,
    },
    city: {
      type: String,
    },
    zip: {
      type: String,
    },
  },
  date: {
    type: Date,
    required: true,
  },
  photos_last_event: {
    type: [String],
  },
  unlimited_spots: {
    type: Boolean,
    required: true,
  },
  spots_available: {
    type: Number,
  },
  free_entry: {
    type: Boolean,
    required: true,
  },
  price: {
    type: Number,
  },
  payment_to_hostel: {
    type: Boolean,
    required: true,
  },
  receive_payment_online: {
    type: Boolean,
  },
  event_recurring: {
    type: Boolean,
    required: true,
  },
  event_frequency: {
    type: mongoose.Schema.Types.Mixed,
  },
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  payment_methods: {
    type: [String],
  },
  hostel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  suggested_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Event: IEventModel = mongoose.model<IEventDocument, IEventModel>('Event', EventSchema);

export default Event;
