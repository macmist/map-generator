import { Event } from "../definitions/Event";
import { Site } from "../definitions/Site";

export function compareEvents(a: Event, b: Event): number {
  // Compare by y first, then by x
  if (a.y !== b.y) {
    return b.y - a.y;
  }
  return a.x - b.x; // left comes first
}

export function findIntersection(
  p: Site,
  r: Site,
  y: number,
  x?: number
): number {
  // Calculate the x-coordinate of the intersection of the two sites at a given y
  if (p.y === r.y) {
    return (p.x + r.x) / 2; // If they are at the same height, return the midpoint
  }

  if (p.y === y) return p.x; // If the point is at the height of the site, return its x-coordinate
  if (r.y === y) return r.x; // If the point is at the

  // Edge cases for when y is exactly at the height of one of the sites

  const dp = 2 * (p.y - y);
  const dr = 2 * (r.y - y);

  const a = 1 / dp - 1 / dr;
  const b = -2 * (p.x / dp - r.x / dr);
  const c =
    (p.x ** 2 + p.y ** 2 - y ** 2) / dp - (r.x ** 2 + r.y ** 2 - y ** 2) / dr;

  if (Math.abs(a) < 1e-10) {
    console.log("Linear case, no intersection found");
    return -c / b;
  }

  // Solve the quadratic equation ax^2 + bx + c = 0
  const delta = b ** 2 - 4 * a * c;

  if (delta < 0) {
    // Parabolas don’t intersect — return middle point
    console.log("No intersection found, returning midpoint");
    return (p.x + r.x) / 2;
  }

  const s = Math.sqrt(delta);
  const x1 = (-b + s) / (2 * a);
  const x2 = (-b - s) / (2 * a);
  // Return the x-coordinate of the intersection point
  const res = p.y < r.y ? Math.max(x1, x2) : Math.min(x1, x2);
  if (y === 480) {
    console.log(
      `Intersection at y=${y} between (${p.x}, ${p.y}) and (${r.x}, ${r.y}) is at x1=${x1}, x2=${x2}, returning ${res}`
    );
  }
  return res;
}

export enum Orientation {
  COLLINEAR = 0,
  CLOCKWISE = 1,
  COUNTERCLOCKWISE = 2,
}

export const calculateAngle = (p: Site, center: Site): number => {
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  const angle = Math.atan2(dy, dx); // Angle in radians
  return angle < 0 ? angle + 2 * Math.PI : angle; // Normalize
};

export const orientation = (p: Site, q: Site, r: Site): Orientation => {
  const val = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  if (val === 0) return Orientation.COLLINEAR; // collinear
  return val > 0 ? Orientation.COUNTERCLOCKWISE : Orientation.CLOCKWISE; // clock or counterclock wise
};

export const getCircumcircle = (
  a: Site,
  b: Site,
  c: Site
): { x: number; y: number; r: number } | null => {
  const A = b.x - a.x;
  const B = b.y - a.y;
  const C = c.x - a.x;
  const D = c.y - a.y;

  const E = A * (a.x + b.x) + B * (a.y + b.y);
  const F = C * (a.x + c.x) + D * (a.y + c.y);
  const G = 2 * (A * (c.y - b.y) - B * (c.x - b.x));

  if (G === 0) return null; // Points are collinear

  const cx = (D * E - B * F) / G;
  const cy = (A * F - C * E) / G;
  const r = Math.hypot(a.x - cx, a.y - cy);

  return { x: cx, y: cy, r };
};
