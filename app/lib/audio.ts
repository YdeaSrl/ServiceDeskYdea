'use client';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext();
  }
  return ctx;
}

function beep(frequency: number, duration: number, volume = 0.25): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audioCtx = getCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
      osc.onended = () => resolve();
    } catch {
      resolve();
    }
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export async function playUrgentAlert(): Promise<void> {
  await beep(880, 0.25);
  await delay(80);
  await beep(880, 0.25);
  await delay(80);
  await beep(1100, 0.5);
}

export async function playNewTicketSound(): Promise<void> {
  await beep(660, 0.3);
  await delay(120);
  await beep(880, 0.4);
}
