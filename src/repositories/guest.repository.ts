import { Types } from 'mongoose';

import { IGuestDocument, IGuest } from '../interfaces/guest.interface';
import Guest from '../models/guest.model';
import User from '../models/user.model';
import Reservation from '../models/reservation.model';

export class GuestRepository {
  async findById(guestId: Types.ObjectId): Promise<IGuestDocument | null> {
    return await Guest.findById(guestId).exec();
  }

  async findByUserId(userId: string | Types.ObjectId): Promise<IGuestDocument | null> {
    return await Guest.findOne({ user: userId }).exec();
  }

  async create(guestData: Partial<IGuest>): Promise<IGuestDocument> {
    const guest = new Guest(guestData);
    return await guest.save();
  }

  async update(guestId: string, updateData: Partial<IGuest>): Promise<IGuestDocument | null> {
    return await Guest.findByIdAndUpdate(guestId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async removeReservation(guestId: string | Types.ObjectId, reservationId: string): Promise<void> {
    await Guest.updateOne({ user: guestId }, { $pull: { reservations: reservationId } });
  }

  async searchByUsernameOrEmail(searchTerm: string, hostelId: string): Promise<any[]> {
    // Find users by email (case-insensitive)
    const usersWithEmailMatch = await User.find({
      email: { $regex: searchTerm, $options: 'i' },
      role: 'guest',
    });

    // Find guests by username
    const guestsWithUsernameMatch = await Guest.find({
      username: { $regex: searchTerm, $options: 'i' },
    }).populate('user');

    const guests = [];

    // Process users matched by email
    for (const user of usersWithEmailMatch) {
      const guest = await Guest.findOne({ user: user._id });

      if (guest) {
        // Check if guest is currently staying at the hostel
        const currentReservation = await Reservation.findOne({
          user_id_guest: user._id,
          hostel_id: hostelId,
          status: 'in house',
        });

        guests.push({
          user_id_guest: user._id,
          name: guest.name,
          email: user.email,
          image: guest.guest_photos?.[0] || null,
          username: guest.username,
          isInHouse: !!currentReservation,
        });
      }
    }

    // Process guests matched by username
    for (const guest of guestsWithUsernameMatch) {
      if (guest.user && typeof guest.user === 'object' && 'email' in guest.user) {
        const populatedUser = guest.user as any;
        // Avoid duplicates
        if (!guests.some(g => g.user_id_guest.toString() === populatedUser._id.toString())) {
          const currentReservation = await Reservation.findOne({
            user_id_guest: populatedUser._id,
            hostel_id: hostelId,
            status: 'in house',
          });

          guests.push({
            user_id_guest: populatedUser._id,
            name: guest.name,
            email: populatedUser.email,
            image: guest.guest_photos?.[0] || null,
            username: guest.username,
            isInHouse: !!currentReservation,
          });
        }
      }
    }

    return guests;
  }
}
