import { Face } from "./Face";
import { Vertex } from "./Vertex";

export class HalfEdge {
  public origin: Vertex | null = null;
  public twin: HalfEdge | null = null;
  public next: HalfEdge | null = null;
  public prev: HalfEdge | null = null;
  public incidentFace: Face | null = null;

  constructor() {}
}
