import { Types, Document } from 'mongoose';

export interface IUser {
  role: string;
  name: string;
  email: string;
  isNewUser: boolean;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserState {
  data: IUser | null;
  loading: boolean;
  error: string | null;
}
