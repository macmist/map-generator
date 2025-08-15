import { Edge } from "./Edge";
import { Site } from "./Site";
import { Vertex } from "./Vertex";

export class Face {
  public incidentEdges: Edge[] = [];
  public neighbors: Set<Face> = new Set(); // Store neighboring faces
  public corners: Set<Vertex> = new Set(); // Store vertices that are corners of this face
  public color: string | null = null; // Optional color for visualization
  public height: number = 0; // Optional height for visualization
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

  relax(): void {
    if (this.corners.size === 0) return;
    const sumX = Array.from(this.corners).reduce((sum, v) => sum + v.x, 0);
    const sumY = Array.from(this.corners).reduce((sum, v) => sum + v.y, 0);
    const count = this.corners.size;
    this.site.x = sumX / count;
    this.site.y = sumY / count;
  }
}
