import { Event } from "../definitions/Event";
import {
  compareEvents,
  findIntersection,
  getCircumcircle,
  Orientation,
  orientation,
} from "./utils";

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

describe("Orientation", () => {
  it("should return COLLINEAR for collinear points", () => {
    const p = { x: 0, y: 0 };
    const q = { x: 1, y: 1 };
    const r = { x: 2, y: 2 };
    expect(orientation(p, q, r)).toBe(Orientation.COLLINEAR);
  });

  it("should return CLOCKWISE for clockwise orientation", () => {
    const p = { x: 0, y: 0 };
    const q = { x: 1, y: 2 };
    const r = { x: 4, y: 4 };
    expect(orientation(p, q, r)).toBe(Orientation.CLOCKWISE);
  });

  it("should return COUNTERCLOCKWISE for counterclockwise orientation", () => {
    const p = { x: 0, y: 0 };
    const q = { x: 4, y: 4 };
    const r = { x: 1, y: 2 };
    expect(orientation(p, q, r)).toBe(Orientation.COUNTERCLOCKWISE);
  });
});

describe("Get Circumcircle", () => {
  it("should return the circumcircle for three points", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 4, y: 0 };
    const c = { x: 2, y: 4 };

    const circumcircle = getCircumcircle(a, b, c);
    expect(circumcircle).toBeDefined();
    expect(circumcircle?.x).toBeCloseTo(2);
    expect(circumcircle?.y).toBeCloseTo(1.5);
    expect(circumcircle?.r).toBeCloseTo(2.5);
  });
});
