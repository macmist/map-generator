import { Point } from "../../playground/PlayGround";
import { Arc } from "../definitions/Arc";
import { Edge } from "../definitions/Edge";
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

  getEdges(sweepY: number): Edge[] {
    const edges: Edge[] = [];
    let current: Arc | null = this.root;
    while (current) {
      if (current.edge) {
        const nextX = findIntersection(
          current.edge.leftSite,
          current.edge.rightSite,
          sweepY
        );
        const edge = current.edge.copy();
        edge.end = [nextX, current.evaluate(nextX, sweepY)];
        edges.push(edge);
      }
      current = current.next;
    }
    console.log("Edges at sweepY", sweepY, ":", edges);
    return edges;
  }

  getPoints(maxX: number, sweepY: number): Point[] {
    const points: Point[] = [];
    let current: Arc | null = this.root;
    let x = 0;
    while (current) {
      let nextX = maxX;
      if (current.next) {
        nextX = findIntersection(current.site, current.next.site, sweepY);
        if (sweepY === 120) {
          console.log(
            "intersection:",
            current.site.x,
            current.next.site.x,
            nextX
          );
        }
        if (sweepY === 120) {
          console.log(
            "computing points for arc:",
            current.site.x,
            current.site.y,
            "from",
            x,
            "to",
            nextX
          );
        }
      }
      for (x; x <= nextX; x++) {
        const yValue = current.evaluate(x, sweepY);
        if (yValue === Infinity) continue; // Skip points that are not defined
        points.push({ x: x, y: yValue });
      }
      current = current.next;
    }
    if (sweepY === 120) {
      console.log("Points at sweepY 120:", points);
    }
    return points;
  }
}
