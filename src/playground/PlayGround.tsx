import { Container } from "@mui/material";
import { useEffect, useState } from "react";
import { Group, Layer, Line, Stage } from "react-konva";
import { FortuneProcessor } from "../fortune/fortune";
import { VisualFortune } from "../fortune/visual-fortune";
import { Site } from "../fortune/definitions/Site";

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

export const PlayGround = () => {
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [points, setPoints] = useState<Point[]>(POINTS);
  const [vertices, setVertices] = useState<Point[]>([]);
  const [finshedEdges, setFinishedEdges] = useState<Edge[]>([]);
  const [visualPoints, setVisualPoints] = useState<Point[]>([]);
  const visualFortune = new VisualFortune();
  points.forEach((p) => {
    visualFortune.addSite(new Site(p.x, p.y));
  });

  // useEffect(() => {
  //   const fortune = new FortuneProcessor();

  //   points.forEach((p) => {
  //     fortune.addSite({ x: p.x, y: p.y }); // convert y to canvas coordinates
  //   });
  //   if (points.length > 0) {
  //     fortune.computeFortune();
  //     fortune.bindToBox({
  //       minX: 0,
  //       minY: 0,
  //       maxX: 700,
  //       maxY: 700,
  //     });

  //     fortune.vertices.forEach((v) => {
  //       setVertices((prev) => [...prev, { x: v.x, y: v.y }]);
  //     });
  //     fortune.edges.forEach((edge) => {
  //       const start = { x: edge.start[0], y: edge.start[1] };
  //       const end = edge.end
  //         ? { x: edge.end[0], y: edge.end[1] }
  //         : { x: start.x, y: start.y }; // Handle null end
  //       setFinishedEdges((prev) => [...prev, { start, end }]);
  //     });
  //   }
  // }, [points, setVertices]);

  const calculateParabola = (focus: Point, directrix: number): Point[] => {
    const h = focus.x;
    const k = (focus.y + directrix) / 2;
    const p = Math.abs(directrix - focus.y) / 2;
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

  const timeout = (delay: number) => {
    return new Promise((res) => setTimeout(res, delay));
  };

  useEffect(() => {
    // console.log("Visual points updated:", visualPoints);
  }, [visualPoints]);

  useEffect(() => {
    // console.log("Visual points updated:", visualPoints);
  }, [finshedEdges]);

  const [isSweeping, setIsSweeping] = useState(false);
  const sweep = async () => {
    setVisualPoints([]);
    setFinishedEdges([]);
    setIsSweeping(true);
    for (let i = 0; i < 502; i++) {
      const y = 700 - i; // Invert y for canvas coordinates
      setY(y);
      // console.log("Sweeping at y:", i);
      // Simulate a delay for the sweep line effect

      while (visualFortune.onPointOrAfterCircle(y)) {
        visualFortune.next();
      }
      setVisualPoints(visualFortune.getPoints(700, y));
      setFinishedEdges([]);

      for (const edge of visualFortune.getEdges(y).filter((e) => e.end)) {
        setFinishedEdges((prev) => [
          ...prev,
          {
            start: { x: edge.start[0], y: edge.start[1] },
            end: edge.end
              ? { x: edge.end[0], y: edge.end[1] }
              : { x: edge.start[0], y: edge.start[1] },
          },
        ]);
      }
      if (i > 350) {
        await timeout(10);
      } else {
        await timeout(10);
      }
    }
    setIsSweeping(false);
  };

  return (
    <Container>
      <h1>PlayGround</h1>
      <button onClick={() => sweep()}>start</button>
      <div style={{ width: 700, height: 700, border: "1px solid black" }}>
        <Stage
          width={700}
          height={700}
          onClick={(e) => {
            const stage = e.target.getStage();
            stage?.getLayers().forEach((layer) => {
              if (layer.id() === "edges" || layer.id() === "vertices") {
                console.log("Clearing layer:", layer.id());
                layer.removeChildren();
              }
            });
            console.log("Clicked at:", x, y);
            // points.push({ x, y });
            // setPoints([...points]);
          }}
          onMouseMove={(e) => {
            const stage = e.target.getStage();
            if (stage) {
              const pos = stage.getPointerPosition();
              if (pos) {
                setX(pos.x);
                // setY(pos.y);
              }
            }
          }}
        >
          <Layer id="points">
            {points.map((p, i) => (
              <PointComponent key={i} x={p.x} y={p.y} />
            ))}
          </Layer>
          <Layer id="vertices">
            {/* {vertices.map((p, i) => (
              <PointComponent key={i} x={p.x} y={p.y} color="red" />
            ))} */}
          </Layer>
          <Layer>
            {points.map((p, i) => {
              if (y <= p.y)
                return (
                  <Line
                    key={i}
                    stroke={"green"}
                    points={calculateParabola(p, y).flatMap((p) => [p.x, p.y])}
                  />
                );
              return <></>;
            })}

            {visualPoints.length > 0 && (
              <Line
                stroke={"blue"}
                points={visualPoints.flatMap((p) => [p.x, p.y])}
              />
            )}
          </Layer>
          <Layer>
            <Line x={0} y={y} stroke={"red"} points={[0, 0, 1000, 0]} />
          </Layer>
          <Layer id="edges">
            {finshedEdges.map((edge, i) => (
              <Line
                key={i}
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
