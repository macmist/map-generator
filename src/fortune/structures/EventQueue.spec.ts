import { Event } from "../definitions/Event";
import { compareEvents } from "../maths/utils";
import { EventQueue } from "./EventQueue";

describe("EventQueue", () => {
  it("should initialize with empty queue", () => {
    const queue = new EventQueue();
    expect(queue.isEmpty()).toBe(true);
  });
  it("should insert and sort events correctly", () => {
    const queue = new EventQueue();
    const event1 = new Event(1, 2);
    const event2 = new Event(3, 4);
    const event3 = new Event(2, 3);

    queue.insert(event1);
    queue.insert(event2);
    queue.insert(event3);

    expect(queue.peek()).toEqual(event2); // Should be the highest y value
    expect(queue.isEmpty()).toBe(false);
  });
  it("should pop events in correct order", () => {
    const queue = new EventQueue();
    const event1 = new Event(1, 2);
    const event2 = new Event(3, 4);
    const event3 = new Event(2, 3);

    queue.insert(event1);
    queue.insert(event2);
    queue.insert(event3);

    expect(queue.pop()).toEqual(event2); // Should pop the highest y value
    expect(queue.peek()).toEqual(event3); // Next should be the second highest
    expect(queue.length()).toBe(2); // Should have 2 events left
  });
  it("should peek at the next event without removing it", () => {
    const queue = new EventQueue();
    const event1 = new Event(1, 2);
    const event2 = new Event(3, 4);
    const event3 = new Event(2, 3);

    queue.insert(event1);
    queue.insert(event2);
    queue.insert(event3);

    expect(queue.peek()).toEqual(event2); // Should be the highest y value
    expect(queue.isEmpty()).toBe(false);
    expect(queue.length()).toBe(3); // Should still have 3 events
  });

  it("should handle empty queue correctly", () => {
    const queue = new EventQueue();
    expect(queue.pop()).toBeUndefined(); // Should return undefined when empty
    expect(queue.peek()).toBeUndefined(); // Should return undefined when empty
    expect(queue.isEmpty()).toBe(true); // Should be empty
  });

  it("should correctly insert when elements are randomly ordered", () => {
    const queue = new EventQueue();
    const events = [
      new Event(5, 1),
      new Event(2, 3),
      new Event(3, 5),
      new Event(4, 2),
      new Event(1, 4),
    ];

    events.forEach((event) => queue.insert(event));

    expect(queue.length()).toBe(events.length);
    expect(queue.peek()).toEqual(new Event(3, 5)); // Highest y value
  });

  it("should return smallest x first if 2 events have the same y", () => {
    const e1 = new Event(100, 200); // left
    const e2 = new Event(150, 200); // right
    const queue = new EventQueue([e2, e1]);
    expect(queue.pop()).toBe(e1);
  });

  test("Stress test: random event ordering", () => {
    const eventCount = 1000;
    const events: Event[] = [];

    // Generate random events
    for (let i = 0; i < eventCount; i++) {
      const x = Math.random() * 1000;
      const y = Math.random() * 1000;
      events.push(new Event(x, y));
    }

    // Copy and sort the expected order (ground truth)
    const expected = [...events].sort(compareEvents);

    // Initialize the queue
    const queue = new EventQueue(events);

    // Pop events from the queue and compare to expected
    for (let i = 0; i < eventCount; i++) {
      const popped = queue.pop();
      expect(popped).toEqual(expected[i]);
    }

    expect(queue.isEmpty()).toBe(true);
  });
});
