import { Event } from "../definitions/Event";

export function compareEvents(a: Event, b: Event): number {
  // Compare by y first, then by x
  if (a.y !== b.y) {
    return b.y - a.y;
  }
  return a.x - b.x; // left comes first
}
