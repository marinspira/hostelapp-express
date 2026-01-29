import { Document, Types } from 'mongoose';

interface IReservation {
  status: 'walking in' | 'in house' | 'checked out';
  hostel_id: Types.ObjectId;
  user_id_guest: Types.ObjectId;
  room: string;
  bed?: string;
  checkin_date: Date;
  checkout_date: Date;
  created_at?: Date;
  checkout_processed_at?: Date;
}

export default IReservation;

export interface IReservationDocument extends IReservation, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
