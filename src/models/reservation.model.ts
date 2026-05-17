import mongoose, { Model, Schema } from 'mongoose';

import { IReservationDocument } from '../interfaces/reservation.interface';

export type IReservationModel = Model<IReservationDocument>;

const ReservationSchema = new Schema<IReservationDocument>(
  {
    status: {
      type: String,
      enum: ['walking in', 'in house', 'checked out'],
      default: 'walking in',
      required: true,
    },
    hostel_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true,
    },
    user_id_guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    checkin_date: {
      type: Date,
      required: true,
    },
    checkout_date: {
      type: Date,
      required: true,
    },
    room: {
      type: String,
      required: true,
    },
    bed: {
      type: String,
      required: true,
    },
    checkout_processed_at: {
      type: Date,
      required: false,
    },
    is_staff: {
      type: Boolean,
      default: false,
    },
    staff_role: {
      type: String,
      enum: [
        'cleaning',
        'reception',
        'maintenance',
        'event',
        'breakfast',
        null,
      ],
      default: null,
    },
  },
  { timestamps: true }
);

const Reservation = mongoose.model<IReservationDocument>('Reservation', ReservationSchema);

export default Reservation;
