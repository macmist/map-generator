export class Perlin2d {
  private permutation: number[];

  constructor(seed?: number) {
    this.permutation = this.generatePermutation(seed);
  }

  public generatePermutation(seed?: number): number[] {
    console.log("Generating permutation with seed:", seed);
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;

    if (seed !== undefined) {
      let random = this.xorshift(seed);
      for (let i = 255; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
    } else {
      for (let i = 255; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }
    }

    return [...p, ...p];
  }

  private xorshift(seed: number) {
    let x = seed % 2147483647;
    return function () {
      x ^= x << 13;
      x ^= x >> 17;
      x ^= x << 5;
      return ((x < 0 ? ~x + 1 : x) % 2147483647) / 2147483647;
    };
  }

  private fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number) {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const p = this.permutation;
    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];

    return this.lerp(
      v,
      this.lerp(u, this.grad(aa, x, y), this.grad(ba, x - 1, y)),
      this.lerp(u, this.grad(ab, x, y - 1), this.grad(bb, x - 1, y - 1))
    );
  }

  // NEW: Noise with octaves
  noise2D(
    x: number,
    y: number,
    octaves: number,
    persistence: number,
    lacunarity: number
  ) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    // Normalize to [0, 1]
    return (total / maxValue + 1) / 2;
  }
}
