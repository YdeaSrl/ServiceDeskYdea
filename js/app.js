// App principale: navigazione tra viste, rendering scheda, contatore
// ripetizioni/serie, editor, e collegamento con il timer di recupero.

import * as store from "./store.js";
import { RestTimer, formatTime } from "./timer.js";

// --- Stato di UI (non persistito) ---------------------------------------
const ui = {
  view: "scheda", // scheda | timer | edit
  activeWorkoutId: null,
  // progressi di sessione per esercizio: { [exerciseId]: { reps, doneSets } }
  session: {},
};

const timer = new RestTimer({
  onTick: renderTimer,
  onEnd: () => {
    // piccolo flash visivo a fine tempo
    const el = document.getElementById("timer-display");
    if (el) {
      el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 1500);
    }
  },
});

// --- Utility DOM ---------------------------------------------------------
function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v !== null && v !== undefined && v !== false) {
      el.setAttribute(k, v);
    }
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    el.append(c.nodeType ? c : document.createTextNode(c));
  }
  return el;
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// --- Navigazione ---------------------------------------------------------
function setView(view) {
  ui.view = view;
  for (const v of ["scheda", "timer", "edit"]) {
    document.getElementById(`view-${v}`).hidden = v !== view;
    document.getElementById(`nav-${v}`).classList.toggle("active", v === view);
  }
  render();
}

// --- Rendering: SCHEDA ---------------------------------------------------
function renderScheda() {
  const root = document.getElementById("view-scheda");
  clear(root);
  const state = store.getState();

  if (!state.workouts.length) {
    root.append(
      h("p", { class: "empty" }, "Nessuna giornata. Vai su “Modifica” per crearne una."),
    );
    return;
  }

  if (!ui.activeWorkoutId || !store.findWorkout(ui.activeWorkoutId)) {
    ui.activeWorkoutId = state.workouts[0].id;
  }

  // Selettore giornata
  const tabs = h("div", { class: "day-tabs" });
  for (const w of state.workouts) {
    tabs.append(
      h(
        "button",
        {
          class: "day-tab" + (w.id === ui.activeWorkoutId ? " active" : ""),
          onClick: () => {
            ui.activeWorkoutId = w.id;
            renderScheda();
          },
        },
        w.name,
      ),
    );
  }
  root.append(tabs);

  const workout = store.findWorkout(ui.activeWorkoutId);
  const list = h("div", { class: "exercise-list" });

  if (!workout.exercises.length) {
    list.append(h("p", { class: "empty" }, "Nessun esercizio in questa giornata."));
  }

  workout.exercises.forEach((ex) => {
    list.append(renderExerciseCard(ex));
  });

  root.append(list);
}

function renderExerciseCard(ex) {
  const sess = (ui.session[ex.id] ||= { reps: 0, doneSets: 0 });

  const meta = [];
  meta.push(`${ex.sets}×${ex.reps}`);
  if (ex.weight) meta.push(ex.weight);
  meta.push(`recupero ${formatTime(ex.restSeconds)}`);

  // Indicatori serie completate
  const setDots = h("div", { class: "set-dots" });
  for (let i = 0; i < ex.sets; i++) {
    setDots.append(h("span", { class: "dot" + (i < sess.doneSets ? " on" : "") }));
  }

  const card = h("div", { class: "card exercise" }, [
    h("div", { class: "exercise-head" }, [
      h("h3", { text: ex.name }),
      h("div", { class: "exercise-meta", text: meta.join(" · ") }),
    ]),
    ex.notes ? h("p", { class: "notes", text: ex.notes }) : null,

    // Contatore ripetizioni
    h("div", { class: "rep-counter" }, [
      h("span", { class: "rep-label", text: "Ripetizioni" }),
      h("button", { class: "btn round", onClick: () => { sess.reps = Math.max(0, sess.reps - 1); renderScheda(); } }, "−"),
      h("span", { class: "rep-value", text: String(sess.reps) }),
      h("button", { class: "btn round", onClick: () => { sess.reps++; renderScheda(); } }, "+"),
      h("button", { class: "btn ghost small", onClick: () => { sess.reps = 0; renderScheda(); } }, "azzera"),
    ]),

    // Serie completate + timer recupero
    h("div", { class: "set-row" }, [
      setDots,
      h("button", {
        class: "btn small",
        onClick: () => {
          sess.doneSets = Math.min(ex.sets, sess.doneSets + 1);
          sess.reps = 0;
          startRest(ex.restSeconds);
          renderScheda();
        },
      }, "✓ Serie + recupero"),
      h("button", {
        class: "btn ghost small",
        onClick: () => { sess.doneSets = 0; renderScheda(); },
      }, "reset serie"),
    ]),

    h("button", {
      class: "btn secondary block",
      onClick: () => startRest(ex.restSeconds),
    }, `▶ Recupero ${formatTime(ex.restSeconds)}`),
  ]);

  return card;
}

// Precarica il timer e passa alla vista timer avviandolo.
function startRest(seconds) {
  timer.primeAudio();
  timer.set(seconds);
  timer.start();
  setView("timer");
}

// --- Rendering: TIMER ----------------------------------------------------
function renderTimer(remaining, total) {
  const disp = document.getElementById("timer-display");
  if (disp) disp.textContent = formatTime(remaining ?? timer.remaining);
  const bar = document.getElementById("timer-bar-fill");
  if (bar) {
    const t = total ?? timer.total;
    const r = remaining ?? timer.remaining;
    bar.style.width = t ? `${(r / t) * 100}%` : "0%";
  }
  const toggleBtn = document.getElementById("timer-toggle");
  if (toggleBtn) toggleBtn.textContent = timer.running ? "⏸ Pausa" : "▶ Avvia";
}

function buildTimerView() {
  const root = document.getElementById("view-timer");
  clear(root);

  const display = h("div", { class: "timer-display", id: "timer-display", text: formatTime(timer.remaining) });
  const barWrap = h("div", { class: "timer-bar" }, [
    h("div", { class: "timer-bar-fill", id: "timer-bar-fill" }),
  ]);

  const controls = h("div", { class: "timer-controls" }, [
    h("button", { class: "btn", id: "timer-toggle", onClick: () => { timer.primeAudio(); timer.toggle(); renderTimer(); } }, "▶ Avvia"),
    h("button", { class: "btn ghost", onClick: () => { timer.reset(); renderTimer(); } }, "↺ Reset"),
  ]);

  const adjust = h("div", { class: "timer-adjust" }, [
    h("button", { class: "btn ghost small", onClick: () => adjustTimer(-15) }, "−15s"),
    h("button", { class: "btn ghost small", onClick: () => adjustTimer(15) }, "+15s"),
  ]);

  const presets = h("div", { class: "timer-presets" },
    [30, 60, 90, 120, 180].map((s) =>
      h("button", { class: "btn secondary small", onClick: () => { timer.primeAudio(); timer.set(s); timer.start(); renderTimer(); } }, formatTime(s)),
    ),
  );

  root.append(
    display,
    barWrap,
    controls,
    adjust,
    h("p", { class: "muted center", text: "Preset rapidi" }),
    presets,
  );
  renderTimer();
}

function adjustTimer(delta) {
  const base = timer.running
    ? Math.max(0, Math.round((timer._deadline - Date.now()) / 1000))
    : timer.remaining;
  const wasRunning = timer.running;
  timer.set(Math.max(1, base + delta));
  if (wasRunning) timer.start();
  renderTimer();
}

// --- Rendering: MODIFICA -------------------------------------------------
function renderEdit() {
  const root = document.getElementById("view-edit");
  clear(root);
  const state = store.getState();

  root.append(
    h("div", { class: "edit-head" }, [
      h("button", { class: "btn small", onClick: () => { store.addWorkout("Nuova giornata"); renderEdit(); } }, "+ Giornata"),
      h("button", { class: "btn ghost small", onClick: onReset }, "Ripristina esempio"),
    ]),
  );

  if (!state.workouts.length) {
    root.append(h("p", { class: "empty" }, "Nessuna giornata. Aggiungine una."));
    return;
  }

  state.workouts.forEach((w) => root.append(renderEditWorkout(w)));
}

function renderEditWorkout(w) {
  const nameInput = h("input", { class: "input title-input", type: "text", value: w.name });
  nameInput.addEventListener("change", () => store.updateWorkout(w.id, { name: nameInput.value.trim() || "Senza nome" }));

  const wrap = h("details", { class: "card edit-workout", open: "" }, [
    h("summary", {}, [
      nameInput,
      h("button", {
        class: "btn ghost small danger",
        onClick: (e) => {
          e.preventDefault();
          if (confirm(`Eliminare la giornata “${w.name}”?`)) { store.deleteWorkout(w.id); renderEdit(); }
        },
      }, "Elimina"),
    ]),
  ]);

  w.exercises.forEach((ex) => wrap.append(renderEditExercise(w, ex)));

  wrap.append(
    h("button", {
      class: "btn secondary small block",
      onClick: () => { store.addExercise(w.id, { name: "Nuovo esercizio" }); renderEdit(); },
    }, "+ Esercizio"),
  );

  return wrap;
}

function renderEditExercise(w, ex) {
  const field = (label, key, type = "text", attrs = {}) => {
    const input = h("input", { class: "input", type, value: ex[key], ...attrs });
    input.addEventListener("change", () => {
      const val = type === "number" ? Number(input.value) : input.value;
      store.updateExercise(w.id, ex.id, { [key]: val });
    });
    return h("label", { class: "field" }, [h("span", { text: label }), input]);
  };

  return h("div", { class: "edit-exercise" }, [
    field("Esercizio", "name"),
    h("div", { class: "field-row" }, [
      field("Serie", "sets", "number", { min: "0" }),
      field("Ripetizioni", "reps"),
    ]),
    h("div", { class: "field-row" }, [
      field("Recupero (s)", "restSeconds", "number", { min: "0", step: "5" }),
      field("Peso", "weight"),
    ]),
    field("Note", "notes"),
    h("button", {
      class: "btn ghost small danger",
      onClick: () => { if (confirm(`Eliminare “${ex.name}”?`)) { store.deleteExercise(w.id, ex.id); renderEdit(); } },
    }, "Elimina esercizio"),
  ]);
}

function onReset() {
  if (!confirm("Ripristinare la scheda di esempio? Le tue modifiche andranno perse.")) return;
  store.resetToDefault();
  ui.activeWorkoutId = null;
  ui.session = {};
  renderEdit();
}

// --- Render dispatcher ---------------------------------------------------
function render() {
  if (ui.view === "scheda") renderScheda();
  else if (ui.view === "edit") renderEdit();
  // la vista timer è costruita una volta e aggiornata via renderTimer()
}

// --- Avvio ---------------------------------------------------------------
function init() {
  document.getElementById("nav-scheda").addEventListener("click", () => setView("scheda"));
  document.getElementById("nav-timer").addEventListener("click", () => setView("timer"));
  document.getElementById("nav-edit").addEventListener("click", () => setView("edit"));

  buildTimerView();
  setView("scheda");

  // Registrazione service worker (PWA / offline)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => console.warn("SW non registrato:", err));
    });
  }
}

init();
