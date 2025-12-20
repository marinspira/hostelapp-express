export type Room = {
  name: string;
  capacity: string;
  type: string;
  organization_by: string;
};

export type RoomResponse = {
  id: string;
  name: string;
  capacity: number;
  type: string;
  organization_by: string;
  created_at: string;
};
