import { Types, Document } from 'mongoose';

export interface IUser {
  role: string;
  name: string;
  email: string;
  isNewUser: boolean;
  isPremium?: boolean;
  premiumPlan?: 'basic' | 'premium' | 'enterprise';
  subscriptionActive?: boolean;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  sessionToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}
