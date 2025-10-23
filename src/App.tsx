import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import IframeCard from "./components/IframeCard";
import { type IframeItem } from "./types";
import TexturePacker from "./components/TexturePacker/TexturePacker";

const App: React.FC = () => {
  const [iframes, setIframes] = useState<IframeItem[]>(() => {
    const stored = localStorage.getItem("iframes");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        console.error("Failed to parse stored iframes");
        return [];
      }
    }
    return [];
  });

  // Debug iframe state changes
  useEffect(() => {
    console.log('App.tsx iframes state updated:', {
      count: iframes.length,
      withDimensions: iframes.filter(item => item.dimensions).length,
      dimensions: iframes.map(item => ({ id: item.id, dimensions: item.dimensions }))
    });
  }, [iframes]);

  const [viewMode, setViewMode] = useState<"normal" | "compact">("normal");

  // 💾 Save to localStorage whenever iframes change
  useEffect(() => {
    // localStorage.setItem("iframes", JSON.stringify(iframes));
  }, [iframes]);

  const frames: IframeItem[][] = useMemo(() => {
    const grouped: Record<string, IframeItem[]> = {};
    const ungrouped: IframeItem[] = [];

    for (const item of iframes) {
      if (item.group) {
        if (!grouped[item.group]) {
          grouped[item.group] = [];
        }
        grouped[item.group].push(item);
      } else {
        ungrouped.push(item);
      }
    }

    // Combine into a 2D array: [group1Items, group2Items, ..., ungroupedItems]
    const result = Object.values(grouped);
    if (ungrouped.length) {
      result.push(ungrouped);
    }

    return result;
  }, [iframes]);

  return (
    <div className="app-container">
      <div className="main-content">
        {iframes.length === 0 ? (
          <p className="placeholder-text">Add an iframe from the sidebar →</p>
        ) : (
          <>
            {viewMode == "normal" ? (
              <>
                {" "}
                <div className="normal-view">
                  {frames.map((group, i) => (
                    <>
                      <div className="group" key={i}>
                        {group.map((iframe, i2) => (
                          <IframeCard 
                            key={i2} 
                            item={iframe} 
                            onSizeChange={(id, size) => {
                              console.log('Normal view onSizeChange:', { id, size });
                              setIframes(prev => prev.map(item => 
                                item.id === id 
                                  ? { 
                                      ...item, 
                                      dimensions: {
                                        width: parseInt(size.width.replace('px', '')) || 300,
                                        height: parseInt(size.height.replace('px', '')) || 200,
                                      }
                                    }
                                  : item
                              ));
                            }}
                          />
                        ))}
                      </div>
                    </>
                  ))}
                </div>
              </>
            ) : (
              <>
                {" "}
                <div className="compact-view"> 
                  <TexturePacker 
                    iframeItems={iframes} 
                    onIframeUpdate={setIframes}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Sidebar
        onViewModeChange={setViewMode}
        items={iframes}
        setItems={setIframes}
      />
    </div>
  );
};

export default App;
