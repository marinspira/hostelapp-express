import { Document, Types } from 'mongoose';
import { BackendResponse } from './index.ts';

interface IReservation {
  status: 'walking in' | 'in house' | 'checked out';
  hostel_id: Types.ObjectId;
  user_id_guest: Types.ObjectId;
  room: string;
  bed: string;
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

export interface ICreateReservationRequest {
  body: {
    reservation: IReservation | string;
  };
  user: {
    _id: string;
  };
}

export interface ICreateReservationResponse extends BackendResponse<IReservationDocument> {}

export interface IReservationListItemResponse extends BackendResponse<IReservationDocument[]> {}

export interface IReservationByIdResponse extends BackendResponse<IReservationDocument> {}
