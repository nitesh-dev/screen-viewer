// TexturePacker.tsx
import React, { useEffect, useState } from "react";
import type { PlacedRect } from "./types";
import { MaxRectsPacker } from "./maxrects";
import { type IframeItem } from "../../types";
import IframeCard from "../IframeCard";

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

interface TexturePackerProps {
  iframeItems: IframeItem[];
  onIframeUpdate?: (updatedIframes: IframeItem[]) => void;
}

/**
 * Extract dimensions from iframe HTML code
 */
function extractIframeDimensions(code: string): { width: number; height: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(code, "text/html");
  const iframe = doc.querySelector("iframe");

  if (!iframe) {
    return { width: 300, height: 200 }; // Default dimensions
  }

  const widthAttr = iframe.getAttribute("width") || "300px";
  const heightAttr = iframe.getAttribute("height") || "200px";

  // Parse width and height, handling both px and numeric values
  const width = parseInt(widthAttr.replace("px", "")) || 300;
  const height = parseInt(heightAttr.replace("px", "")) || 200;

  return { width, height };
}

const TexturePacker: React.FC<TexturePackerProps> = ({ iframeItems, onIframeUpdate }) => {
  const [rects, setRects] = useState<PlacedRect[]>([]);
  const [container, setContainer] = useState({ width: 0, height: 0 });
  const [iframeData, setIframeData] = useState<IframeItem[]>([]);
  const [iframeDimensions, setIframeDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [loadedIframes, setLoadedIframes] = useState<Set<string>>(new Set());
  const [hasInitialPack, setHasInitialPack] = useState(false);

  // Debug props received
  console.log('TexturePacker received props:', {
    iframeItemsCount: iframeItems.length,
    iframeItemsWithDimensions: iframeItems.filter(item => item.dimensions).length,
    iframeItemsDimensions: iframeItems.map(item => ({ id: item.id, dimensions: item.dimensions }))
  });

  const visibleIframes = iframeItems.filter(item => item.visible);

  const packRectangles = (iframeList: IframeItem[], dimensions: Record<string, { width: number; height: number }>) => {
    console.log('packRectangles called with:', { iframeList: iframeList.length, dimensions });
    
    // Convert iframe items to rectangle format for packing
    const rectangles = iframeList
      .filter(item => item.visible)
      .map((item, index) => {
        // Priority: stored dimensions > runtime dimensions > parsed dimensions
        const actualDimensions = item.dimensions || dimensions[item.id] || extractIframeDimensions(item.code);
        
        console.log(`Rectangle ${index}:`, {
          id: item.id,
          stored: item.dimensions,
          runtime: dimensions[item.id],
          parsed: extractIframeDimensions(item.code),
          final: actualDimensions
        });
        
        return {
          id: index,
          width: actualDimensions.width,
          height: actualDimensions.height,
        };
      });

    if (rectangles.length === 0) {
      setRects([]);
      setContainer({ width: 0, height: 0 });
      return;
    }

    const packer = new MaxRectsPacker(true, 400, 400, GAP);
    const result = packer.pack(rectangles);

    const colored = result.packed.map((r, i) => ({
      ...r,
      color: COLORS[i % COLORS.length],
    }));

    setRects(colored);
    setContainer({ width: result.width, height: result.height });
  };

  const handleSizeChange = (id: string, size: { width: string; height: string }) => {
    const newDimensions = {
      width: parseInt(size.width.replace('px', '')) || 300,
      height: parseInt(size.height.replace('px', '')) || 200,
    };
    
    console.log('handleSizeChange:', { id, size, newDimensions });
    
    // Update runtime dimensions
    setIframeDimensions(prev => ({
      ...prev,
      [id]: newDimensions
    }));

    // Update iframe items with stored dimensions
    const updatedIframes = iframeItems.map(item => 
      item.id === id 
        ? { ...item, dimensions: newDimensions }
        : item
    );
    
    console.log('Updated iframes with dimensions:', updatedIframes);
    
    // Update local state
    setIframeData(updatedIframes);
    
    // Notify parent component
    onIframeUpdate?.(updatedIframes);

    setLoadedIframes(prev => new Set([...prev, id]));
  };

  // Check if iframes already have stored dimensions
  const hasStoredDimensions = visibleIframes.some(item => item.dimensions);
  
  // Debug logging
  console.log('TexturePacker Debug:', {
    visibleIframes: visibleIframes.length,
    hasStoredDimensions,
    storedDimensions: visibleIframes.map(item => ({ id: item.id, dimensions: item.dimensions })),
    loadedIframes: loadedIframes.size,
    hasInitialPack
  });

  // Initial pack - use stored dimensions if available, otherwise estimate
  useEffect(() => {
    setIframeData(iframeItems);
    if (!hasInitialPack) {
      console.log('Initial pack triggered');
      packRectangles(iframeItems, {});
      setHasInitialPack(true);
    }
  }, [iframeItems, hasInitialPack]);

  // Repack when all iframes have loaded with actual dimensions
  useEffect(() => {
    if (hasInitialPack && visibleIframes.length > 0 && loadedIframes.size === visibleIframes.length) {
      packRectangles(iframeItems, iframeDimensions);
    }
  }, [loadedIframes, iframeDimensions, hasInitialPack, iframeItems, visibleIframes.length]);

  // Handle case where iframes are already loaded (switching from normal to compact view)
  useEffect(() => {
    if (hasInitialPack && hasStoredDimensions && loadedIframes.size === 0) {
      // Iframes already have dimensions, trigger immediate repack with stored dimensions
      packRectangles(iframeItems, {});
    }
  }, [hasInitialPack, hasStoredDimensions, loadedIframes.size, iframeItems]);

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
        {rects.map((r) => {
          const iframeItem = iframeData.find((_, i) => i === r.id);
          if (!iframeItem) return null;

          return (
            <div
              key={r.id}
              style={{
                position: "absolute",
                left: r.x,
                top: r.y,
                width: r.width,
                height: r.height,
                boxSizing: "border-box",
              }}
            >
              <IframeCard 
                item={iframeItem} 
                onSizeChange={handleSizeChange}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TexturePacker;
