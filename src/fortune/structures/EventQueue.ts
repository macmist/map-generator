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
    while (this.events.length > 0) {
      const e = this.events.shift();
      if (e && e.valid) return e;
    }
    return undefined;
  }

  peek(): Event | undefined {
    const element = this.events[0];
    return element;
  }

  isEmpty(): boolean {
    return this.events.length === 0;
  }

  length(): number {
    return this.events.length;
  }

  // Optional: Use a binary search to improve insertion time
}
