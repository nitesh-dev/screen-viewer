import React from "react";
import { type IframeItem } from "../types";

interface Props {
  item: IframeItem;
  onSizeChange?: (id: string, size: { width: string; height: string }) => void;
}

// Cache to store rendered iframe content
const iframeCache = new Map<string, string>();

const IframeCard: React.FC<Props> = React.memo(({ item, onSizeChange }) => {
  if (!item.visible) return null;

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [cachedContent, setCachedContent] = React.useState<string | null>(null);

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

  // Check cache on mount
  React.useEffect(() => {
    const cached = iframeCache.get(item.id);
    if (cached) {
      setCachedContent(cached);
      setIsLoaded(true);
    }
  }, [item.id]);

  const handleLoad = React.useCallback(
    (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      const iframeEl = e.currentTarget;
      try {
        const doc = iframeEl.contentDocument;
        if (doc) {
          const newHeight = doc.body.scrollHeight + 45 + "px";
          iframeEl.style.height = newHeight;

          // Cache the iframe content to prevent re-rendering
          const iframeContent = iframeEl.outerHTML;
          iframeCache.set(item.id, iframeContent);
          setCachedContent(iframeContent);
          setIsLoaded(true);

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

  // If we have cached content and it's loaded, render from cache
  if (isLoaded && cachedContent) {
    return (
      <div className="iframe-card">
        <div className="iframe-title">{item.title}</div>
        <div 
          className="iframe-container"
          dangerouslySetInnerHTML={{ __html: cachedContent }}
        />
      </div>
    );
  }

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
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-rendering if iframe is already loaded
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.item.visible !== nextProps.item.visible) return false;
  if (prevProps.item.code !== nextProps.item.code) return false;
  if (prevProps.item.title !== nextProps.item.title) return false;
  
  // If iframe is already loaded and cached, don't re-render
  if (iframeCache.has(prevProps.item.id)) return true;
  
  return false;
});

export default IframeCard;
