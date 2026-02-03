import React, { useEffect, useRef, useState } from "react";
import { COLOR_POOL } from "../constants";
import type { Note } from "../types";

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
}: NoteCardProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  const handleRenameClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleTitleBlur = () => {
    if (!note.title.trim()) {
      onUpdateTitle(note.id, "Untitled note");
    }
    setIsEditingTitle(false);
  };

  return (
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
        <div className="note-title-group">
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              className="note-title"
              value={note.title}
              onChange={(event) => onUpdateTitle(note.id, event.target.value)}
              onPointerDown={(event) => event.stopPropagation()}
              onBlur={handleTitleBlur}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              aria-label="Note title"
            />
          ) : (
            <span className="note-title-text">{note.title || "Untitled note"}</span>
          )}
        </div>
        <div className="note-actions" ref={menuRef}>
          <button
            type="button"
            className="icon-button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            🎨
          </button>
          <button
            type="button"
            className="icon-button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={handleRenameClick}
          >
            ✏️
          </button>
          {isMenuOpen && (
            <div className="color-menu" role="menu">
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
                    setIsMenuOpen(false);
                  }}
                  aria-label={`Set note color to ${color}`}
                />
              ))}
            </div>
          )}
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
};
