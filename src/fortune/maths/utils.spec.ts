import { Event } from "../definitions/Event";
import { Site } from "../definitions/Site";
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
    const site1 = new Site(1, 2);
    const site2 = new Site(3, 4);
    const y = 3;

    expect(findIntersection(site1, site2, y)).toBeCloseTo(2); // Linear interpolation
  });

  it("should return midpoint for two sites at the same height", () => {
    const site1 = new Site(1, 2);
    const site2 = new Site(3, 2);
    const y = 2;

    expect(findIntersection(site1, site2, y)).toBe(2); // Midpoint
  });

  it("should handle vertical alignment", () => {
    const site1 = new Site(5, 0);
    const site2 = new Site(5, 10);
    const y = 5;
    expect(findIntersection(site1, site2, y)).toBe(5); // Same x value
  });
});

describe("Orientation", () => {
  it("should return COLLINEAR for collinear points", () => {
    const p = new Site(0, 0);
    const q = new Site(1, 1);
    const r = new Site(2, 2);
    expect(orientation(p, q, r)).toBe(Orientation.COLLINEAR);
  });

  it("should return CLOCKWISE for clockwise orientation", () => {
    const p = new Site(0, 0);
    const q = new Site(1, 2);
    const r = new Site(4, 4);
    expect(orientation(p, q, r)).toBe(Orientation.CLOCKWISE);
  });

  it("should return COUNTERCLOCKWISE for counterclockwise orientation", () => {
    const p = new Site(0, 0);
    const q = new Site(4, 4);
    const r = new Site(1, 2);
    expect(orientation(p, q, r)).toBe(Orientation.COUNTERCLOCKWISE);
  });
});

describe("Get Circumcircle", () => {
  it("should return the circumcircle for three points", () => {
    const a = new Site(0, 0);
    const b = new Site(4, 0);
    const c = new Site(2, 4);

    const circumcircle = getCircumcircle(a, b, c);
    expect(circumcircle).toBeDefined();
    expect(circumcircle?.x).toBeCloseTo(2);
    expect(circumcircle?.y).toBeCloseTo(1.5);
    expect(circumcircle?.r).toBeCloseTo(2.5);
  });
});
