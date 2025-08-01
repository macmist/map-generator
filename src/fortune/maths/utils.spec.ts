import { Event } from "../definitions/Event";
import { compareEvents } from "./utils";

describe("Compare Events", () => {
  it("should correctly compare by y", () => {
    const event1 = new Event(1, 2);
    const event2 = new Event(3, 4);
    expect(compareEvents(event1, event2)).toBe(2); // event1.y < event2.y
  });

  it("should correctly compare by y when point 1 is higher than point 2", () => {
    const event1 = new Event(3, 4);
    const event2 = new Event(1, 2);
    expect(compareEvents(event1, event2)).toBe(-2); // event1.y > event2.y
  });
  it("should correctly compare by x when y values are equal", () => {
    const event1 = new Event(1, 2);
    const event2 = new Event(2, 2);
    expect(compareEvents(event1, event2)).toBe(-1); // event1.x < event2.x
  });
  it("should correctly compare by x when point 1 is greater than point 2", () => {
    const event1 = new Event(2, 2);
    const event2 = new Event(1, 2);
    expect(compareEvents(event1, event2)).toBe(1);
  });
  it("should return 0 when both events are equal", () => {
    const event1 = new Event(1, 2);
    const event2 = new Event(1, 2);
    expect(compareEvents(event1, event2)).toBe(0); // event1 === event2
  });
});
