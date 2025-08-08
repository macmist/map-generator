import { Site } from "./Site";
import { Vertex } from "./Vertex";

export class Edge {
  public start: [number, number];

  public end: [number, number] | null = null;
  public direction: [number, number];
  public vertex: Vertex | null = null;
  public endVertex: Vertex | null = null;

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

  copy(): Edge {
    const edge = new Edge(
      this.leftSite,
      this.rightSite,
      this.start[0],
      this.start[1]
    );
    edge.end = this.end ? [...this.end] : null;
    edge.direction = [...this.direction];
    edge.vertex = this.vertex
      ? new Vertex(this.vertex.x, this.vertex.y, [...this.vertex.incidentEdges])
      : null;
    return edge;
  }
}
