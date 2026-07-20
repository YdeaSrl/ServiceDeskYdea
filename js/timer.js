// Timer di recupero: countdown con start/pausa/reset.
// A fine tempo emette un beep (Web Audio API) e una vibrazione (dove supportata).

export class RestTimer {
  constructor({ onTick, onEnd } = {}) {
    this.onTick = onTick || (() => {});
    this.onEnd = onEnd || (() => {});
    this.total = 60;
    this.remaining = 60;
    this.running = false;
    this._intervalId = null;
    this._deadline = 0; // timestamp di fine (per non accumulare drift)
    this._audioCtx = null;
  }

  // Imposta la durata (in secondi) e azzera lo stato.
  set(seconds) {
    this.stop();
    this.total = Math.max(1, Math.round(seconds) || 1);
    this.remaining = this.total;
    this.onTick(this.remaining, this.total);
  }

  start() {
    if (this.running || this.remaining <= 0) return;
    this.running = true;
    this._deadline = Date.now() + this.remaining * 1000;
    this._intervalId = setInterval(() => this._step(), 200);
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    clearInterval(this._intervalId);
    this._intervalId = null;
    // fissa il residuo al valore corrente
    this.remaining = Math.max(0, Math.round((this._deadline - Date.now()) / 1000));
    this.onTick(this.remaining, this.total);
  }

  toggle() {
    this.running ? this.pause() : this.start();
  }

  reset() {
    this.stop();
    this.remaining = this.total;
    this.onTick(this.remaining, this.total);
  }

  stop() {
    this.running = false;
    if (this._intervalId) clearInterval(this._intervalId);
    this._intervalId = null;
  }

  _step() {
    const rem = Math.max(0, Math.round((this._deadline - Date.now()) / 1000));
    if (rem !== this.remaining) {
      this.remaining = rem;
      this.onTick(this.remaining, this.total);
    }
    if (rem <= 0) {
      this.stop();
      this._signalEnd();
      this.onEnd();
    }
  }

  // Segnale acustico + vibrazione a fine countdown.
  _signalEnd() {
    try {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch (_) {}
    this.beep();
  }

  // Beep sintetizzato con Web Audio (nessun file audio esterno).
  beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this._audioCtx) this._audioCtx = new Ctx();
      const ctx = this._audioCtx;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      // due brevi bip
      [0, 0.25].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.3, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.2);
      });
    } catch (_) {}
  }

  // "Sblocca" l'audio dopo un'interazione utente (richiesto dai browser).
  primeAudio() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this._audioCtx) this._audioCtx = new Ctx();
      if (this._audioCtx.state === "suspended") this._audioCtx.resume();
    } catch (_) {}
  }
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
