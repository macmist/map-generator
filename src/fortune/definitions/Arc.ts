import { Event } from "./Event";
import { Site } from "./Site";

export class Arc {
  public prev: Arc | null = null;
  public next: Arc | null = null;
  public event: Event | null = null;

  constructor(public site: Site) {}
}
