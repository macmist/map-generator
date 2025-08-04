import { Point } from "../../playground/PlayGround";
import { Arc } from "../definitions/Arc";
import { findIntersection } from "../maths/utils";

export class BeachLine {
  private root: Arc | null = null;

  head(): Arc | null {
    return this.root;
  }

  setHead(arc: Arc): void {
    this.root = arc;
  }

  findArcAboveX(x: number, y: number): Arc | null {
    let current: Arc | null = this.root;
    if (!current) return null;
    if (!current.prev && !current.next) return current;

    while (current.next) {
      const bp = findIntersection(current.site, current.next.site, y);
      if (x < bp || Math.abs(x - bp) < 1e-9) {
        return current;
      }
      current = current?.next;
    }

    return current;
  }

  getPoints(maxX: number, sweepY: number): Point[] {
    const points: Point[] = [];
    let current: Arc | null = this.root;
    let x = 0;
    while (current) {
      let nextX = maxX;
      if (current.next) {
        nextX = findIntersection(current.site, current.next.site, sweepY);
      }
      for (let i = x; i <= nextX; i++) {
        const yValue = current.evaluate(i, sweepY);
        if (yValue === Infinity) continue; // Skip points that are not defined
        points.push({ x: i, y: yValue });
      }
      current = current.next;
    }
    console.log("Beach line points:", points);
    return points;
  }
}
