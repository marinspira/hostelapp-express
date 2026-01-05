import { Types } from 'mongoose';

export interface IUser {
  role: string;
  name: string;
  email: string;
  isNewUser: string;
}

export interface IUserDocument {
  _id?: Types.ObjectId;
  role: string;
  name: string;
  email: string;
  isNewUser: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserState {
  data: IUser | null;
  loading: boolean;
  error: string | null;
}
