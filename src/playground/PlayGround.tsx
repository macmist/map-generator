import { Container } from "@mui/material";
import { useEffect, useState } from "react";
import { Group, Layer, Line, Stage } from "react-konva";
import { FortuneProcessor } from "../fortune/fortune";

type Point = {
  x: number;
  y: number;
};

const PointComponent = ({ x, y }: Point, color?: string) => {
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

export const PlayGround = () => {
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [points, setPoints] = useState<Point[]>([]);

  useEffect(() => {
    const fortune = new FortuneProcessor();

    points.forEach((p) => {
      fortune.addSite({ x: p.x, y: p.y });
    });
    if (points.length > 0) {
      fortune.computeFortune();
    }
  }, [points]);

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
          onClick={() => {
            points.push({ x, y });
            setPoints([...points]);
          }}
        >
          <Layer>
            {points.map((p, i) => (
              <PointComponent key={i} x={p.x} y={p.y} />
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
        </Stage>
      </div>
    </Container>
  );
};
