import Event from "../models/event.model.ts";
import type { IEventDocument } from "../models/event.model.ts";

export class EventRepository {
  async create(event: Partial<IEventDocument>): Promise<IEventDocument> {
    const newEvent = new Event(event);
    return newEvent.save();
  }
}