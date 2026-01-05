import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { EventRepository } from '../../repositories/event.repository';
import { HostelRepository } from '../../repositories/hostel.repository';
// @ts-ignore
import Hostel from '../../models/hostel.model';
import Event from '../../models/event.model';

import { EventService } from './event.service';

let mongoServer: MongoMemoryServer;
let service: EventService;
let hostel: mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  name: string;
  address: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  email: string;
  user_id_owners: string[];
  username: string;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  service = new EventService(new EventRepository(), new HostelRepository());
});

const userId = new mongoose.Types.ObjectId().toHexString();

beforeEach(async () => {
  const newHostel = await Hostel.create({
    name: 'Test Hostel',
    address: {
      street: 'Test St',
      city: 'Test City',
      zip: '1234',
      country: 'Test Country',
    },
    email: 'test@hostel.com',
    user_id_owners: [userId],
    username: 'testhostel',
  });
  hostel = newHostel;
});

afterEach(async () => {
  await Event.deleteMany({});
  await Hostel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('EventService createEvent', () => {
  it('creates an event with only required fields when hostel exists', async () => {
    const event = await service.createEvent(
      userId,
      {
        name: 'Party',
        description: 'Fun party',
        hostel_location: true,
        unlimited_spots: true,
        free_entry: true,
        event_recurring: false,
        startDate: new Date(),
        endDate: new Date(),
      } as any,
      ['img1.jpg']
    );

    expect(event.name).toBe('Party');
    expect(event.hostel_id?.toString()).toBe(hostel._id.toString());
  });

  it('creates an event with address when hostel_location is false', async () => {
    const event = await service.createEvent(
      userId,
      {
        name: 'Concert',
        description: 'Live concert',
        hostel_location: false,
        address: { street: 'Main', city: 'Lisbon', zip: '1000' },
        unlimited_spots: false,
        spots_available: 50,
        free_entry: true,
        startDate: new Date(),
        endDate: new Date(),
        event_recurring: false,
      } as any,
      []
    );

    expect(event.address).toEqual({
      street: 'Main',
      city: 'Lisbon',
      zip: '1000',
    });
  });

  it('parses address if provided as string', async () => {
    const event = await service.createEvent(
      userId,
      {
        name: 'Workshop',
        description: 'Coding workshop',
        hostel_location: false,
        street: 'Code St',
        city: 'Tech City',
        zip: '2000',
        unlimited_spots: false,
        spots_available: 30,
        free_entry: false,
        price: 15,
        payment_to_hostel: true,
        receive_payment_online: false,
        startDate: new Date(),
        endDate: new Date(),
        event_recurring: false,
      } as any,
      []
    );

    expect(event.address).toEqual({
      street: 'Code St',
      city: 'Tech City',
      zip: '2000',
    });
  });

  it('should require payment details if free_entry is false', async () => {
    await expect(
      service.createEvent(
        userId,
        {
          name: 'Concert',
          description: 'Live concert',
          hostel_location: false,
          address: { street: 'Main', city: 'Lisbon', zip: '1000', country: 'Portugal' },
          unlimited_spots: false,
          spots_available: 50,
          free_entry: false,
          date: new Date(),
          event_recurring: false,
        } as any,
        []
      )
    ).rejects.toThrow('Payment details are required');
  });

  it('throws error if hostel does not exist', async () => {
    await expect(
      service.createEvent(
        new mongoose.Types.ObjectId().toHexString(),
        { name: 'Fail', address: {} } as any,
        []
      )
    ).rejects.toThrow('Hostel does not exist');
  });
});
