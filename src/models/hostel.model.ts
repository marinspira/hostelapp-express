import mongoose, { Model, Schema } from 'mongoose';

import { IHostelDocument } from '../interfaces/hostel.interface';

export type IHostelModel = Model<IHostelDocument>;

const HostelSchema = new Schema<IHostelDocument>(
  {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    logo: {
      type: String,
    },
    username: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      zip: {
        type: String,
      },
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    website: {
      type: String,
    },
    experience_with_volunteers: {
      type: Boolean,
    },
    currency: {
      type: String,
      required: false,
    },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    user_id_owners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    user_id_guests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    user_id_staffs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
    ],
    volunteer_opportunities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VolunteerPosition' }],
  },
  { timestamps: true }
);

const Hostel = mongoose.model<IHostelDocument>('Hostel', HostelSchema);

export default Hostel;
