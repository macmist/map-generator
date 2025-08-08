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
    console.log(`Processing event at (${event.x}, ${event.y})`);
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
    console.log("Starting Fortune's algorithm...");
    while (!this.eventQueue.isEmpty()) {
      const event = this.eventQueue.pop();
      if (!event) {
        console.error("No event to process");
        continue;
      }
      this.sweepY = event.y;
      console.log(`Sweep line at y = ${this.sweepY}`);

      if (event.site) {
        console.log(`Processing site event at (${event.x}, ${event.y})`);
        this.handleSiteEvent(event.site);
      } else {
        console.log(`Processing circle event at (${event.x}, ${event.y})`);
        this.handleCircleEvent(event);
      }
    }
    console.log("Fortune's algorithm completed.");
  }

  handleSiteEvent(site: Site): void {
    const head = this.beachLine.head();
    if (!head) {
      console.log("No arcs in the beach line, creating new head arc");
      this.beachLine.setHead(new Arc(site));
      return;
    }
    const arcAbove = this.beachLine.findArcAboveX(site.x, this.sweepY);
    if (!arcAbove) {
      console.error("No arc found above the site, not sure this should happen");
      return;
    }
    console.log(
      "arcAbove:",
      arcAbove.site.x,
      arcAbove.site.y,
      arcAbove.prev,
      arcAbove.next
    );
    if (arcAbove.circleEvent) {
      // Remove the circle event if it exists
      console.log("Removing circle event for arc above site");
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
      console.log(leftSite, arc.site, rightSite);
      console.log(orientation(leftSite, arc.site, rightSite));
      console.error(
        "Sites are not in counter-clockwise order, cannot form circle event"
      );
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
    console.log("inserting circle event at", event.x, event.y);
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
        console.log(
          `Adding corner (${corner.x}, ${corner.y}) to face at (${
            (closestFace as Face).site.x
          }, ${(closestFace as Face).site.y})`
        );
        (closestFace as Face).corners.add(corner);
      }
    }
  }

  bindToBox(box: BoundingBox): void {
    this.addCornersToFaces(box);
    this.bindStart(box);
    for (const edge of this.edges) {
      if (!edge.end) {
        const clipped = this.clipEdgeToBox(edge, box);
        if (clipped) {
          edge.end = clipped;
          edge.endVertex = new Vertex(clipped[0], clipped[1]);
          let face = this.faces.get(edge.leftSite);
          if (face) {
            face.corners.add(edge.endVertex);
          }
          let rightFace = this.faces.get(edge.rightSite);
          if (rightFace) {
            rightFace.corners.add(edge.endVertex);
          }
        } else {
          // Optionally: remove the edge if it doesn’t intersect the box
          console.warn("Edge did not intersect bounding box", edge);
        }
      }
    }
  }

  clipEdgeToBox(edge: Edge, box: BoundingBox): [number, number] | null {
    const [x0, y0] = edge.start;
    const [dx, dy] = edge.direction;

    const candidates: [number, number][] = [];

    // Intersect with left (x = minX)
    if (dx !== 0) {
      const t = (box.minX - x0) / dx;
      const y = y0 + t * dy;
      if (y >= box.minY && y <= box.maxY && t > 0) {
        candidates.push([box.minX, y]);
      }
    }

    // Intersect with right (x = maxX)
    if (dx !== 0) {
      const t = (box.maxX - x0) / dx;
      const y = y0 + t * dy;
      if (y >= box.minY && y <= box.maxY && t > 0) {
        candidates.push([box.maxX, y]);
      }
    }

    // Intersect with top (y = minY)
    if (dy !== 0) {
      const t = (box.minY - y0) / dy;
      const x = x0 + t * dx;
      if (x >= box.minX && x <= box.maxX && t > 0) {
        candidates.push([x, box.minY]);
      }
    }

    // Intersect with bottom (y = maxY)
    if (dy !== 0) {
      const t = (box.maxY - y0) / dy;
      const x = x0 + t * dx;
      if (x >= box.minX && x <= box.maxX && t > 0) {
        candidates.push([x, box.maxY]);
      }
    }

    // Return the closest valid intersection
    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      const da = (a[0] - x0) ** 2 + (a[1] - y0) ** 2;
      const db = (b[0] - x0) ** 2 + (b[1] - y0) ** 2;
      return da - db;
    });

    return candidates[0];
  }

  lineIntersection(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ): [number, number] | null {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denom === 0) return null; // Parallel

    const px =
      ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
      denom;
    const py =
      ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
      denom;

    // Check if intersection is within both segments
    const within = (min: number, max: number, v: number) =>
      v >= Math.min(min, max) && v <= Math.max(min, max);
    if (
      within(x1, x2, px) &&
      within(y1, y2, py) &&
      within(x3, x4, px) &&
      within(y3, y4, py)
    ) {
      return [px, py];
    }

    return null;
  }

  bindStart(bounds: BoundingBox): void {
    const boxEdges = [
      // Top edge
      { x1: bounds.minX, y1: bounds.minY, x2: bounds.maxX, y2: bounds.minY },
      // Right edge
      { x1: bounds.maxX, y1: bounds.minY, x2: bounds.maxX, y2: bounds.maxY },
      // Bottom edge
      { x1: bounds.maxX, y1: bounds.maxY, x2: bounds.minX, y2: bounds.maxY },
      // Left edge
      { x1: bounds.minX, y1: bounds.maxY, x2: bounds.minX, y2: bounds.minY },
    ];

    for (const edge of this.edges) {
      const { start, end, leftSite, rightSite } = edge;
      const leftFace = this.faces.get(leftSite);
      const rightFace = this.faces.get(rightSite);
      if (!end) {
        continue;
      }

      for (const boxEdge of boxEdges) {
        const intersection = this.lineIntersection(
          start[0],
          start[1],
          end[0],
          end[1],
          boxEdge.x1,
          boxEdge.y1,
          boxEdge.x2,
          boxEdge.y2
        );

        if (intersection) {
          const vertex = new Vertex(intersection[0], intersection[1]);

          // Add to both incident faces
          if (leftFace) leftFace.corners.add(vertex);
          if (rightFace) rightFace.corners.add(vertex);
        }
      }
    }
  }
}
