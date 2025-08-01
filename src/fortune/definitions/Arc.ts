import { Edge } from "./Edge";
import { Event } from "./Event";
import { Site } from "./Site";

export class Arc {
  public prev: Arc | null = null;
  public next: Arc | null = null;
  public circleEvent: Event | null = null;
  public edge: Edge | null = null;

  constructor(public site: Site) {}
}
