import mongoose, { Document } from 'mongoose';

import { IUserDocument } from './user';

export interface IGuest {
  name: string;
  username: string;
  profile: string;
  guestPhotos: string[];
  phone: string;
  birthday: Date;
  country: string;
  showProfileAuthorization: boolean;
  user: mongoose.Types.ObjectId;
  reservations: mongoose.Types.ObjectId[];
  // optional fields
  passaportPhoto?: string;
  interests?: string[];
  description?: string;
  languages?: string[];
  digitalNomad?: boolean;
  smoker?: boolean;
  pets?: boolean;
}

export interface IGuestWithUser extends Omit<IGuest, 'user'> {
  user: IUserDocument;
}

export interface GuestState {
  data: IGuest | null;
  loading: boolean;
  error: string | null;
}

export interface IGuestDocument extends IGuest, Document {
  _id: mongoose.Types.ObjectId;
  created_at: Date;
}

export interface IGuestDocumentWithUser extends IGuestWithUser, Document {
  _id: mongoose.Types.ObjectId;
  created_at: Date;
}
