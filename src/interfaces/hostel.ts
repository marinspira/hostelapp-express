import { Document, Types } from 'mongoose';

import { IUser } from './user';
import { Room } from './room';

import { IEvent } from '.';

interface _Bed {
  bed: string;
  reservation_id: string | null;
}

export type HostelStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface IHostel {
  status?: HostelStatus;
  stripeAccountId?: string;
  logo?: string;
  name: string;
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
  rooms?: Room[];
  owners?: IUser[];
  user_id_guests?: IUser[];
  user_id_staffs?: IUser[];
  events?: IEvent[];
  // volunteer_opportunities?: Position[];
  created_at?: Date;
  policies: boolean;
}

export interface IHostelDocument extends IHostel, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
