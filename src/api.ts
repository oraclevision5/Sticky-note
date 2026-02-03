import type { Note } from "./types";

const API_STORAGE_KEY = "sticky-notes-api";
const API_LATENCY_MS = 450;

const delay = (duration: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

export const fetchNotes = async (): Promise<Note[]> => {
  await delay(API_LATENCY_MS);
  const stored = localStorage.getItem(API_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as Note[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveNotes = async (notes: Note[]): Promise<void> => {
  await delay(API_LATENCY_MS);
  localStorage.setItem(API_STORAGE_KEY, JSON.stringify(notes));
};
