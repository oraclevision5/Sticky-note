import React from "react";
import { COLOR_POOL } from "./constants";
import type { Note } from "./types";

type NoteCardProps = {
  note: Note;
  onBringToFront: (id: string) => void;
  onStartDrag: (event: React.PointerEvent, id: string, mode: "move" | "resize") => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onUpdateColor: (id: string, color: string) => void;
};

export const NoteCard = ({
  note,
  onBringToFront,
  onStartDrag,
  onUpdateTitle,
  onUpdateText,
  onUpdateColor
}: NoteCardProps) => (
  <article
    className="note"
    style={{
      top: note.y,
      left: note.x,
      width: note.width,
      height: note.height,
      background: note.color
    }}
    onPointerDown={() => onBringToFront(note.id)}
  >
    <header
      className="note-header"
      onPointerDown={(event) => onStartDrag(event, note.id, "move")}
    >
      <input
        className="note-title"
        value={note.title}
        onChange={(event) => onUpdateTitle(note.id, event.target.value)}
        onPointerDown={(event) => event.stopPropagation()}
        aria-label="Note title"
      />
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
              onUpdateColor(note.id, color);
            }}
            aria-label={`Set note color to ${color}`}
          />
        ))}
      </div>
    </header>
    <textarea
      className="note-body"
      value={note.text}
      onChange={(event) => onUpdateText(note.id, event.target.value)}
      placeholder="Write something..."
    />
    <button
      type="button"
      className="resize-handle"
      aria-label="Resize note"
      onPointerDown={(event) => onStartDrag(event, note.id, "resize")}
    />
  </article>
);
