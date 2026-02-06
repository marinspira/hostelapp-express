import { Document, Types } from 'mongoose';

import { BackendResponse } from './index.interface.ts';

export interface IReservation {
  status: 'walking in' | 'in house' | 'checked out';
  hostel_id: Types.ObjectId;
  user_id_guest: Types.ObjectId;
  room: string;
  bed: string;
  checkin_date: Date;
  checkout_date: Date;
  checkout_processed_at?: Date;
}

export interface IReservationCreateRequest {
  user_id_guest: string;
  room: string;
  bed: string;
  checkin_date: Date;
  checkout_date: Date;
}

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

export interface IOtherGuest {
  guestId: Types.ObjectId;
  name: string;
  photo: string;
}

export interface IOthersGuestsListResponse extends BackendResponse<IOtherGuest[]> {}

export interface ICreateReservationResponse extends BackendResponse<IReservationDocument> {}

export interface IReservationListItemResponse extends BackendResponse<IReservationDocument[]> {}

export interface IReservationByIdResponse extends BackendResponse<IReservationDocument | null> {}
