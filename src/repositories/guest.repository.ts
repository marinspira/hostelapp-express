import { Types } from "mongoose";
import { IGuestDocument } from "../interfaces/guest";
import Guest from "../models/guest.model";

export class GuestRepository {
    async findById(guestId: Types.ObjectId): Promise<IGuestDocument | null> {
        return await Guest.findById(guestId).exec();
    }
}