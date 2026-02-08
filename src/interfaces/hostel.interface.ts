import { Document, Types } from 'mongoose';

import { BackendResponse } from './index.interface';

export type HostelStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface IHostel {
  status?: HostelStatus;
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

export interface IGuestListItem {
  user_id: string;
  name: string;
  email: string;
  first_photo: string;
  room: string;
  bed: string;
  checkin_date: string;
  checkout_date: string;
  reservation_id: string;
}

export interface IHostelDocument extends IHostel, Document {
  _id: Types.ObjectId;
}

export interface ICreateHostelResponse extends BackendResponse<IHostelDocument> {}

export interface IHostelListItemResponse extends BackendResponse<IHostelDocument[]> {}

export interface IHostelByIdResponse extends BackendResponse<IHostelDocument> {}

export interface IGuestListResponse extends BackendResponse<IGuestListItem[]> {}
