export class Site {
  constructor(public x: number, public y: number) {}

  public equals(other: Site): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
