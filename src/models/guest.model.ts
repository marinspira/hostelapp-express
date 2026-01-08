import mongoose, { Schema, Model } from 'mongoose';
import type { IGuestDocument } from '../interfaces/guest';

export type IGuestModel = Model<IGuestDocument>;

const GuestSchema = new Schema<IGuestDocument>({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  profile: {
    type: String,
    required: true,
  },
  guestPhotos: {
    type: [String],
  },
  phone: {
    type: String,
  },
  birthday: {
    type: Date,
  },
  country: {
    type: String,
  },
  passaportPhoto: {
    type: Buffer,
  },
  interests: {
    type: [String],
  },
  description: {
    type: String,
  },
  languages: {
    type: [String],
  },
  digitalNomad: {
    type: Boolean,
  },
  smoker: {
    type: Boolean,
  },
  pets: {
    type: Boolean,
  },
  showProfileAuthorization: {
    type: Boolean,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reservations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null,
    },
  ],
  created_at: {
    type: Date,
    default: Date.now,
  },
});
const Guest: IGuestModel = mongoose.model<IGuestDocument, IGuestModel>('Guest', GuestSchema);

export default Guest;
