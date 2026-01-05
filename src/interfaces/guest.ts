export interface Guest {
  guestPhotos: string[];
  phone: string;
  birthday: Date;
  country: string;
  showProfileAuthorization: boolean;
  // optional fields
  passaportPhoto?: string;
  interests?: string[];
  description?: string;
  languages?: string[];
  digitalNomad?: boolean;
  smoker?: boolean;
  pets?: boolean;
}

export interface GuestState {
  data: Guest | null;
  loading: boolean;
  error: string | null;
}
