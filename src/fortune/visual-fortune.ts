import { Point } from "../playground/PlayGround";
import { Arc } from "./definitions/Arc";
import { Edge } from "./definitions/Edge";
import { Event } from "./definitions/Event";
import { Site } from "./definitions/Site";
import { Vertex } from "./definitions/Vertex";
import { getCircumcircle, Orientation, orientation } from "./maths/utils";
import { BeachLine } from "./structures/BeachLine";
import { EventQueue } from "./structures/EventQueue";

export class VisualFortune {
  private eventQueue: EventQueue = new EventQueue();
  private beachLine: BeachLine = new BeachLine();
  private sweepY: number = 0;
  public edges: Edge[] = [];

  public addSite(site: Site): void {
    const event = new Event(site.x, site.y, site);
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

  public getPoints(maxX: number, sweepY: number): Point[] {
    return this.beachLine.getPoints2(maxX, sweepY);
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

  private handleSiteEvent(site: Site): void {
    // Logic to handle site events
    // Add logic to update the beach line and edges
    const head = this.beachLine.head();
    if (!head) {
      this.beachLine.setHead(new Arc(site));
      return;
    }
    const arcAbove = this.beachLine.findArcAboveX(site.x, this.sweepY);
    if (!arcAbove) {
      return;
    }

    console.log("For point", site, "found arc above:", arcAbove.site);

    if (arcAbove.circleEvent) {
      // Remove the circle event if it exists
      arcAbove.circleEvent.valid = false;
      arcAbove.circleEvent = null;
    }

    this.splitArc(arcAbove, site);
  }

  getEdges(sweepY: number): Edge[] {
    return this.beachLine.getEdges(sweepY).concat(this.edges);
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
    const edgeLeft = new Edge(site, arcAbove.site, vertex[0], vertex[1]);
    const edgeRight = new Edge(arcAbove.site, site, vertex[0], vertex[1]);
    // this.edges.push(edgeLeft, edgeRight);

    leftArc.edge = edgeLeft;
    rightArc.edge = edgeRight;

    this.checkCircleEvents(leftArc);
    this.checkCircleEvents(rightArc);
  }

  test(circleY: number, a: Site, b: Site, c: Site): boolean {
    let aboveArray = [];
    if (circleY < a.y) {
      aboveArray.push(a);
    }
    if (circleY < b.y) {
      aboveArray.push(b);
    }
    if (circleY < c.y) {
      aboveArray.push(c);
    }
    console.log("This would be ok:", aboveArray.length > 1, aboveArray);
    return aboveArray.length > 1;
  }

  rightOnLine(start: Site, end: Site, point: Site): boolean {
    // Check if the point is on the right side of the line segment
    return (
      (end.x - start.x) * (point.y - start.y) -
        (end.y - start.y) * (point.x - start.x) <=
      0
    );
  }

  convergence(a: Site, b: Site, c: Site, point: Site): boolean {
    // Check if the point is converging towards the line segment

    if (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y) === 0) {
      return false; // Points are collinear
    }
    return this.rightOnLine(a, b, point) && this.rightOnLine(b, c, point);
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

    console.log("Circle y: ", circle.y, "r:", circle.r);
    console.log("Points:", leftSite, arc.site, rightSite);

    // if (!this.test(circle.y, leftSite, arc.site, rightSite)) {
    //   console.log("ignoring");
    //   return; // Circle event is below the sweep line
    // }
    const circleSite = new Site(circle.x, circle.y);

    if (!this.convergence(leftSite, arc.site, rightSite, circleSite)) {
      return; // Not a valid event
    }

    // if (orientation(leftSite, arc.site, rightSite) !== Orientation.CLOCKWISE) {
    //   console.log(leftSite, arc.site, rightSite);
    //   console.log(orientation(leftSite, arc.site, rightSite));
    //   console.error(
    //     "Sites are not in counter-clockwise order, cannot form circle event"
    //   );
    //   return; // Not a valid event
    // }

    const eventY = circle.y - circle.r;

    if (eventY > this.sweepY) {
      console.log(`Exiting, ${eventY} is below the sweep line ${this.sweepY}`);
      // Create a circle event only if it is above the sweep line
      return; // Circle event is below the sweep line
    }

    const event = new Event(circle.x, eventY, null, arc);
    event.circle = new Site(circle.x, circle.y); // Store the circle center
    arc.circleEvent = event;
    this.eventQueue.insert(event);
    console.log("Inserting circle event at", event.x, event.y);
  }

  handleCircleEvent(event: Event): void {
    const arc = event.arc;
    if (!arc || !event.valid || !event.circle) {
      console.error("No arc found for circle event");
      return;
    }
    console.log(
      `Handling circle event for arc at (${arc.site.x}, ${arc.site.y}) with circle at (${event.circle.x}, ${event.circle.y})`
    );

    const vertex = new Vertex(event.circle?.x, event.circle?.y);
    if (event.arc && event.arc.edge) {
      event.arc.edge.vertex = vertex;
      event.arc.edge.end = [vertex.x, vertex.y];
      vertex.incidentEdges.push(event.arc.edge);
      this.edges.push(event.arc.edge);
    }
    // this.vertices.push(vertex);
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
    const head = this.beachLine.head();

    if (prevArc && nextArc) {
      const edge = new Edge(prevArc.site, nextArc.site, vertex.x, vertex.y);

      //   this.edges.push(edge);
      edge.vertex = vertex;
      this.edges.push(edge);
      vertex.incidentEdges.push(edge);

      // Attach this new edge to both neighbors for future circle events
      prevArc.edge = edge;
      nextArc.edge = edge;
    }

    if (nextArc) {
      this.checkCircleEvents(nextArc);
    }
    if (prevArc) {
      this.checkCircleEvents(prevArc);
    }
  }
}
