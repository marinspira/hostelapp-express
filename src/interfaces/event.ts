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
  startDate: Date;
  endDate: Date;
  photos_last_event: string[];
  unlimited_spots: boolean;
  spots_available?: number;
  free_entry: boolean;
  price?: number;
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
