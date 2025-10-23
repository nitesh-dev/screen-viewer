// TexturePacker.tsx
import React, { useEffect, useState } from "react";
import type { PlacedRect } from "./types";
import { MaxRectsPacker } from "./maxrects";

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E2",
  "#F8B88B",
  "#A3E4D7",
];

const GAP = 8;

const TexturePacker: React.FC = () => {
  const [items, setItems] = useState<
    { id: number; width: number; height: number }[]
  >([]);
  const [rects, setRects] = useState<PlacedRect[]>([]);
  const [container, setContainer] = useState({ width: 0, height: 0 });

  const packRectangles = (list = items) => {
    const packer = new MaxRectsPacker(true, 400, 400, GAP);
    const result = packer.pack(list);

    const colored = result.packed.map((r, i) => ({
      ...r,
      color: COLORS[i % COLORS.length],
    }));

    setRects(colored);
    setContainer({ width: result.width, height: result.height });
  };

  const addRandomItem = () => {
    const newRect = {
      id: Date.now(),
      width: Math.floor(20 + Math.random() * 500),
      height: Math.floor(20 + Math.random() * 500),
    };

    const updated = [...items, newRect];
    setItems(updated);
    packRectangles(updated);
  };

  useEffect(() => {
    const initialItems = Array.from({ length: 10 }).map((_, i) => ({
      id: i + 1,
      width: Math.floor(80 + Math.random() * 120),
      height: Math.floor(60 + Math.random() * 100),
    }));

    setItems(initialItems);
    packRectangles(initialItems);
  }, []);

  return (
    <div className="texture-packer">
      <div
        style={{
          position: "relative",
          width: container.width,
          height: container.height,
          margin: "0 auto",
        //   background: "#1e1e1e",
          border: "2px solid #444",
          borderRadius: 6,
          transition: "width 0.3s, height 0.3s",
        }}
      >
        {rects.map((r) => (
          <div
            key={r.id}
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: r.width,
              height: r.height,
              background: r.color,
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 4,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "bold",
              fontSize: 12,
            }}
          >
            {/* {r.width}×{r.height} */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TexturePacker;
