import mongoose, { Schema, Model } from 'mongoose';
import { IUserDocument } from '../interfaces/auth.interface.ts';

export type IUserModel = Model<IUserDocument>;

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['host', 'guest'],
      required: true,
    },
    sessionToken: {
      type: String,
      default: null,
    },
    isNewUser: {
      type: Boolean,
      default: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumPlan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: null,
    },
    subscriptionActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User: IUserModel = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);

export default User;
