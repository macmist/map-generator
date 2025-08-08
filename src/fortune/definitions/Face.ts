import { Edge } from "./Edge";
import { Site } from "./Site";
import { Vertex } from "./Vertex";

export class Face {
  public incidentEdges: Edge[] = [];
  public neighbors: Set<Face> = new Set(); // Store neighboring faces
  public corners: Set<Vertex> = new Set(); // Store vertices that are corners of this face
  constructor(public site: Site) {}
}
