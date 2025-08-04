import { Point } from "../playground/PlayGround";
import { Arc } from "./definitions/Arc";
import { Event } from "./definitions/Event";
import { Site } from "./definitions/Site";
import { BeachLine } from "./structures/BeachLine";
import { EventQueue } from "./structures/EventQueue";

export class VisualFortune {
  private eventQueue: EventQueue = new EventQueue();
  private beachLine: BeachLine = new BeachLine();
  private sweepY: number = 0;

  public addSite(site: Site): void {
    const event = new Event(site.x, site.y, site);
    this.eventQueue.insert(event);
  }

  public isOnPoint(y: number): boolean {
    // Check if the sweep line is on a point
    return this.eventQueue.peek()?.y === y;
  }

  public getPoints(maxX: number, sweepY: number): Point[] {
    return this.beachLine.getPoints(maxX, sweepY);
  }

  public next() {
    const event = this.eventQueue.pop();
    this.sweepY = event?.y || 0;
    if (!event) {
      console.error("No event to process");
      return;
    }
    console.log(`Processing event at (${event.x}, ${event.y})`);
    if (event.site) {
      console.log(`Site event at (${event.site.x}, ${event.site.y})`);
      this.handleSiteEvent(event.site);
      // Handle site event logic here
    }
    if (event.arc) {
      console.log(
        `Circle event at (${event.x}, ${event.y}) for arc with site (${event.arc.site.x}, ${event.arc.site.y})`
      );
      // Handle circle event logic here
    }
  }

  private handleSiteEvent(site: Site): void {
    // Logic to handle site events
    console.log(`Handling site event for site at (${site.x}, ${site.y})`);
    // Add logic to update the beach line and edges
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

    // this.splitArc(arcAbove, site);
  }
}
