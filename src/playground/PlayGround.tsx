import { Container } from "@mui/material";
import { useEffect, useState } from "react";
import { Group, Layer, Line, Stage } from "react-konva";
import { FortuneProcessor } from "../fortune/fortune";

type Point = {
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
  { x: 200, y: 300 },
  // { x: 300, y: 150 },
  // { x: 400, y: 250 },
];

export const PlayGround = () => {
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [points, setPoints] = useState<Point[]>(POINTS);
  const [vertices, setVertices] = useState<Point[]>([]);
  const [finshedEdges, setFinishedEdges] = useState<Edge[]>([]);

  useEffect(() => {
    const fortune = new FortuneProcessor();

    points.forEach((p) => {
      console.log("Adding site:", p);
      fortune.addSite({ x: p.x, y: p.y }); // convert y to canvas coordinates
    });
    if (points.length > 0) {
      fortune.computeFortune();
      // fortune.bindToBox({
      //   minX: 0,
      //   minY: 0,
      //   maxX: 700,
      //   maxY: 700,
      // });
      console.log("Fortune's algorithm completed");
      console.log("Vertices:", fortune.dcel.vertices);
      console.log("Faces:", fortune.dcel.faces);
      console.log("HalfEdges:", fortune.dcel.halfEdges);
      // console.log("Edges:", fortune.edges);
      // console.log("Vertices:", fortune.vertices);
      // fortune.vertices.forEach((v) => {
      //   setVertices((prev) => [...prev, { x: v.x, y: v.y }]);
      // });
      // fortune.edges.forEach((edge) => {
      //   const start = { x: edge.start[0], y: edge.start[1] };
      //   const end = edge.end
      //     ? { x: edge.end[0], y: edge.end[1] }
      //     : { x: start.x, y: start.y }; // Handle null end
      //   setFinishedEdges((prev) => [...prev, { start, end }]);
      // });
    }
  }, [points, setVertices]);

  const calculateParabola = (focus: Point, directrix: number): Point[] => {
    const h = focus.x;
    const k = (focus.y + directrix) / 2;
    const p = -Math.abs(focus.y - directrix) / 2;
    const res: Point[] = [];

    if (p !== 0) {
      for (let x = 0; x < 700; x++) {
        const y = (x - h) ** 2 / (4 * p) + k;
        res.push({ x, y });
      }
      return res;
    }

    return res;
  };

  return (
    <Container>
      <h1>PlayGround</h1>
      <div style={{ width: 700, height: 700, border: "1px solid black" }}>
        <Stage
          width={700}
          height={700}
          onMouseMove={(e) => {
            const pos = e.target.getRelativePointerPosition();
            if (pos && pos.y > 0 && pos.y < 700) {
              setY(pos.y);
            }
            if (pos && pos.x > 0 && pos.x < 700) {
              setX(pos.x);
            }
          }}
          onClick={(e) => {
            const stage = e.target.getStage();
            stage?.getLayers().forEach((layer) => {
              if (layer.id() === "edges" || layer.id() === "vertices") {
                console.log("Clearing layer:", layer.id());
                layer.removeChildren();
              }
            });

            points.push({ x, y });
            setPoints([...points]);
          }}
        >
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
          {/* <Layer>
            {points.map((p, i) => {
              if (y >= p.y)
                return (
                  <Line
                    key={i}
                    x={0}
                    y={0}
                    stroke={"blue"}
                    points={calculateParabola(p, y).flatMap((p) => [p.x, p.y])}
                  />
                );
              return <></>;
            })}
          </Layer> */}
          {/* <Layer>
            <Line x={0} y={y} stroke={"red"} points={[0, 0, 1000, 0]} />
          </Layer> */}
          <Layer id="edges">
            {finshedEdges.map((edge, i) => (
              <Line
                key={i}
                x={0}
                y={0}
                stroke={"green"}
                points={[edge.start.x, edge.start.y, edge.end.x, edge.end.y]}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </Container>
  );
};
