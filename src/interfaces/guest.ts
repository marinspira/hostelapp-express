import mongoose, { Document } from 'mongoose';

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
  passaportPhoto?: string;
  interests?: string[];
  description?: string;
  languages?: string[];
  digitalNomad?: boolean;
  smoker?: boolean;
  pets?: boolean;
}

export interface IGuestDocument extends IGuest, Document {
  _id: mongoose.Types.ObjectId;
  created_at: Date;
}
