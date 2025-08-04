import { Arc } from "./definitions/Arc";
import { HalfEdge } from "./definitions/HalfEdge";
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
import { DCEL } from "./definitions/DCEL";
import { Face } from "./definitions/Face";

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
  public dcel: DCEL = new DCEL();
  private faceMap = new Map<Site, Face>();

  constructor() {
    this.beachLine = new BeachLine();
    this.eventQueue = new EventQueue();
  }

  getFaceForSite(site: Site): Face {
    let face = this.faceMap.get(site);
    if (!face) {
      face = this.dcel.createFace(site);
      this.faceMap.set(site, face);
    }
    return face;
  }
  addSite(site: Site): void {
    const event = new Event(site.x, site.y, site);
    this.eventQueue.insert(event);
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
      console.log("Added first arc:", site);
      return;
    }
    const arcAbove = this.beachLine.findArcAboveX(site.x, this.sweepY);
    if (!arcAbove) {
      console.log("No arc found above site, adding new arc:", site);
      return;
    }

    if (arcAbove.circleEvent) {
      // Remove the circle event if it exists
      arcAbove.circleEvent.valid = false;
      arcAbove.circleEvent = null;
    }

    this.splitArc(arcAbove, site);
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
    const x = findIntersection(arcAbove.site, site, this.sweepY);

    const y = arcAbove.evaluate(site.x, this.sweepY);
    const [e1, e1twin] = this.dcel.createHalfEdgePair();
    const [e2, e2twin] = this.dcel.createHalfEdgePair();
    const vertex = [x, y];
    e1.origin = new Vertex(vertex[0], vertex[1]);
    e2.origin = new Vertex(vertex[0], vertex[1]);

    e1.incidentFace = this.getFaceForSite(arcAbove.site);
    e2.incidentFace = this.getFaceForSite(site);
    if (!e1.incidentFace.outerComponent) {
      e1.incidentFace.outerComponent = e1;
    }
    if (!e2.incidentFace.outerComponent) {
      e2.incidentFace.outerComponent = e2;
    }
    e1twin.incidentFace = this.getFaceForSite(site);
    e2twin.incidentFace = this.getFaceForSite(arcAbove.site);

    this.dcel.halfEdges.push(e1, e1twin, e2, e2twin);

    if (leftArc.prev?.edge) {
      e1.prev = leftArc.prev.edge;
      leftArc.prev.edge.next = e1;
    }

    if (rightArc.next?.edge) {
      e2.next = rightArc.next.edge;
      rightArc.next.edge.prev = e2;
    }
    leftArc.edge = e1;
    rightArc.edge = e2;
    console.log("Assigned edge to leftArc:", leftArc.edge);
    console.log("Assigned edge to rightArc:", rightArc.edge);

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

    const eventY = circle.y + circle.r;
    if (eventY < this.sweepY) {
      // Create a circle event only if it is above the sweep line
      return; // Circle event is below the sweep line
    }

    const event = new Event(circle.x, eventY, null, arc);
    event.circle = new Site(circle.x, circle.y); // Store the circle center
    arc.circleEvent = event;

    this.eventQueue.insert(event);
  }

  handleCircleEvent(event: Event): void {
    let a = this.beachLine.head();
    console.log("Processing circle, Current beach line:");
    while (a) {
      console.log(
        `Arc at (${a.site.x}, ${a.site.y}) — edge:`,
        a.edge,
        " | arc ID:",
        a
      );
      a = a.next;
    }
    const arc = event.arc;
    if (!arc || !event.valid || !event.circle) {
      return;
    }

    const vertex = this.dcel.createVertex(event.circle?.x, event.circle?.y);

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
      const halfEdge = prevArc.edge;
      halfEdge.twin!.origin = vertex;
      vertex.incidentEdge = halfEdge.twin!;
    }
    if (nextArc?.edge) {
      const halfEdge = nextArc.edge;
      halfEdge.origin = vertex;
      vertex.incidentEdge = halfEdge;
    }
    if (prevArc && nextArc) {
      const [e1, e2] = this.dcel.createHalfEdgePair();
      e1.origin = vertex;
      e1.incidentFace = this.getFaceForSite(prevArc.site);
      if (!e1.incidentFace.outerComponent) {
        e1.incidentFace.outerComponent = e1;
      }
      e2.incidentFace = this.getFaceForSite(nextArc.site);
      if (!e2.incidentFace.outerComponent) {
        e2.incidentFace.outerComponent = e2;
      }
      // if (!prevArc.edge) prevArc.edge = new HalfEdge();
      // if (!nextArc.edge) nextArc.edge = new HalfEdge();
      if (prevArc.edge) {
        e1.prev = prevArc.edge;
        prevArc.edge.next = e1;
        prevArc.edge.twin!.origin = vertex;
      }
      if (nextArc.edge) {
        e2.next = nextArc.edge;
        nextArc.edge.origin = vertex;
        nextArc.edge.prev = e2;
      }
      prevArc.edge = e1;
      nextArc.edge = e2;
    }

    if (prevArc) {
      this.checkCircleEvents(prevArc);
    }
    if (nextArc) {
      this.checkCircleEvents(nextArc);
    }
  }
}
