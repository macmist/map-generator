import { Edge } from "./Edge";
import { Site } from "./Site";
import { Vertex } from "./Vertex";

export class Face {
  public incidentEdges: Edge[] = [];
  public neighbors: Set<Face> = new Set(); // Store neighboring faces
  public corners: Set<Vertex> = new Set(); // Store vertices that are corners of this face
  public color: string | null = null; // Optional color for visualization
  constructor(public site: Site) {}

  sortCorners(): Vertex[] {
    const center = this.site;
    return Array.from(this.corners).sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x);
      const angleB = Math.atan2(b.y - center.y, b.x - center.x);
      return angleA - angleB;
    });
  }

  asPolygon(): [number, number][] {
    return this.sortCorners().map((v) => [v.x, v.y] as [number, number]);
  }
}
