import mongoose, { Document } from 'mongoose';
import { BackendResponse } from './index.ts';

export interface IGuest {
  name: string;
  username: string;
  guest_photos: string[];
  phone: string;
  birthday: Date;
  country: string;
  showProfileAuthorization: boolean;
  user: mongoose.Types.ObjectId;
  reservations: mongoose.Types.ObjectId[];
  passaportPhoto?: string;
  interests?: string[];
  description?: string;
  languages?: string[];
  digitalNomad?: boolean;
  smoker?: boolean;
  pets?: boolean;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
}

export interface IGuestDocument extends IGuest, Document {
  _id: mongoose.Types.ObjectId;
  created_at: Date;
}

export interface IGuestCurrentStay {
  reservationId: string;
  hostel: {
    _id?: string;
    name?: string;
    logo?: string;
    address?: {
      street?: string;
      city?: string;
      country?: string;
    };
    phone?: string;
    email?: string;
  };
  room: string;
  bed: string;
  checkinDate: Date;
  checkoutDate: Date;
  status: string;
  daysRemaining: number;
}

export interface IGuestCurrentStayResponse extends BackendResponse<IGuestCurrentStay> {}

export interface ICreateGuestResponse extends BackendResponse<IGuestDocument> {}

export interface IGuestListItemResponse extends BackendResponse<IGuestDocument[]> {}

export interface IGuestByIdResponse extends BackendResponse<IGuestDocument> {}
