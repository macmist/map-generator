export class Perlin2d {
  private grad2: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [Math.SQRT1_2, Math.SQRT1_2],
    [-Math.SQRT1_2, Math.SQRT1_2],
    [Math.SQRT1_2, -Math.SQRT1_2],
    [-Math.SQRT1_2, -Math.SQRT1_2],
  ];

  private perm: number[];

  constructor(seed?: number) {
    this.perm = this.buildPermutation(seed);
  }

  public setSeed(seed: number): void {
    this.perm = this.buildPermutation(seed);
  }

  // Smooth interpolation curve
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private buildPermutation(seed?: number): number[] {
    const p = new Array(256).fill(0).map((_, i) => i);

    // Optional seed: deterministic shuffle
    if (seed !== undefined) {
      let rng = this.xorshift32(seed);
      for (let i = p.length - 1; i > 0; i--) {
        const j = rng() % (i + 1);
        [p[i], p[j]] = [p[j], p[i]];
      }
    } else {
      for (let i = p.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
    }

    return [...p, ...p]; // duplicate for overflow
  }

  // Simple xorshift32 PRNG for deterministic permutation
  private xorshift32(seed: number) {
    let state = seed || 1;
    return () => {
      state ^= state << 13;
      state ^= state >> 17;
      state ^= state << 5;
      return Math.abs(state);
    };
  }

  private dotGridGradient(
    ix: number,
    iy: number,
    x: number,
    y: number
  ): number {
    const idx = this.perm[(ix + this.perm[iy & 255]) & 255] & 7;
    const grad = this.grad2[idx];
    const dx = x - ix;
    const dy = y - iy;
    return dx * grad[0] + dy * grad[1];
  }

  public noise(x: number, y: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const sx = this.fade(x - x0);
    const sy = this.fade(y - y0);

    const n00 = this.dotGridGradient(x0, y0, x, y);
    const n10 = this.dotGridGradient(x1, y0, x, y);
    const n01 = this.dotGridGradient(x0, y1, x, y);
    const n11 = this.dotGridGradient(x1, y1, x, y);

    const ix0 = this.lerp(n00, n10, sx);
    const ix1 = this.lerp(n01, n11, sx);

    return this.lerp(ix0, ix1, sy);
  }

  public generateGrid(
    width: number,
    height: number,
    scale: number
  ): number[][] {
    const grid: number[][] = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        const value = this.noise(x * scale, y * scale);
        grid[y][x] = (value + 1) / 2; // normalize to [0, 1]
      }
    }
    return grid;
  }
}
