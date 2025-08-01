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

  insertArc(arc: Arc): void {
    if (this.root === null) {
      this.root = arc;
    }
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
}
