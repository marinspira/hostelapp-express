import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['in house', 'checked out'],
      default: 'in house',
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
    room_number: {
      type: String,
      required: true,
    },
    bed_number: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

const Reservation = mongoose.model('Reservation', ReservationSchema);

export default Reservation;
