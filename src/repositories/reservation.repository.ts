import { Types } from 'mongoose';

import Reservation from '../models/reservation.model';
import type { IReservation, IReservationDocument } from '../interfaces/reservation.interface.ts';

export class ReservationRepository {
  async create(data: IReservation): Promise<IReservationDocument> {
    const reservation = await Reservation.create(data);
    return reservation as IReservationDocument;
  }

  findAll(): Promise<IReservationDocument[]> {
    return Reservation.find();
  }

  findById(id: string): Promise<IReservationDocument | null> {
    return Reservation.findById(id);
  }

  update(id: string, data: Partial<IReservation>): Promise<IReservationDocument | null> {
    return Reservation.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  delete(id: string): Promise<IReservationDocument | null> {
    return Reservation.findByIdAndDelete(id);
  }

  findCurrentStayByGuestId(guestId: Types.ObjectId): Promise<IReservationDocument | null> {
    return Reservation.findOne({
      user_id_guest: guestId,
      checkin_date: { $lte: new Date() },
      checkout_date: { $gte: new Date() },
      status: { $in: ['in house', 'walking in'] },
    });
  }

  findStayByGuestIdAndDate(
    guestId: Types.ObjectId,
    checkinDate: Date,
    checkoutDate: Date
  ): Promise<IReservationDocument | null> {
    return Reservation.findOne({
      user_id_guest: guestId,
      checkin_date: { $lte: checkinDate },
      checkout_date: { $gte: checkoutDate },
    });
  }

  async findByGuestId(guestId: string): Promise<IReservationDocument[]> {
    const reservations = await Reservation.find({
      user_id_guest: guestId,
    }).sort({ created_at: -1 });
    return reservations as IReservationDocument[];
  }

  async findByHostelId(hostelId: string): Promise<IReservationDocument[]> {
    const reservations = await Reservation.find({
      hostel_id: hostelId,
    }).sort({ checkin_date: -1 });
    return reservations as IReservationDocument[];
  }

  async findCurrentGuestsByHostelId(hostelId: Types.ObjectId): Promise<IReservationDocument[]> {
    const reservations = await Reservation.find({
      hostel_id: hostelId,
      status: { $in: ['in house', 'walking in'] },
    })
      .populate({
        path: 'user_id_guest',
        select: 'email',
      })
      .sort({ checkin_date: -1 });
    return reservations as IReservationDocument[];
  }

  async findByRoomAndBedWithDateOverlap(
    hostelId: Types.ObjectId,
    room: string,
    bed: string,
    checkinDate: Date,
    checkoutDate: Date
  ): Promise<IReservationDocument | null> {
    return Reservation.findOne({
      hostel_id: hostelId,
      room: room,
      bed: bed,
      status: { $in: ['walking in', 'in house'] }, // Only active reservations
      $or: [
        // New reservation starts during existing reservation
        {
          checkin_date: { $lte: checkinDate },
          checkout_date: { $gt: checkinDate },
        },
        // New reservation ends during existing reservation
        {
          checkin_date: { $lt: checkoutDate },
          checkout_date: { $gte: checkoutDate },
        },
        // New reservation completely overlaps existing reservation
        {
          checkin_date: { $gte: checkinDate },
          checkout_date: { $lte: checkoutDate },
        },
      ],
    });
  }
}
