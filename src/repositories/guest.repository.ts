import { Types } from "mongoose";
import { IGuestDocument } from "../interfaces/guest";
import Guest from "../models/guest.model";

export class GuestRepository {
    async findById(guestId: Types.ObjectId): Promise<IGuestDocument | null> {
        return await Guest.findById(guestId).exec();
    }

    async findByUserId(userId: string | Types.ObjectId): Promise<IGuestDocument | null> {
        return await Guest.findOne({ user: userId }).exec();
    }

    async removeReservation(guestId: string | Types.ObjectId, reservationId: string, session?: any): Promise<void> {
        await Guest.updateOne(
            { user: guestId },
            { $pull: { reservations: reservationId } },
            { session }
        );
    }
}