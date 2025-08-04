import { HalfEdge } from "./HalfEdge";

export class Vertex {
  public incidentEdge: HalfEdge | null = null;

  constructor(public x: number, public y: number) {}
}
