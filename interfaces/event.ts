import { Types } from 'mongoose';

export interface IEvent {
  name: string;
  description: string;
  hostel_location: boolean;
  address?: {
    street?: string;
    city?: string;
    zip?: string;
  };
  date: Date;
  photos_last_event: string[];
  unlimited_spots: boolean;
  spots_available?: number;
  free_entry: boolean;
  price?: number;
  payment_to_hostel: boolean;
  receive_payment_online?: boolean;
  event_recurring: boolean;
  event_frequency?: Record<string, string>;
  attendees?: Types.ObjectId[];
  payment_methods: string[];
  hostel_id?: Types.ObjectId;
  suggested_by?: Types.ObjectId;
  status?: 'pending' | 'approved' | 'rejected';
}
