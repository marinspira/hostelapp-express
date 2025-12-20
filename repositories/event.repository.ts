import Event, { IEventDocument } from "../models/event.model";

export class EventRepository {
  async create(event: Partial<IEventDocument>): Promise<IEventDocument> {
    const newEvent = new Event(event);
    return newEvent.save();
  }
}