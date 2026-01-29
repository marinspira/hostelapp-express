import { Document, Types } from 'mongoose';

export type HostelStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface IHostel {
  status?: HostelStatus;
  stripeAccountId?: string;
  logo?: string;
  name: string;
  username: string;
  address: {
    street: string;
    city: string;
    country: string;
    zip?: string;
  };
  phone?: string;
  email: string;
  website?: string;
  experience_with_volunteers?: boolean;
  currency: string;
  rooms?: Types.ObjectId[];
  user_id_owners?: Types.ObjectId[];
  user_id_guests?: Types.ObjectId[];
  user_id_staffs?: Types.ObjectId[];
  events?: Types.ObjectId[];
  volunteer_opportunities?: Types.ObjectId[];
  policies: boolean;
}

export interface IHostelDocument extends IHostel, Document {
  _id: Types.ObjectId;
  created_at: Date;
}
