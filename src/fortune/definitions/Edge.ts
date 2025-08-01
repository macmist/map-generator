import { Site } from "./Site";

export class Edge {
  public start: [number, number];

  public end: [number, number] | null = null;
  public direction: [number, number] | null = null;

  constructor(
    public leftSite: Site,
    public rightSite: Site,
    startX: number,
    startY: number
  ) {
    this.start = [startX, startY];

    const dx = rightSite.x - leftSite.x;
    const dy = rightSite.y - leftSite.y;
    const length = Math.hypot(dx, dy);

    // Unit perpendicular vector (rotated 90° CW)
    this.direction = [dy / length, -dx / length];
  }
}
