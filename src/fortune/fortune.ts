import { Arc } from "./definitions/Arc";
import { Edge } from "./definitions/Edge";
import { Event } from "./definitions/Event";
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

  constructor() {
    this.beachLine = new BeachLine();
    this.eventQueue = new EventQueue();
  }
  addSite(site: Site): void {
    const event = new Event(site.x, site.y, site);
    this.eventQueue.insert(event);
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

  splitArc(arcAbove: Arc, site: Site): void {
    console.log(
      "Splitting arc above site at:",
      arcAbove.site.x,
      arcAbove.site.y
    );

    const leftArc = new Arc(arcAbove.site);
    console.log("Creating left arc:", leftArc.site.x, leftArc.site.y);
    const middleArc = new Arc(site);
    console.log("Creating midle arc:", site.x, site.y);
    const rightArc = new Arc(arcAbove.site);
    console.log("Creating right arc:", rightArc.site.x, rightArc.site.y);

    leftArc.prev = arcAbove.prev;
    leftArc.next = middleArc;

    middleArc.prev = leftArc;
    middleArc.next = rightArc;

    rightArc.prev = middleArc;
    rightArc.next = arcAbove.next;

    if (leftArc.prev) leftArc.prev.next = leftArc;
    if (rightArc.next) rightArc.next.prev = rightArc;

    console.log("Displaying beach line");
    let t: Arc | null = leftArc;
    while (t) {
      console.log("Arc:", t.site.x, t.site.y);
      t = t.next;
    }

    if (arcAbove === this.beachLine.head()) {
      console.log("Setting new head arc in the beach line");
      this.beachLine.setHead(leftArc);
    }
    const y = arcAbove.evaluate(site.x, this.sweepY);

    const vertex = [site.x, y];
    const edgeLeft = new Edge(arcAbove.site, site, vertex[0], vertex[1]);
    const edgeRight = new Edge(site, arcAbove.site, vertex[0], vertex[1]);
    this.edges.push(edgeLeft, edgeRight);

    leftArc.edge = edgeLeft;
    rightArc.edge = edgeRight;

    this.checkCircleEvents(leftArc);
    this.checkCircleEvents(rightArc);
  }

  checkCircleEvents(arc: Arc): void {
    console.log(
      `Checking circle events for arc at (${arc.site.x}, ${arc.site.y})`
    );
    if (!arc.prev || !arc.next) {
      console.error("Cannot check circle event without both neighbors");
      return; // Cannot form a circle event without both neighbors
    }
    const leftSite = arc.prev.site;
    const rightSite = arc.next.site;

    const circle = getCircumcircle(leftSite, arc.site, rightSite);
    if (!circle) {
      console.error("No circumcircle found for the arc");
      return;
    }

    console.log(
      "could be a circle at ",
      circle.x,
      circle.y,
      "with radius",
      circle.r
    );

    if (orientation(leftSite, arc.site, rightSite) !== Orientation.CLOCKWISE) {
      console.log(leftSite, arc.site, rightSite);
      console.log(orientation(leftSite, arc.site, rightSite));
      console.error(
        "Sites are not in counter-clockwise order, cannot form circle event"
      );
      return; // Not a valid event
    }

    const eventY = circle.y + circle.r;
    if (eventY < this.sweepY) {
      console.log(`Exiting, ${eventY} is below the sweep line ${this.sweepY}`);
      // Create a circle event only if it is above the sweep line
      return; // Circle event is below the sweep line
    }

    const event = new Event(circle.x, eventY, null, arc);
    event.circle = new Site(circle.x, circle.y); // Store the circle center
    console.log("inserting circle event at", event.x, event.y);
    arc.circleEvent = event;
    this.eventQueue.insert(event);
  }

  handleCircleEvent(event: Event): void {
    const arc = event.arc;
    if (!arc || !event.valid || !event.circle) {
      console.error("No arc found for circle event");
      return;
    }

    const vertex = new Vertex(event.circle?.x, event.circle?.y);
    if (event.arc && event.arc.edge) {
      event.arc.edge.vertex = vertex;
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

    // Invalidate the old circle events
    if (prevArc?.circleEvent) {
      prevArc.circleEvent.valid = false;
      prevArc.circleEvent = null;
    }
    if (nextArc?.circleEvent) {
      nextArc.circleEvent.valid = false;
      nextArc.circleEvent = null;
    }

    if (prevArc?.edge) {
      prevArc.edge.end = [vertex.x, vertex.y];
      prevArc.edge.vertex = vertex;
      vertex.incidentEdges.push(prevArc.edge);
    }
    if (nextArc?.edge) {
      nextArc.edge.end = [vertex.x, vertex.y];
      nextArc.edge.vertex = vertex;
      vertex.incidentEdges.push(nextArc.edge);
    }
    if (prevArc && nextArc) {
      const edge = new Edge(prevArc.site, nextArc.site, vertex.x, vertex.y);
      this.edges.push(edge);
      edge.vertex = vertex;
      vertex.incidentEdges.push(edge);

      // Attach this new edge to both neighbors for future circle events
      prevArc.edge = edge;
      nextArc.edge = edge;
    }

    if (prevArc) {
      this.checkCircleEvents(prevArc);
    }
    if (nextArc) {
      this.checkCircleEvents(nextArc);
    }
  }

  bindToBox(box: BoundingBox): void {
    for (const edge of this.edges) {
      if (!edge.end) {
        const clipped = this.clipEdgeToBox(edge, box);
        if (clipped) {
          edge.end = clipped;
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
}
