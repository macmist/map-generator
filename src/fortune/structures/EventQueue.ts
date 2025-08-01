import { Event } from "../definitions/Event";
import { compareEvents } from "../maths/utils";

export class EventQueue {
  private events: Event[] = [];

  constructor(initialEvents: Event[] = []) {
    // Initialize and sort the events
    this.events = initialEvents.slice();
    this.sortQueue();
  }

  // Using a simple array sort for now, but could be optimized later
  private sortQueue() {
    this.events.sort((a, b) => {
      return compareEvents(a, b);
    });
  }

  insert(event: Event): void {
    this.events.push(event);
    this.sortQueue(); // Re-sort after insertion
  }

  pop(): Event | undefined {
    const event = this.events.shift();
    return event;
  }

  peek(): Event | undefined {
    const element = this.events[0];
    return element ? { ...element } : undefined; // Return a copy to avoid mutation
  }

  isEmpty(): boolean {
    return this.events.length === 0;
  }

  length(): number {
    return this.events.length;
  }

  // Optional: Use a binary search to improve insertion time
}
