import { Edge } from "./Edge";

export class Vertex {
  constructor(
    public x: number,
    public y: number,
    public incidentEdges: Edge[] = []
  ) {}
}
