export interface User {
  role: string;
  name: string;
  email: string;
  isNewUser: string;
}

export interface UserState {
  data: User | null;
  loading: boolean;
  error: string | null;
}
