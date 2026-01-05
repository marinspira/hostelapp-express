/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       required:
 *         - user_id_guest
 *         - checkin_date
 *         - checkout_date
 *         - room_number
 *         - bed_number
 *       properties:
 *         _id:
 *           type: string
 *           format: uuid
 *           example: "64adf0eb02b5e726c21e5149"
 *         status:
 *           type: string
 *           enum: [walking in, in house, checked out]
 *           default: walking in
 *           description: Current status of the reservation
 *           example: "in house"
 *         hostel_id:
 *           type: string
 *           format: uuid
 *           description: Reference to the associated hostel
 *           example: "64acde56b75ef438c7a8d1a2"
 *         user_id_guest:
 *           type: string
 *           format: uuid
 *           description: Reference to the guest user
 *           example: "63f2ce91d7af11d12c0cbe88"
 *         checkin_date:
 *           type: string
 *           format: date-time
 *           description: The guest's check-in date
 *           example: "2025-07-07T14:00:00.000Z"
 *         checkout_date:
 *           type: string
 *           format: date-time
 *           description: The guest's check-out date (must be after check-in)
 *           example: "2025-07-10T11:00:00.000Z"
 *         room_number:
 *           type: string
 *           description: Room identifier (number or name)
 *           example: "201"
 *         bed_number:
 *           type: string
 *           description: Bed identifier (e.g., "A", "1", "B2")
 *           example: "A"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date when the reservation was created
 *           example: "2025-07-01T08:30:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the document was created (by Mongoose)
 *           example: "2025-07-01T08:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the document was last updated
 *           example: "2025-07-01T08:35:12.000Z"
 */
import mongoose from 'mongoose';

import { addGuestToHostelGroup } from '../services/chat/groupChatManager.js';

import Guest from './guest.model.js';

const ReservationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['walking in', 'in house', 'checked out'],
      default: 'walking in',
    },
    hostel_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
    },
    user_id_guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    checkin_date: {
      type: Date,
    },
    checkout_date: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
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
    },
  },
  { timestamps: true }
);

// After a reservation is saved, ensure its id is present in the Guest.reservations array
ReservationSchema.post('save', async function (doc) {
  try {
    if (!doc.user_id_guest) return;

    await Guest.updateOne({ user: doc.user_id_guest }, { $addToSet: { reservations: doc._id } });
  } catch (err) {
    console.error('Error adding reservation to Guest.reservations:', err);
  }

  try {
    if (!doc.hostel_id || !doc.user_id_guest) return;
    await addGuestToHostelGroup(doc.hostel_id, doc.user_id_guest);
  } catch (err) {
    console.error('Error adding guest to hostel group chat:', err);
  }
});

// When a reservation is removed, pull it from the Guest.reservations array
ReservationSchema.post('remove', async function (doc) {
  try {
    if (!doc.user_id_guest) return;

    await Guest.updateOne({ user: doc.user_id_guest }, { $pull: { reservations: doc._id } });
  } catch (err) {
    console.error('Error removing reservation from Guest.reservations:', err);
  }
});

const Reservation = mongoose.model('Reservation', ReservationSchema);

export default Reservation;
