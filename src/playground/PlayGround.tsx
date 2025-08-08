import { Container } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Group, Layer, Line, Stage } from "react-konva";
import { BoundingBox, FortuneProcessor } from "../fortune/fortune";
import { Site } from "../fortune/definitions/Site";
import { Face } from "../fortune/definitions/Face";

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

export const PlayGround = () => {
  const [points, setPoints] = useState<Point[]>(POINTS);
  const [vertices, setVertices] = useState<Point[]>([]);
  const [finshedEdges, setFinishedEdges] = useState<Edge[]>([]);
  const [faces, setFaces] = useState<Face[]>([]);
  const fortune = new FortuneProcessor();

  const cleanUp = useCallback(() => {
    setPoints([]);
    setFinishedEdges([]);
    setVertices([]);
    setFaces([]);
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
    }
  }, [points]);

  const box: BoundingBox = {
    minX: 0,
    minY: 0,
    maxX: 700,
    maxY: 700,
  };

  return (
    <Container>
      <h1>PlayGround</h1>
      <button onClick={() => cleanUp()}>Reset</button>
      <button
        onClick={() => {
          const randomPoints = generateRandomPoints(100);
          setPoints(randomPoints);
        }}
      >
        Generate points
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
              if (face.site.x < 100 && face.site.y > 600) {
                console.log("Face points:", points, face.color);
              }
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
                points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </Container>
  );
};
