import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchNotes, saveNotes } from "./api";
import type { Note } from "./types";

type DragMode = "move" | "resize";

type DragState = {
  id: string;
  mode: DragMode;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originWidth: number;
  originHeight: number;
};

const COLOR_POOL = ["#fff2a8", "#ffd1dc", "#d9f8d9", "#d7e8ff", "#ffe0b5"];
const MIN_HINT = 120;
const STORAGE_KEY = "sticky-notes";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const App = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [form, setForm] = useState({
    x: 80,
    y: 80,
    width: 220,
    height: 180,
    color: COLOR_POOL[0]
  });
  const dragRef = useRef<DragState | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);

  const nextColor = useMemo(() => {
    const index = notes.length % COLOR_POOL.length;
    return COLOR_POOL[index];
  }, [notes.length]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Note[];
        if (Array.isArray(parsed)) {
          setNotes(parsed);
        }
      } catch {
        // ignore invalid stored data
      }
    }

    let isActive = true;
    fetchNotes()
      .then((remoteNotes) => {
        if (isActive && remoteNotes.length > 0) {
          setNotes(remoteNotes);
        }
      })
      .catch(() => {
        // ignore mock API failures
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    saveNotes(notes).catch(() => {
      // ignore mock API failures
    });
  }, [notes]);

  const bringNoteToFront = (id: string) => {
    setNotes((prev) => {
      const index = prev.findIndex((note) => note.id === id);
      if (index === -1 || index === prev.length - 1) return prev;
      const updated = [...prev];
      const [note] = updated.splice(index, 1);
      updated.push(note);
      return updated;
    });
  };

  const startDrag = (event: React.PointerEvent, id: string, mode: DragMode) => {
    event.preventDefault();
    const note = notes.find((item) => item.id === id);
    if (!note) return;
    bringNoteToFront(id);

    dragRef.current = {
      id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      originX: note.x,
      originY: note.y,
      originWidth: note.width,
      originHeight: note.height
    };

    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      const drag = dragRef.current;
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      const boardRect = boardRef.current?.getBoundingClientRect();

      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== drag.id) return note;

          if (drag.mode === "move") {
            const maxX = boardRect ? boardRect.width - note.width : note.x + deltaX;
            const maxY =
              boardRect ? boardRect.height - note.height : note.y + deltaY;

            return {
              ...note,
              x: clamp(drag.originX + deltaX, 0, maxX),
              y: clamp(drag.originY + deltaY, 0, maxY)
            };
          }

          const maxWidth = boardRect
            ? boardRect.width - note.x
            : drag.originWidth + deltaX;
          const maxHeight = boardRect
            ? boardRect.height - note.y
            : drag.originHeight + deltaY;

          return {
            ...note,
            width: clamp(drag.originWidth + deltaX, MIN_HINT, maxWidth),
            height: clamp(drag.originHeight + deltaY, MIN_HINT, maxHeight)
          };
        })
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!dragRef.current) return;

      const drag = dragRef.current;
      dragRef.current = null;

      if (drag.mode !== "move") return;

      const trashRect = trashRef.current?.getBoundingClientRect();
      if (!trashRect) return;

      const isOverTrash =
        event.clientX >= trashRect.left &&
        event.clientX <= trashRect.right &&
        event.clientY >= trashRect.top &&
        event.clientY <= trashRect.bottom;

      if (isOverTrash) {
        setNotes((prev) => prev.filter((note) => note.id !== drag.id));
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const handleAddNote = () => {
    const id = crypto.randomUUID();
    setNotes((prev) => [
      ...prev,
      {
        id,
        x: form.x,
        y: form.y,
        width: form.width,
        height: form.height,
        color: form.color || nextColor,
        text: ""
      }
    ]);
  };

  const updateNoteText = (id: string, text: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, text } : note))
    );
  };

  const updateNoteColor = (id: string, color: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, color } : note))
    );
  };

  return (
    <div className="app">
      <aside className="panel">
        <h1>Sticky Notes</h1>
        <p className="subtitle">
          Create a note by choosing its position and size, then drag the header
          to move it or the corner to resize.
        </p>
        <div className="field-grid">
          <label>
            X
            <input
              type="number"
              value={form.x}
              min={0}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  x: Number(event.target.value)
                }))
              }
            />
          </label>
          <label>
            Y
            <input
              type="number"
              value={form.y}
              min={0}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  y: Number(event.target.value)
                }))
              }
            />
          </label>
          <label>
            Width
            <input
              type="number"
              value={form.width}
              min={MIN_HINT}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  width: Number(event.target.value)
                }))
              }
            />
          </label>
          <label>
            Height
            <input
              type="number"
              value={form.height}
              min={MIN_HINT}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  height: Number(event.target.value)
                }))
              }
            />
          </label>
        </div>
        <div className="color-picker">
          <div className="color-label">Color</div>
          <div className="color-options">
            {COLOR_POOL.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-swatch${form.color === color ? " selected" : ""}`}
                style={{ background: color }}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    color
                  }))
                }
                aria-label={`Select ${color} note color`}
              />
            ))}
          </div>
        </div>
        <button className="primary" type="button" onClick={handleAddNote}>
          Add note
        </button>
        <div className="hint">
          Drag a note onto the trash zone to delete it.
        </div>
      </aside>
      <main ref={boardRef} className="board">
        {notes.map((note) => (
          <article
            key={note.id}
            className="note"
            style={{
              top: note.y,
              left: note.x,
              width: note.width,
              height: note.height,
              background: note.color
            }}
            onPointerDown={() => bringNoteToFront(note.id)}
          >
            <header
              className="note-header"
              onPointerDown={(event) => startDrag(event, note.id, "move")}
            >
              <span>Drag me</span>
              <div className="note-colors">
                {COLOR_POOL.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-swatch${note.color === color ? " selected" : ""}`}
                    style={{ background: color }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      updateNoteColor(note.id, color);
                    }}
                    aria-label={`Set note color to ${color}`}
                  />
                ))}
              </div>
            </header>
            <textarea
              className="note-body"
              value={note.text}
              onChange={(event) => updateNoteText(note.id, event.target.value)}
              placeholder="Write something..."
            />
            <button
              type="button"
              className="resize-handle"
              aria-label="Resize note"
              onPointerDown={(event) => startDrag(event, note.id, "resize")}
            />
          </article>
        ))}
        <div ref={trashRef} className="trash-zone">
          <div className="trash-icon">🗑️</div>
          <div>Trash</div>
        </div>
      </main>
    </div>
  );
};
