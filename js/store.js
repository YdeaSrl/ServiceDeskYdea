// Persistenza su localStorage. Al primo avvio carica la scheda di esempio
// da data.js. I dati restano solo sul dispositivo.

import { DEFAULT_STATE } from "./data.js";

const STORAGE_KEY = "scheda-allenamento:v1";

// Genera un id univoco (con fallback per browser senza crypto.randomUUID).
export function uid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

let state = null;

export function getState() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
      if (!state || !Array.isArray(state.workouts)) throw new Error("stato non valido");
    } else {
      state = clone(DEFAULT_STATE);
      persist();
    }
  } catch (err) {
    console.warn("Stato non leggibile, ripristino la scheda di esempio.", err);
    state = clone(DEFAULT_STATE);
    persist();
  }
  return state;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Impossibile salvare i dati.", err);
  }
}

// Salva lo stato corrente (o uno stato passato esplicitamente).
export function saveState(next) {
  if (next) state = next;
  persist();
  return state;
}

// Ripristina la scheda di esempio.
export function resetToDefault() {
  state = clone(DEFAULT_STATE);
  persist();
  return state;
}

// --- Helper CRUD ---------------------------------------------------------

export function findWorkout(id) {
  return getState().workouts.find((w) => w.id === id) || null;
}

export function addWorkout(name) {
  const w = { id: uid(), name: name || "Nuova giornata", exercises: [] };
  getState().workouts.push(w);
  persist();
  return w;
}

export function updateWorkout(id, patch) {
  const w = findWorkout(id);
  if (w) Object.assign(w, patch);
  persist();
  return w;
}

export function deleteWorkout(id) {
  const s = getState();
  s.workouts = s.workouts.filter((w) => w.id !== id);
  persist();
}

export function addExercise(workoutId, exercise) {
  const w = findWorkout(workoutId);
  if (!w) return null;
  const ex = {
    id: uid(),
    name: exercise.name || "Nuovo esercizio",
    sets: Number(exercise.sets) || 3,
    reps: exercise.reps || "10",
    restSeconds: Number(exercise.restSeconds) || 60,
    weight: exercise.weight || "",
    notes: exercise.notes || "",
  };
  w.exercises.push(ex);
  persist();
  return ex;
}

export function updateExercise(workoutId, exerciseId, patch) {
  const w = findWorkout(workoutId);
  if (!w) return null;
  const ex = w.exercises.find((e) => e.id === exerciseId);
  if (ex) {
    Object.assign(ex, patch);
    if (patch.sets !== undefined) ex.sets = Number(patch.sets) || 0;
    if (patch.restSeconds !== undefined) ex.restSeconds = Number(patch.restSeconds) || 0;
  }
  persist();
  return ex;
}

export function deleteExercise(workoutId, exerciseId) {
  const w = findWorkout(workoutId);
  if (!w) return;
  w.exercises = w.exercises.filter((e) => e.id !== exerciseId);
  persist();
}
