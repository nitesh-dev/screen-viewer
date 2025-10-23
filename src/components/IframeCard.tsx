import React from "react";
import { type IframeItem } from "../types";

interface Props {
  item: IframeItem;
  onSizeChange?: (id: string, size: { width: string; height: string }) => void;
}

const IframeCard: React.FC<Props> = React.memo(({ item, onSizeChange }) => {
  if (!item.visible) return null;

  /**
   * Extract srcdoc or src from iframe HTML string
   */
  function parseIframeCode(code: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(code, "text/html");
    const iframe = doc.querySelector("iframe");

    if (!iframe) return null;

    const srcdoc =
      iframe.getAttribute("srcdoc") ||
      iframe.innerHTML ||
      "<div>Invalid iframe content</div>";

    const title = iframe.getAttribute("title") || "";
    const width = iframe.getAttribute("width") || "390px";
    const height = iframe.getAttribute("height") || "auto";

    return { srcdoc, title, width, height };
  }

  const iframeData = React.useMemo(
    () => parseIframeCode(item.code),
    [item.code]
  );

  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

  const handleLoad = React.useCallback(
    (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      const iframeEl = e.currentTarget;
      try {
        const doc = iframeEl.contentDocument;
        if (doc) {
          const newHeight = doc.body.scrollHeight + 45 + "px";
          iframeEl.style.height = newHeight;

          // Inform parent of new dimensions
          onSizeChange?.(item.id, {
            width: iframeEl.style.width || iframeEl.width || "auto",
            height: newHeight,
          });
        }
      } catch (err) {
        console.warn("Could not adjust iframe height:", err);
      }
    },
    [item.id, onSizeChange]
  );

  if (!iframeData) return null;

  const { srcdoc, title, width, height } = iframeData;

  return (
    <div className="iframe-card">
      <div className="iframe-title">{item.title}</div>
      <div className="iframe-container">
        <iframe
          ref={iframeRef}
          title={title || item.title}
          srcDoc={srcdoc}
          width={width}
          height={height}
          style={{ width: width, border: "none" }}
          onLoad={handleLoad}
        />
      </div>
    </div>
  );
});

export default IframeCard;
