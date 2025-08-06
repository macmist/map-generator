import { Edge } from "./Edge";
import { Event } from "./Event";
import { Site } from "./Site";

export class Arc {
  public prev: Arc | null = null;
  public next: Arc | null = null;
  public circleEvent: Event | null = null;
  public edge: Edge | null = null;

  constructor(public site: Site) {}

  evaluate(x: number, sweepY: number): number {
    // Calculate the y-coordinate of the arc at a given x-coordinate
    const dp = 2 * (this.site.y - sweepY);
    if (dp === 0) return Infinity;

    return (x - this.site.x) ** 2 / dp + (this.site.y + sweepY) / 2;
  }
}
