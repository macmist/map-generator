import { Event } from "../definitions/Event";
import { Site } from "../definitions/Site";

export function compareEvents(a: Event, b: Event): number {
  // Compare by y first, then by x
  if (a.y !== b.y) {
    return b.y - a.y;
  }
  return a.x - b.x; // left comes first
}

export function findIntersection(p: Site, r: Site, y: number): number {
  // Calculate the x-coordinate of the intersection of the two sites at a given y
  if (p.y === r.y) {
    return (p.x + r.x) / 2; // If they are at the same height, return the midpoint
  }

  // Edge cases for when y is exactly at the height of one of the sites
  if (p.y === y) return p.x;
  if (r.y === y) return r.x;

  const dp = 2 * (p.y - y);
  const dr = 2 * (r.y - y);

  const a = 1 / dp - 1 / dr;
  const b = -2 * (p.x / dp - r.x / dr);
  const c =
    (p.x ** 2 + p.y ** 2 - y ** 2) / dp - (r.x ** 2 + r.y ** 2 - y ** 2) / dr;

  // Solve the quadratic equation ax^2 + bx + c = 0
  const delta = b ** 2 - 4 * a * c;

  if (delta < 0) {
    // Parabolas don’t intersect — return middle point
    return (p.x + r.x) / 2;
  }

  const s = Math.sqrt(delta);
  const x1 = (-b + s) / (2 * a);
  const x2 = (-b - s) / (2 * a);

  // Return the x-coordinate of the intersection point
  return p.y < r.y ? Math.max(x1, x2) : Math.min(x1, x2);
}
