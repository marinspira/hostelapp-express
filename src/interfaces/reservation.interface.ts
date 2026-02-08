import { Document, Types } from 'mongoose';

import { BackendResponse } from './index.interface';

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

export interface ReservationForHost {
  reservationId: string;
  status: 'walking in' | 'in house' | 'checked out';
  hostel_id: string;
  guest: {
    _id: string;
    username: string;
    email: string;
    phone: string;
    photo: string;
  };
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

export interface ICurrentStayReservation {
  reservationId: string;
  hostel: {
    id: string;
    name: string;
    logo: string;
    address: {
      street: string;
      city: string;
      country: string;
      zip: string;
    };
    phone: string;
    email: string;
  };
  room: string;
  bed: string;
  checkinDate: Date;
  checkoutDate: Date;
  status: string;
  daysRemaining: number;
}

export interface IOthersGuestsListResponse extends BackendResponse<IOtherGuest[]> {}

export interface ICreateReservationResponse extends BackendResponse<IReservationDocument> {}

export interface IReservationsForHostResponse extends BackendResponse<ReservationForHost[]> {}

export interface IReservationListItemResponse extends BackendResponse<IReservationDocument[]> {}

export interface IReservationByIdResponse extends BackendResponse<IReservationDocument | null> {}

export interface ICurrentStayResponse extends BackendResponse<ICurrentStayReservation | null> {}
