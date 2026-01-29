import mongoose, { Document, Types } from 'mongoose';

export interface IEvent {
  name: string;
  description: string;
  open_to_public: boolean;
  hostel_location: boolean;
  address?: {
    street?: string;
    city?: string;
    country?: string;
    zip?: string;
  };
  start_date: Date;
  end_date: Date;
  photos_last_event: string[];
  unlimited_spots: boolean;
  spots_available?: number;
  free_entry: boolean;
  price?: number;
  currency?: string;
  payment_to_hostel: boolean;
  receive_payment_online?: boolean;
  event_recurring: boolean;
  event_frequency?: Array<
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | number
  >;
  attendees?: Types.ObjectId[];
  payment_methods: Array<'card' | 'cash'>;
  hostel_id?: Types.ObjectId;
  suggested_by?: Types.ObjectId;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface IEventDocument extends IEvent, Document {
  _id: mongoose.Types.ObjectId;
  created_at: Date;
}

export interface IEventListItemDTO {
  id: string;
  name: string;
  start_date: Date;
  photos_last_event: string[];
  attendees?: IEventAttendee[];
  free_entry: boolean;
  price?: number;
  currency?: string;
}

export interface IEventAttendee {
  id: Types.ObjectId | string;
  profileImage?: string;
}
