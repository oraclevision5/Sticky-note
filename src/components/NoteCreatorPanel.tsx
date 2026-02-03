import React from "react";
import { COLOR_POOL, MIN_HINT } from "../constants";

type NoteForm = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  title: string;
};

type NoteCreatorPanelProps = {
  form: NoteForm;
  onChange: (next: NoteForm) => void;
  onAddNote: () => void;
};

export const NoteCreatorPanel = ({ form, onChange, onAddNote }: NoteCreatorPanelProps) => (
  <aside className="panel">
    <h1>Sticky Notes</h1>
    <p className="subtitle">
      Create a note by choosing its position and size, then drag the header to move
      it or the corner to resize.
    </p>
    <div className="field-grid">
      <label className="span-2">
        Title
        <input
          type="text"
          value={form.title}
          onChange={(event) =>
            onChange({
              ...form,
              title: event.target.value
            })
          }
        />
      </label>
      <label>
        X
        <input
          type="number"
          value={form.x}
          min={0}
          onChange={(event) =>
            onChange({
              ...form,
              x: Number(event.target.value)
            })
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
            onChange({
              ...form,
              y: Number(event.target.value)
            })
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
            onChange({
              ...form,
              width: Number(event.target.value)
            })
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
            onChange({
              ...form,
              height: Number(event.target.value)
            })
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
              onChange({
                ...form,
                color
              })
            }
            aria-label={`Select ${color} note color`}
          />
        ))}
      </div>
    </div>
    <button className="primary" type="button" onClick={onAddNote}>
      Add note
    </button>
    <div className="hint">Drag a note onto the trash zone to delete it.</div>
  </aside>
);
