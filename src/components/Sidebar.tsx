import React, { useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { ReactSortable } from "react-sortablejs";
import { type IframeItem } from "../types";

// Icons
import {
  FaEye,
  FaEyeSlash,
  FaTrash,
  FaEdit,
  FaGripVertical,
  FaCompressAlt,
  FaExpandAlt,
  FaSearchPlus,
  FaSearchMinus,
  FaFileExport,
  FaFileImport,
  FaCopy,
} from "react-icons/fa";
import { FaRotateRight } from "react-icons/fa6";

interface Props {
  items: IframeItem[];
  setItems: React.Dispatch<React.SetStateAction<IframeItem[]>>;
  onViewModeChange?: (mode: "normal" | "compact") => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const Sidebar: React.FC<Props> = ({ 
  items, 
  setItems, 
  onViewModeChange, 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onResetView 
}) => {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [group, setGroup] = useState("");
  const [viewMode, setViewMode] = useState<"normal" | "compact">("normal");

  const handleAdd = () => {
    if (!title.trim() || !code.trim()) return;
    const newItem: IframeItem = {
      id: uuid(),
      title,
      code,
      visible: true,
      group: group || "Ungrouped",
    };
    setItems([...items, newItem]);
    setTitle("");
    setCode("");
    setGroup("");
  };

  const handleDelete = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleToggleVisibility = (id: string) => {
    setItems(
      items.map((i) => (i.id === id ? { ...i, visible: !i.visible } : i))
    );
  };

  const handleEdit = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setTitle(item.title);
    setCode(item.code);
    setGroup(item.group);
    setItems(items.filter((i) => i.id !== id)); // remove before re-adding
  };

  const handleCopyCode = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    
    try {
      await navigator.clipboard.writeText(item.code);
      alert(`Code copied to clipboard!`);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      alert("Failed to copy to clipboard");
    }
  };

  const handleToggleGroupVisibility = (groupName: string) => {
    const groupItems = items.filter(i => i.group === groupName);
    const allVisible = groupItems.every(i => i.visible);
    
    setItems(
      items.map(i => 
        i.group === groupName ? { ...i, visible: !allVisible } : i
      )
    );
  };

  const handleViewChange = (mode: "normal" | "compact") => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `iframe-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          // Validate that imported data has the correct structure
          const validItems = importedData.every(
            (item) =>
              typeof item.id === "string" &&
              typeof item.title === "string" &&
              typeof item.code === "string" &&
              typeof item.visible === "boolean" &&
              typeof item.group === "string"
          );
          
          if (validItems) {
            setItems(importedData);
            alert("iFrames imported successfully!");
          } else {
            alert("Invalid file format. Please check the JSON structure.");
          }
        } else {
          alert("Invalid file format. Expected an array of iFrame items.");
        }
      } catch (error) {
        alert("Error parsing JSON file. Please ensure it's a valid JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be imported again
    event.target.value = "";
  };

  const groups = useMemo(() => {
    const grouped: Record<string, IframeItem[]> = {};
    items.forEach((item) => {
      if (!grouped[item.group]) grouped[item.group] = [];
      grouped[item.group].push(item);
    });
    return Object.entries(grouped).map(([name, groupItems]) => ({
      name,
      items: groupItems,
    }));
  }, [items]);

  return (
    <div className="sidebar">
      {/* === Toolbar Section === */}
      <div className="sidebar-toolbar">
        <h2 className="sidebar-title">iFrame Manager</h2>

        {/* Radio-style icon button group */}
        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${
              viewMode === "normal" ? "active" : ""
            }`}
            title="Normal View"
            onClick={() => handleViewChange("normal")}
          >
            <FaExpandAlt />
          </button>
          <button
            className={`view-mode-btn ${
              viewMode === "compact" ? "active" : ""
            }`}
            title="Compact View"
            onClick={() => handleViewChange("compact")}
          >
            <FaCompressAlt />
          </button>
        </div>
      </div>

      {/* === Zoom Controls === */}
      <div className="zoom-controls">
        <h3>Zoom Controls</h3>
        <div className="zoom-buttons">
          <button
            className="zoom-btn"
            title="Zoom Out"
            onClick={onZoomOut}
          >
            <FaSearchMinus />
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button
            className="zoom-btn"
            title="Zoom In"
            onClick={onZoomIn}
          >
            <FaSearchPlus />
          </button>
          <button
            className="zoom-btn reset-btn"
            title="Reset View"
            onClick={onResetView}
          >
            <FaRotateRight />
          </button>
        </div>
      </div>

      {/* === Export/Import Section === */}
      <div className="export-import-controls">
        <h3>Data Management</h3>
        <div className="export-import-buttons">
          <button
            className="export-btn"
            title="Export Configuration"
            onClick={handleExport}
          >
            <FaFileExport /> Export
          </button>
          <label className="import-btn" title="Import Configuration">
            <FaFileImport /> Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </div>

      {/* === Form Section === */}
      <div className="sidebar-form">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder='<iframe src="https://example.com"></iframe>'
        />
        <input
          type="text"
          placeholder="Group (optional)"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        />
        <button className="btn-primary" onClick={handleAdd}>
          Add iFrame
        </button>
      </div>

      <h3 className="iframe-list-heading">iFrames</h3>

      {groups.map((group, key1) => {
        const allVisible = group.items.every(i => i.visible);
        const visibleCount = group.items.filter(i => i.visible).length;
        const hasHidden = visibleCount < group.items.length;
        return (
        <div key={key1} className={`iframe-group ${hasHidden ? 'has-hidden' : ''}`}>
          <div className="group-header">
            <div className="group-title-wrapper">
              <h4 className="group-title">{group.name}</h4>
              <span className="group-count">{visibleCount}/{group.items.length}</span>
            </div>
            <button
              className="group-toggle-btn"
              title={allVisible ? "Hide all in group" : "Show all in group"}
              onClick={() => handleToggleGroupVisibility(group.name)}
            >
              {allVisible ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <ReactSortable
            list={group.items}
            setList={(newList) => {
              const updatedGroups = groups.map((g) =>
                g.name === group.name ? { ...g, items: newList } : g
              );
              const updatedItems = updatedGroups.flatMap((g) => g.items);
              setItems(updatedItems);
            }}
            animation={200}
            easing="cubic-bezier(1, 0, 0, 1)"
            handle=".drag-handle"
            ghostClass="sortable-ghost"
            chosenClass="sortable-chosen"
            dragClass="sortable-drag"
          >
            {group.items.map((item, key2) => (
              <div key={key2} className={`iframe-list-item ${!item.visible ? 'hidden-item' : ''}`}>
                <div className="iframe-item-content">
                  <div className="iframe-item-left">
                    <span className="drag-handle">
                      <FaGripVertical />
                    </span>
                    <span className="iframe-item-title">{item.title}</span>
                    {!item.visible && <span className="hidden-badge">Hidden</span>}
                  </div>
                  <div className="iframe-list-actions">
                    <button
                      title={item.visible ? "Hide" : "Show"}
                      onClick={() => handleToggleVisibility(item.id)}
                    >
                      {item.visible ? <FaEye /> : <FaEyeSlash />}
                    </button>
                    <button title="Copy Code" onClick={() => handleCopyCode(item.id)}>
                      <FaCopy />
                    </button>
                    <button title="Edit" onClick={() => handleEdit(item.id)}>
                      <FaEdit />
                    </button>
                    <button title="Delete" onClick={() => handleDelete(item.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </ReactSortable>
        </div>
      )}
      )}
    </div>
  );
};

export default Sidebar;
