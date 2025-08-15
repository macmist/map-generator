import { Container } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Group, Image, Layer, Line, Stage } from "react-konva";
import { BoundingBox, FortuneProcessor } from "../fortune/fortune";
import { Site } from "../fortune/definitions/Site";
import { Face } from "../fortune/definitions/Face";
import { Perlin2d } from "../noise/Perlin";

export type Point = {
  x: number;
  y: number;
};

type Edge = {
  start: Point;
  end: Point;
};

type PointComponentProps = Point & { color?: string };

const PointComponent = ({ x, y, color }: PointComponentProps) => {
  return (
    <Group>
      <Line
        x={0}
        y={0}
        stroke={color || "black"}
        points={[x - 1, y, x, y, x + 1, y]}
        strokeWidth={10}
      />
      <Line
        x={0}
        y={0}
        stroke={color || "black"}
        points={[x, y - 1, x, y, x, y + 1]}
        strokeWidth={10}
      />
    </Group>
  );
};

const POINTS: Point[] = [
  { x: 100, y: 100 },
  { x: 200, y: 200 },
  { x: 300, y: 350 },
  { x: 500, y: 600 },
  { x: 250, y: 550 },
];

const getColorFromHeight = (height: number): string => {
  if (height < 0.1) return "#0000cc"; // deep water
  if (height < 0.5) return "#996633"; // sand/rock
  if (height < 0.8) return "#339933"; // grass
  return "#ffffff"; // snow
};

const generateRandomPoints = (count: number): Point[] => {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.random() * 700,
      y: Math.random() * 700,
    });
  }
  return points;
};

function islandMask(x: number, y: number, size: number): number {
  const nx = (x / size) * 2 - 1; // map to -1..1
  const ny = (y / size) * 2 - 1;
  const distance = Math.sqrt(nx * nx + ny * ny);
  // Falloff: 1 at center, 0 at edges
  return Math.max(0, 1 - distance);
}

export const PlayGround = () => {
  const [points, setPoints] = useState<Point[]>(POINTS);
  const [vertices, setVertices] = useState<Point[]>([]);
  const [finshedEdges, setFinishedEdges] = useState<Edge[]>([]);
  const [faces, setFaces] = useState<Face[]>([]);
  const fortune = useMemo(() => new FortuneProcessor(), []);
  const perlin = useMemo(() => new Perlin2d(Math.random() * 10000), []);

  const cleanUp = useCallback(() => {
    setPoints([]);
    setFinishedEdges([]);
    setVertices([]);
    setFaces([]);
    setConstructionVisible(true);
  }, []);

  useEffect(() => {
    fortune.reset();
    setFinishedEdges([]);
    setVertices([]);
    setFaces([]);
    points.forEach((p) => {
      fortune.addSite(new Site(p.x, p.y)); // convert y to canvas coordinates
    });
    if (points.length > 0) {
      fortune.computeFortune();
      fortune.bindToBox({
        minX: 0,
        minY: 0,
        maxX: 700,
        maxY: 700,
      });

      fortune.vertices.forEach((v) => {
        setVertices((prev) => [...prev, { x: v.x, y: v.y }]);
      });
      fortune.edges.forEach((edge) => {
        const start = { x: edge.start[0], y: edge.start[1] };
        const end = edge.end
          ? { x: edge.end[0], y: edge.end[1] }
          : { x: start.x, y: start.y }; // Handle null end
        setFinishedEdges((prev) => [...prev, { start, end }]);
      });
      fortune.linkFaces();
      fortune.randomizeColors();
      const faces = Array.from(fortune.faces.values());
      setFaces(faces);
      console.log("done");
    }
  }, [points, fortune]);

  const box: BoundingBox = {
    minX: 0,
    minY: 0,
    maxX: 700,
    maxY: 700,
  };

  const relaxFaces = useCallback(() => {
    fortune.relaxFaces();
    setPoints(fortune.getFaceSites());
    setConstructionVisible(true);
  }, [fortune]);

  const [image, setImage] = useState<HTMLCanvasElement | null>(null);
  const [grid, setGrid] = useState<number[][]>([]);

  const perlinNoise = useCallback(() => {
    perlin.generatePermutation(Math.random() * 10000);
    const size = box.maxX;
    const scale = 0.005; // controls island size
    const octaves = 5;
    const persistence = 0.5;
    const lacunarity = 2;
    // Create an offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(size, size);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let noiseValue = perlin.noise2D(
          x * scale,
          y * scale,
          octaves,
          persistence,
          lacunarity
        );

        const mask = islandMask(x, y, size);
        const value = noiseValue * mask;
        grid[y][x] = value; // Store the value in the grid
        const shade = Math.floor(value * 255);
        const idx = (y * size + x) * 4;
        imageData.data[idx] = shade;
        imageData.data[idx + 1] = shade;
        imageData.data[idx + 2] = shade;
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    setImage(canvas);
    setGrid(grid);
    setPerlinVisible(true);
    setConstructionVisible(true);
  }, [box.maxX, grid, perlin]);

  const assignPerlinToFaces = useCallback(() => {
    setPerlinVisible(false);
    console.log("Assigning Perlin noise to faces");
    fortune.assignHeightToFaces(grid);
    const faces = Array.from(fortune.faces.values());
    faces.forEach((face) => {
      const height = face.height;
      face.color = getColorFromHeight(height);
    });
    setFaces(faces);
    setConstructionVisible(true);
  }, [fortune, grid]);

  const [perlinVisible, setPerlinVisible] = useState(false);

  const [constructionVisible, setConstructionVisible] = useState(true);

  const toggleConstruction = useCallback(() => {
    setConstructionVisible((prev) => !prev);
  }, []);

  return (
    <Container>
      <h1>PlayGround</h1>
      <button onClick={() => cleanUp()}>Reset</button>
      <button
        onClick={() => {
          const randomPoints = generateRandomPoints(1000);
          setPoints(randomPoints);
          setConstructionVisible(true);
        }}
      >
        Generate points
      </button>
      <button
        onClick={() => {
          relaxFaces();
        }}
      >
        Relax Faces
      </button>
      <button onClick={() => perlinNoise()}>Perlin Noise</button>
      <button onClick={() => assignPerlinToFaces()}>
        Assign Perlin to Faces
      </button>
      <button onClick={() => toggleConstruction()}>
        Toggle Construction (Edges, Vertices, Points)
      </button>
      <div
        style={{ width: box.maxX, height: box.maxY, border: "1px solid black" }}
      >
        <Stage width={box.maxX} height={box.maxY}>
          <Layer id="faces" clearBeforeDraw={true}>
            {faces.map((face, i) => {
              const points = face
                .asPolygon()

                .flatMap((p) => [p[0], p[1]]);

              return (
                <Line
                  key={i}
                  fill={face.color || "lightblue"}
                  closed
                  points={points}
                />
              );
            })}
          </Layer>
          {constructionVisible && (
            <>
              <Layer id="points">
                {points.map((p, i) => (
                  <PointComponent key={i} x={p.x} y={p.y} />
                ))}
              </Layer>

              <Layer id="vertices">
                {vertices.map((p, i) => (
                  <PointComponent key={i} x={p.x} y={p.y} color="red" />
                ))}
              </Layer>

              <Layer id="edges" clearBeforeDraw={true}>
                {finshedEdges.map((edge, i) => (
                  <Line
                    key={i}
                    stroke={"orange"}
                    points={[
                      edge.start.x,
                      edge.start.y,
                      edge.end.x,
                      edge.end.y,
                    ]}
                  />
                ))}
              </Layer>
            </>
          )}
          <Layer id="perlin" opacity={0.8} visible={perlinVisible}>
            {image && <Image image={image} />}
          </Layer>
        </Stage>
      </div>
    </Container>
  );
};
