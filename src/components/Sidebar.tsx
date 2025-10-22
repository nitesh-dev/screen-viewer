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
} from "react-icons/fa";

interface Props {
  items: IframeItem[];
  setItems: React.Dispatch<React.SetStateAction<IframeItem[]>>;
}

const Sidebar: React.FC<Props> = ({ items, setItems }) => {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [group, setGroup] = useState("");

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

  const groups = useMemo(() => Array.from(new Set(items.map((i) => i.group))), [items]);
  // const groups = useMemo(() => {

  //   let items: {group: string, items: IframeItem[]}[] = [] 
  //   return items;
  // }, [items]);

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Add iFrame</h2>

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

      {groups.map((g) => (
        <div key={g} className="iframe-group">
          <h4 className="group-title">{g}</h4>
          <ReactSortable
            list={items.filter((i) => i.group === g)}
            setList={(newList) => {
              const others = items.filter((i) => i.group !== g);
              setItems([...others, ...newList]);
            }}
            animation={150}
            handle=".drag-handle"
          >
            {items
              .filter((i) => i.group === g)
              .map((item) => (
                <div key={item.id} className="iframe-list-item">
                  <div className="iframe-item-left">
                    <span className="drag-handle">
                      <FaGripVertical />
                    </span>
                    <span className="iframe-item-title">{item.title}</span>
                  </div>
                  <div className="iframe-list-actions">
                    <button
                      title={item.visible ? "Hide" : "Show"}
                      onClick={() => handleToggleVisibility(item.id)}
                    >
                      {item.visible ? <FaEye /> : <FaEyeSlash />}
                    </button>
                    <button title="Edit" onClick={() => handleEdit(item.id)}>
                      <FaEdit />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
          </ReactSortable>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
