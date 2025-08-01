import { Site } from "./Site";

export class Edge {
  public end: [number, number] | null = null;

  constructor(
    public start: [number, number],
    public direction: [number, number],
    public leftSite: Site,
    public rightSite: Site
  ) {}
}
