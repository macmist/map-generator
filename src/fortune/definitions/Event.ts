import { Arc } from "./Arc";
import { Site } from "./Site";

export class Event {
  public valid: boolean = true;
  public circle: Site | null = null; // circle event center

  constructor(
    public x: number,
    public y: number,
    public site: Site | null = null, // site event
    public arc: Arc | null = null // circle event
  ) {}
}
