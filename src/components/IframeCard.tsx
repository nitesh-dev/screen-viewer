import React from "react";
import { type IframeItem } from "../types";

interface Props {
  item: IframeItem;
}

const IframeCard: React.FC<Props> = React.memo(({ item }) => {
  if (!item.visible) return null;

  function injectedCode(iframeHTML: string) {
    iframeHTML = iframeHTML.replace(/height\s*:\s*[^;"]+;?/gi, "");

    if (!/onload\s*=/i.test(iframeHTML)) {
      iframeHTML = iframeHTML.replace(
        "<iframe",
        "<iframe onload=\"this.style.height=(this.contentDocument.body.scrollHeight+45)+'px';\""
      );
    }

    return iframeHTML;
  }

  const html = React.useMemo(() => injectedCode(item.code), [item.code]);

  return (
    <div className="iframe-card">
      <div className="iframe-title">{item.title}</div>
      <div
        className="iframe-container"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
});

export default IframeCard;
