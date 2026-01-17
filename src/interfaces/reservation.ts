import { Document, Types } from 'mongoose';

interface IReservation {
  status: 'in house' | 'checked out';
  hostel_id: Types.ObjectId;
  user_id_guest: Types.ObjectId;
  room_number: string;
  bed_number?: string;
  checkin_date: Date;
  checkout_date: Date;
}

export default IReservation;

export interface IReservationDocument extends IReservation, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
