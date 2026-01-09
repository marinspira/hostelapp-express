import mongoose, { Schema, Model } from 'mongoose';

import type { IEventDocument } from '../interfaces/event';

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
  open_to_public: {
    type: Boolean,
    required: true,
  },
  hostel_location: {
    type: Boolean,
    required: true,
  },
  address: {
    type: Object,
    required: function () {
      return this.hostel_location === false;
    },
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
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
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
    required: function () {
      return this.unlimited_spots === false;
    },
    type: Number,
  },
  free_entry: {
    type: Boolean,
    required: true,
  },
  price: {
    required: function () {
      return this.free_entry === false;
    },
    type: Number,
  },
  payment_to_hostel: {
    required: function () {
      return this.free_entry === false;
    },
    type: Boolean,
  },
  receive_payment_online: {
    type: Boolean,
  },
  event_recurring: {
    type: Boolean,
    required: true,
  },
  event_frequency: {
    required: function () {
      return this.event_recurring === true;
    },
    type: [String],
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', Number],
  },
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  payment_methods: {
    type: [String],
    enum: ['card', 'cash'],
    required: true,
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
