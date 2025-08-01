import { Event } from "../definitions/Event";
import { compareEvents, findIntersection } from "./utils";

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

describe("Find Intersection", () => {
  it("should find intersection for two sites at different heights", () => {
    const site1 = { x: 1, y: 2 };
    const site2 = { x: 3, y: 4 };
    const y = 3;

    expect(findIntersection(site1, site2, y)).toBeCloseTo(2); // Linear interpolation
  });

  it("should return midpoint for two sites at the same height", () => {
    const site1 = { x: 1, y: 2 };
    const site2 = { x: 3, y: 2 };
    const y = 2;

    expect(findIntersection(site1, site2, y)).toBe(2); // Midpoint
  });

  it("should handle vertical alignment", () => {
    const site1 = { x: 5, y: 0 };
    const site2 = { x: 5, y: 10 };
    const y = 5;
    expect(findIntersection(site1, site2, y)).toBe(5); // Same x value
  });
});
