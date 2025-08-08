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
      if (x < bp) {
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
      if (
        current.edge &&
        current.edge.end === null &&
        current.edge.endVertex === null
      ) {
        const nextX = findIntersection(
          current.edge.leftSite,
          current.edge.rightSite,
          sweepY
        );
        const edge = current.edge.copy();
        edge.end = [nextX, current.evaluate(nextX, sweepY)];
        edges.push(edge);
      }
      if (
        current.leftEdge &&
        current.leftEdge.end === null &&
        current.leftEdge.endVertex === null
      ) {
        const nextX = findIntersection(
          current.leftEdge.leftSite,
          current.leftEdge.rightSite,
          sweepY
        );
        const edge = current.leftEdge.copy();
        edge.end = [nextX, current.evaluate(nextX, sweepY)];
        edges.push(edge);
      }
      if (
        current.rightEdge &&
        current.rightEdge.end === null &&
        current.rightEdge.endVertex === null
      ) {
        const nextX = findIntersection(
          current.rightEdge.leftSite,
          current.rightEdge.rightSite,
          sweepY
        );
        const edge = current.rightEdge.copy();
        edge.end = [nextX, current.evaluate(nextX, sweepY)];
        edges.push(edge);
      }
      current = current.next;
    }
    return edges;
  }

  display(): void {
    let current: Arc | null = this.root;
    console.log("-------------------------------------------");
    console.log("Displaying beach line:");
    while (current) {
      console.log(
        `Arc: ${current.site.x}, ${current.site.y}`,
        current.prev,
        current.next
      );
      current = current.next;
    }
    console.log("-------------------------------------------");
  }

  rebalance(): void {
    let current: Arc | null = this.root;
    while (current) {
      if (current.next) {
        if (current.next.site.equals(current.site)) {
          // Remove the duplicate arc

          current.next = current.next.next;
          if (current.next) {
            current.next.prev = current;
          }
        }
      }
      current = current.next;
    }
  }

  getPoints2(maxX: number, sweepY: number): Point[] {
    const points: Point[] = [];
    for (let x = 0; x < maxX; x++) {
      let above = this.findArcAboveX(x, sweepY);

      if (!above) continue; // No arc above this x-coordinate
      const yValue = above.evaluate(x, sweepY);
      if (yValue === Infinity) continue; // Skip points that are not defined
      points.push({ x, y: yValue });
    }
    return points;
  }

  getPoints(maxX: number, sweepY: number): Point[] {
    const points: Point[] = [];
    let current: Arc | null = this.root;
    let x = 0;
    while (current) {
      let nextX = maxX;
      if (current.next) {
        const [first, second] = [current.site, current.next.site];
        nextX = findIntersection(first, second, sweepY);
      }

      for (x; x <= Math.floor(nextX); x++) {
        const yValue = current.evaluate(x, sweepY);
        if (yValue === Infinity) continue; // Skip points that are not defined
        points.push({ x: x, y: yValue });
      }
      current = current.next;
    }
    return points;
  }
}
