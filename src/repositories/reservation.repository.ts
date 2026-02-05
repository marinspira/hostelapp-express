import Reservation from '../models/reservation.model';
import type IReservation from '../interfaces/reservation.interface.ts';
import type { IReservationDocument } from '../interfaces/reservation.interface.ts';
import { Types } from 'mongoose';

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

  findActiveByGuestId(guestId: string): Promise<IReservationDocument | null> {
    return Reservation.findOne({
      user_id_guest: guestId,
      status: 'in house',
    });
  }

  findCurrentStayByGuestId(guestId: string): Promise<IReservationDocument | null> {
    return Reservation.findOne({
      user_id_guest: guestId,
      checkin_date: { $lte: new Date() },
      checkout_date: { $gte: new Date() },
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
    }).sort({ created_at: -1 });
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
}
