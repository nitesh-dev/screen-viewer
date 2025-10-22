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

  // const groups = useMemo(() => Array.from(new Set(items.map((i) => i.group))), [items]);
  const groups = useMemo(() => {
    const _items: { name: string; items: IframeItem[] }[] = [];

    // Create a map to group items by their "group" property
    const grouped: Record<string, IframeItem[]> = {};

    items.forEach((item) => {
      if (!grouped[item.group]) {
        grouped[item.group] = [];
      }
      grouped[item.group].push(item);
    });

    // Convert grouped object into the desired array format
    for (const [groupName, groupItems] of Object.entries(grouped)) {
      _items.push({ name: groupName, items: groupItems });
    }

    return _items;
  }, [items]);

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

      {groups.map((group, key1) => (
        <div key={key1} className="iframe-group">
          <h4 className="group-title">{group.name}</h4>
          <ReactSortable
            list={group.items}
            setList={(newList) => {
              let updatedItems: IframeItem[] = [];
              let _groups = [...groups];
              let index = _groups.findIndex((i) => i.name == group.name);
              if (index == -1) return;
              _groups[index] = { name: group.name, items: newList };

              _groups.forEach((element) => {
                element.items.forEach((element2) => {
                  updatedItems.push(element2);
                });
              });
              setItems(updatedItems);
            }}
            animation={150}
            handle=".drag-handle"
            // group="group"
          >
            {group.items.map((item, key2) => (
              <div key={key2} className="iframe-list-item">
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
                  <button title="Delete" onClick={() => handleDelete(item.id)}>
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
