import Reservation from '../models/reservation.model';
import type IReservation from '../interfaces/reservation.ts';
import type { IReservationDocument } from '../interfaces/reservation.ts';

export class ReservationRepository {
  create(data: IReservation): Promise<any> {
    return Reservation.create(data);
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
}
