import { Point } from "../playground/PlayGround";
import { Arc } from "./definitions/Arc";
import { Edge } from "./definitions/Edge";
import { Event } from "./definitions/Event";
import { Face } from "./definitions/Face";
import { Site } from "./definitions/Site";
import { Vertex } from "./definitions/Vertex";
import {
  findIntersection,
  getCircumcircle,
  Orientation,
  orientation,
} from "./maths/utils";
import { BeachLine } from "./structures/BeachLine";
import { EventQueue } from "./structures/EventQueue";

export type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export class FortuneProcessor {
  private beachLine: BeachLine;
  private sweepY: number = 0;
  private eventQueue: EventQueue = new EventQueue();
  public edges: Edge[] = [];
  public vertices: Vertex[] = [];
  public faces: Map<Site, Face> = new Map(); // Store faces by their site ID

  constructor() {
    this.beachLine = new BeachLine();
    this.eventQueue = new EventQueue();
  }

  public reset(): void {
    this.eventQueue = new EventQueue();
    this.beachLine = new BeachLine();
    this.sweepY = 0;
    this.edges = [];
    this.vertices = [];
    this.faces.clear(); // Clear the faces map
  }

  addSite(site: Site): void {
    const event = new Event(site.x, site.y, site);
    const face = new Face(site);
    this.faces.set(site, face); // Store the face for this site
    this.eventQueue.insert(event);
  }

  public onPointOrAfterCircle(y: number): boolean {
    // Check if the sweep line is on a point
    let event = this.eventQueue.peek();
    if (!event) return false;
    if (event.circle) {
      return event.y >= y && event.valid;
    }
    return event.y >= y;
  }

  getEdges(sweepY: number): Edge[] {
    return this.beachLine.getEdges(sweepY).concat(this.edges);
  }

  public next() {
    const event = this.eventQueue.pop();
    this.sweepY = event?.y || 0;
    if (!event) {
      return;
    }
    // this.beachLine.display();

    if (event.site) {
      this.handleSiteEvent(event.site);
      // Handle site event logic here
    }
    if (event.arc) {
      // Handle circle event logic here
      this.handleCircleEvent(event);
    }
  }

  public getPoints(maxX: number, sweepY: number): Point[] {
    return this.beachLine.getPoints(maxX, sweepY);
  }

  computeFortune(): void {
    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.pop();
      if (!event) {
        continue;
      }
      this.sweepY = event.y;

      if (event.site) {
        this.handleSiteEvent(event.site);
      } else {
        this.handleCircleEvent(event);
      }
    }
  }

  handleSiteEvent(site: Site): void {
    const head = this.beachLine.head();
    if (!head) {
      this.beachLine.setHead(new Arc(site));
      return;
    }
    const arcAbove = this.beachLine.findArcAboveX(site.x, this.sweepY);
    if (!arcAbove) {
      return;
    }

    if (arcAbove.circleEvent) {
      // Remove the circle event if it exists
      arcAbove.circleEvent.valid = false;
      arcAbove.circleEvent = null;
    }

    this.splitArc(arcAbove, site);
  }

  linkFaces(): void {
    // Link faces based on edges
    this.faces.forEach((face) => {
      face.incidentEdges.forEach((edge) => {
        if (edge.leftSite && edge.rightSite) {
          const leftFace = this.faces.get(edge.leftSite);
          const rightFace = this.faces.get(edge.rightSite);
          if (leftFace) {
            if (leftFace.site !== face.site) {
              leftFace.neighbors.add(face);
              face.neighbors.add(leftFace);
            }
          }
          if (rightFace) {
            if (rightFace.site !== face.site) {
              rightFace.neighbors.add(face);
              face.neighbors.add(rightFace);
            }
          }
        }
      });
    });
  }

  splitArc(arcAbove: Arc, site: Site): void {
    const leftArc = new Arc(arcAbove.site);
    const middleArc = new Arc(site);
    const rightArc = new Arc(arcAbove.site);

    leftArc.prev = arcAbove.prev;
    leftArc.next = middleArc;

    middleArc.prev = leftArc;
    middleArc.next = rightArc;

    rightArc.prev = middleArc;
    rightArc.next = arcAbove.next;

    if (leftArc.prev) leftArc.prev.next = leftArc;
    if (rightArc.next) rightArc.next.prev = rightArc;

    if (arcAbove === this.beachLine.head()) {
      this.beachLine.setHead(leftArc);
    }
    const y = arcAbove.evaluate(site.x, this.sweepY);

    const vertex = [site.x, y];
    const siteFace = this.faces.get(site);
    const arcAboveFace = this.faces.get(arcAbove.site);
    const edgeLeft = new Edge(arcAbove.site, site, vertex[0], vertex[1]);
    const edgeRight = new Edge(site, arcAbove.site, vertex[0], vertex[1]);
    if (arcAbove.leftEdge) {
      leftArc.leftEdge = arcAbove.leftEdge;
    }
    if (arcAbove.rightEdge) {
      rightArc.rightEdge = arcAbove.rightEdge;
    }
    this.edges.push(edgeLeft, edgeRight);
    siteFace?.incidentEdges.push(edgeLeft, edgeRight);
    arcAboveFace?.incidentEdges.push(edgeLeft, edgeRight);

    leftArc.rightEdge = edgeLeft;
    rightArc.leftEdge = edgeRight;

    this.checkCircleEvents(leftArc);
    this.checkCircleEvents(rightArc);
  }

  checkCircleEvents(arc: Arc): void {
    if (!arc.prev || !arc.next) {
      return; // Cannot form a circle event without both neighbors
    }
    const leftSite = arc.prev.site;
    const rightSite = arc.next.site;

    const circle = getCircumcircle(leftSite, arc.site, rightSite);
    if (!circle) {
      return;
    }

    if (orientation(leftSite, arc.site, rightSite) !== Orientation.CLOCKWISE) {
      return; // Not a valid event
    }

    const eventY = circle.y - circle.r;

    if (eventY > this.sweepY) {
      // Create a circle event only if it is above the sweep line
      return; // Circle event is below the sweep line
    }

    const event = new Event(circle.x, eventY, null, arc);
    event.circle = new Site(circle.x, circle.y); // Store the circle center
    arc.circleEvent = event;
    this.eventQueue.insert(event);
  }

  handleCircleEvent(event: Event): void {
    const arc = event.arc;
    if (!arc || !event.valid || !event.circle) {
      return;
    }

    const vertex = new Vertex(event.circle?.x, event.circle?.y);
    if (event.arc && event.arc.leftEdge) {
      event.arc.leftEdge.endVertex = vertex;
      event.arc.leftEdge.end = [vertex.x, vertex.y];
      vertex.incidentEdges.push(event.arc.leftEdge);
      const leftFace = this.faces.get(event.arc.leftEdge.leftSite);
      leftFace?.corners.add(vertex);
      const rightFace = this.faces.get(event.arc.leftEdge.rightSite);
      rightFace?.corners.add(vertex);
    }
    if (event.arc && event.arc.rightEdge) {
      event.arc.rightEdge.endVertex = vertex;
      event.arc.rightEdge.end = [vertex.x, vertex.y];
      vertex.incidentEdges.push(event.arc.rightEdge);
      const leftFace = this.faces.get(event.arc.rightEdge.leftSite);
      leftFace?.corners.add(vertex);
      const rightFace = this.faces.get(event.arc.rightEdge.rightSite);
      rightFace?.corners.add(vertex);
    }
    this.vertices.push(vertex);

    const prevArc = arc.prev;
    const nextArc = arc.next;
    if (prevArc) {
      prevArc.next = nextArc;
    }
    if (nextArc) {
      nextArc.prev = prevArc;
    }
    this.beachLine.rebalance();

    // Invalidate the old circle events
    if (prevArc?.circleEvent) {
      prevArc.circleEvent.valid = false;
      prevArc.circleEvent = null;
    }
    if (nextArc?.circleEvent) {
      nextArc.circleEvent.valid = false;
      nextArc.circleEvent = null;
    }

    if (prevArc?.rightEdge) {
      prevArc.rightEdge.end = [vertex.x, vertex.y];
      prevArc.rightEdge.endVertex = vertex;
      vertex.incidentEdges.push(prevArc.rightEdge);
    }
    if (nextArc?.leftEdge) {
      nextArc.leftEdge.end = [vertex.x, vertex.y];
      nextArc.leftEdge.endVertex = vertex;
      vertex.incidentEdges.push(nextArc.leftEdge);
    }
    if (prevArc && nextArc) {
      const rightEdge = new Edge(
        prevArc.site,
        nextArc.site,
        vertex.x,
        vertex.y
      );
      const leftEdge = new Edge(prevArc.site, nextArc.site, vertex.x, vertex.y);
      this.edges.push(rightEdge, leftEdge);
      rightEdge.vertex = vertex;
      leftEdge.vertex = vertex;
      vertex.incidentEdges.push(rightEdge, leftEdge);
      // Attach this new edge to both neighbors for future circle events
      prevArc.rightEdge = rightEdge;
      nextArc.leftEdge = leftEdge;
      const siteFace = this.faces.get(prevArc.site);
      const nextArcFace = this.faces.get(nextArc.site);
      siteFace?.incidentEdges.push(rightEdge, leftEdge);
      siteFace?.corners.add(vertex);
      nextArcFace?.incidentEdges.push(leftEdge, rightEdge);
      nextArcFace?.corners.add(vertex);
    }

    if (prevArc) {
      this.checkCircleEvents(prevArc);
    }
    if (nextArc) {
      this.checkCircleEvents(nextArc);
    }
  }

  randomizeColors(): void {
    this.faces.forEach((face) => {
      face.color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    });
  }

  addCornersToFaces(bbox: BoundingBox): void {
    const corners = [
      new Vertex(bbox.minX, bbox.minY), // bottom-left (0, 0)
      new Vertex(bbox.minX, bbox.maxY), // top-left (0, 700)
      new Vertex(bbox.maxX, bbox.minY), // bottom-right (700, 0)
      new Vertex(bbox.maxX, bbox.maxY), // top-right (700, 700)
    ];
    for (const corner of corners) {
      let closestFace: Face | null = null;
      let minDist = Infinity;

      this.faces.forEach((face: Face) => {
        const dx = corner.x - face.site.x;
        const dy = corner.y - face.site.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDist) {
          minDist = distSq;
          closestFace = face as Face;
        }
      });

      if (closestFace !== null) {
        (closestFace as Face).corners.add(corner);
      }
    }
  }

  bindToBox(box: BoundingBox): void {
    this.addCornersToFaces(box);
    for (const edge of this.edges) {
      const clipped = this.clipToBox(edge, box);
      if (clipped) {
        edge.start = clipped[0];
        edge.end = clipped[1];
        const leftFace = this.faces.get(edge.leftSite);
        const rightFace = this.faces.get(edge.rightSite);
        if (leftFace) {
          leftFace.corners.add(new Vertex(edge.start[0], edge.start[1]));
          leftFace.corners.add(new Vertex(edge.end[0], edge.end[1]));
        }
        if (rightFace) {
          rightFace.corners.add(new Vertex(edge.end[0], edge.end[1]));
          rightFace.corners.add(new Vertex(edge.start[0], edge.start[1]));
        }
      }
    }
  }

  clipToBox(
    edge: Edge,
    box: BoundingBox
  ): [[number, number], [number, number]] | null {
    const { minX, minY, maxX, maxY } = box;

    let p1: [number, number] | undefined = edge.start;
    let p2: [number, number] | null = edge.end;

    // If we only have a start and direction (ray), extend far to create a virtual segment
    if (p1 && !p2 && edge.direction) {
      const [dx, dy] = edge.direction;
      p2 = [p1[0] + dx * 1e6, p1[1] + dy * 1e6]; // huge extension
    }

    // If we only have an end and direction (reverse ray), extend backwards
    if (!p1 && p2 && edge.direction) {
      const [dx, dy] = edge.direction;
      p1 = [p2[0] - dx * 1e6, p2[1] - dy * 1e6];
    }

    // If still missing one point, we can't clip
    if (!p1 || !p2) return null;

    // Liang–Barsky algorithm for segment-box clipping
    let [x0, y0] = p1;
    let [x1, y1] = p2;

    let t0 = 0;
    let t1 = 1;
    const dx = x1 - x0;
    const dy = y1 - y0;

    const clipTest = (p: number, q: number) => {
      if (p === 0) {
        if (q < 0) return false; // parallel and outside
      } else {
        const r = q / p;
        if (p < 0) {
          if (r > t1) return false;
          if (r > t0) t0 = r;
        } else if (p > 0) {
          if (r < t0) return false;
          if (r < t1) t1 = r;
        }
      }
      return true;
    };

    if (
      clipTest(-dx, x0 - minX) &&
      clipTest(dx, maxX - x0) &&
      clipTest(-dy, y0 - minY) &&
      clipTest(dy, maxY - y0)
    ) {
      if (t1 < 1) {
        x1 = x0 + t1 * dx;
        y1 = y0 + t1 * dy;
      }
      if (t0 > 0) {
        x0 = x0 + t0 * dx;
        y0 = y0 + t0 * dy;
      }
      return [
        [x0, y0],
        [x1, y1],
      ];
    }

    return null; // No intersection with box
  }

  relaxFaces(): void {
    this.faces.forEach((face) => face.relax());
  }

  getFaceSites(): Site[] {
    const sites: Site[] = [];
    this.faces.forEach((face) => {
      if (face.site) {
        sites.push(face.site);
      }
    });
    return sites;
  }
}
