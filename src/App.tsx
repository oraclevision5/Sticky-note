import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchNotes, saveNotes } from "./api";
import { COLOR_POOL, MIN_HINT, STORAGE_KEY } from "./constants";
import { NoteCard } from "./components/NoteCard";
import { NoteCreatorPanel } from "./components/NoteCreatorPanel";
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

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const App = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    try {
      return stored ? (JSON.parse(stored) as Note[]) : [];
    } catch {
      return [];
    }
  });
  
  const [form, setForm] = useState({
    x: 80,
    y: 80,
    width: 220,
    height: 180,
    color: COLOR_POOL[0],
    title: "New note"
  });
  const dragRef = useRef<DragState | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);

  const nextColor = useMemo(() => {
    const index = notes.length % COLOR_POOL.length;
    return COLOR_POOL[index];
  }, [notes.length]);

  useEffect(() => {
    let isActive = true;
    
    fetchNotes()
      .then((remoteNotes) => {
        if (isActive && remoteNotes.length > 0) {
          setNotes(remoteNotes);
        }
      })
      .catch(() => {
        console.warn("Failed to fetch notes from API");
      });

    return () => {
      isActive = false;
    };
  }, []);


  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    console.log("Saved notes to localStorage:", notes);
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
    const title = form.title.trim() || "Untitled note";
    setNotes((prev) => [
      ...prev,
      {
        id,
        title,
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

  const updateNoteTitle = (id: string, title: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, title } : note))
    );
  };

  const updateNoteColor = (id: string, color: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, color } : note))
    );
  };

  return (
    <div className="app">
      <NoteCreatorPanel form={form} onChange={setForm} onAddNote={handleAddNote} />
      <main ref={boardRef} className="board">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onBringToFront={bringNoteToFront}
            onStartDrag={startDrag}
            onUpdateTitle={updateNoteTitle}
            onUpdateText={updateNoteText}
            onUpdateColor={updateNoteColor}
          />
        ))}
        <div ref={trashRef} className="trash-zone">
          <div className="trash-icon">🗑️</div>
          <div>Trash</div>
        </div>
      </main>
    </div>
  );
};
