import { Arc } from "../definitions/Arc";
import { Site } from "../definitions/Site";
import { findIntersection } from "../maths/utils";
import { BeachLine } from "./BeachLine";

describe("BeachLine", () => {
  let beachLine: BeachLine;

  const sweepY = 100;

  const leftSite = new Site(100, 50);
  const middleSite = new Site(200, 50);
  const rightSite = new Site(300, 50);

  const arc1 = new Arc(leftSite);
  const arc2 = new Arc(middleSite);
  const arc3 = new Arc(rightSite);

  arc1.next = arc2;
  arc2.prev = arc1;
  arc2.next = arc3;
  arc3.prev = arc2;

  beforeEach(() => {
    beachLine = new BeachLine();
  });

  it("should return first arc when there is only one arc", () => {
    const site1 = new Site(1, 2);
    const arc1 = new Arc(site1);

    beachLine.setHead(arc1);

    expect(beachLine.findArcAboveX(2, 3)).toBe(arc1); // Should return the first arc
  });

  it("should return null if no arcs exist", () => {
    expect(beachLine.findArcAboveX(0, 0)).toBeNull(); // No arcs in the beach line
  });

  it("should find the correct arc for a x on the left", () => {
    beachLine.setHead(arc1);
    const x = 120; // somewhere left
    const result = beachLine.findArcAboveX(x, sweepY);
    expect(result).toBe(arc1);
  });

  it("should find the correct arc for a x towards the middle", () => {
    beachLine.setHead(arc1);
    const breakpoint1 = findIntersection(leftSite, middleSite, sweepY);
    const x =
      (breakpoint1 + findIntersection(middleSite, rightSite, sweepY)) / 2;

    const result = beachLine.findArcAboveX(x, sweepY);
    expect(result).toBe(arc2);
  });

  it("should find the correct arc for a x towards the right", () => {
    beachLine.setHead(arc1);

    const x = 400;
    const result = beachLine.findArcAboveX(x, sweepY);
    expect(result).toBe(arc3);
  });
});
