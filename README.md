# Sticky Notes

A single-page sticky notes application built with React and TypeScript.

## Features
- Create notes with explicit size and position values.
- Drag note headers to move them.
- Drag the corner handle to resize notes.
- Drop notes onto the trash zone to delete them.
- Rename notes directly in their headers and assign colors.
- Notes are persisted in local storage and synced to a mocked async API.

## Architecture overview
The UI is split into small, focused components so the main application stays readable. `App` owns the note state and the drag lifecycle, while `NoteCreatorPanel` renders the form used to create notes and `NoteCard` renders each note with its actions menu and editable content. Shared values (colors, storage keys, minimum sizes) live in `constants.ts` and the note shape is defined in `types.ts` for consistent typing across the app.

Persistence is handled with a local-first approach. Notes are restored from `localStorage` on startup, then an asynchronous mock API sync runs in the background. Each note update is persisted locally and sent to the mocked API so the flow stays responsive without blocking user interactions.

## Getting started

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```
