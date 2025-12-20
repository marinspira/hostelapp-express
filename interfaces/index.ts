import { Document, Types } from 'mongoose';
import { Request } from 'express';
import { IUserDocument } from './user';

export interface IUser {
  _id?: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  profileImage?: string;
  isHost: boolean;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGuest {
  _id?: Types.ObjectId;
  user: Types.ObjectId | IUser;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  nationality: string;
  phoneNumber?: string;
  emergencyContact?: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
  currentHostel?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHostel {
  _id?: Types.ObjectId;
  host: Types.ObjectId | IUser;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  amenities: string[];
  images: string[];
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
    rules: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoom {
  _id?: Types.ObjectId;
  hostel: Types.ObjectId | IHostel;
  name: string;
  type: 'private' | 'shared' | 'dorm';
  capacity: number;
  price: number;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReservation {
  _id?: Types.ObjectId;
  guest: Types.ObjectId | IGuest;
  room: Types.ObjectId | IRoom;
  hostel: Types.ObjectId | IHostel;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id?: Types.ObjectId;
  sender: Types.ObjectId | IUser;
  content: string;
  timestamp: Date;
  messageType: 'text' | 'image' | 'system';
}

export interface IChat {
  _id?: Types.ObjectId;
  type: 'private' | 'group';
  participants: Array<Types.ObjectId | IUser>;
  messages: IMessage[];
  lastMessage?: IMessage;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEvent {
  _id?: Types.ObjectId;
  hostel: Types.ObjectId | IHostel;
  title: string;
  description: string;
  date: Date;
  location?: string;
  maxParticipants?: number;
  participants: Array<Types.ObjectId | IGuest>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Express Request with user
export interface AuthenticatedRequest extends Request {
  user: IUserDocument;
}

// Mongoose Document types
export type IUserDoc = IUser & Document;
export type IGuestDoc = IGuest & Document;
export type IHostelDoc = IHostel & Document;
export type IRoomDoc = IRoom & Document;
export type IReservationDoc = IReservation & Document;
export type IChatDoc = IChat & Document;
export type IEventDoc = IEvent & Document;
