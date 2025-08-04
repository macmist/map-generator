import { Face } from "./Face";
import { HalfEdge } from "./HalfEdge";
import { Site } from "./Site";
import { Vertex } from "./Vertex";

export class DCEL {
  public vertices: Vertex[] = [];
  public halfEdges: HalfEdge[] = [];
  public faces: Face[] = [];

  createVertex(x: number, y: number): Vertex {
    const v = new Vertex(x, y);
    this.vertices.push(v);
    return v;
  }

  createHalfEdgePair(): [HalfEdge, HalfEdge] {
    const e1 = new HalfEdge();
    const e2 = new HalfEdge();
    e1.twin = e2;
    e2.twin = e1;
    this.halfEdges.push(e1, e2);
    return [e1, e2];
  }

  createFace(site: Site): Face {
    const f = new Face(site);
    this.faces.push(f);
    return f;
  }
}
