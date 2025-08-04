import { HalfEdge } from "./HalfEdge";
import { Site } from "./Site";

export class Face {
  constructor(public site: Site) {}

  // Reference to one of the half-edges that bounds the face
  public outerComponent: HalfEdge | null = null;
}
