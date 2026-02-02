import mongoose, { Model, Schema } from 'mongoose';
import { IReservationDocument } from '../interfaces/reservation.interface';

export type IReservationModel = Model<IReservationDocument>;

const ReservationSchema = new Schema<IReservationDocument>({
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
      validate: {
        validator: function (value: Date): boolean {
          // @ts-ignore
          return value > this.checkin_date;
        },
        message: 'Checkout date must be after checkin date',
      },
    },
    room: {
      type: String,
      required: true,
    },
    bed: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    checkout_processed_at: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

const Reservation = mongoose.model<IReservationDocument>('Reservation', ReservationSchema);

export default Reservation;
