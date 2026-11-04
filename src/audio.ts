let ctx: AudioContext | null = null;
let muted = localStorage.getItem('vs-muted') === '1';
const lastPlayed: Record<string, number> = {};

function ac(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(key: string, minGap: number, freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
  const a = ac();
  if (!a) return;
  const now = a.currentTime;
  if (lastPlayed[key] !== undefined && now - lastPlayed[key] < minGap) return;
  lastPlayed[key] = now;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(now);
  osc.stop(now + dur);
}

export const sfx = {
  hit: () => tone('hit', 0.05, 220, 0.06, 'square', 0.03, 110),
  kill: () => tone('kill', 0.04, 520, 0.08, 'triangle', 0.04, 180),
  pickup: () => tone('pickup', 0.03, 880 + Math.random() * 200, 0.07, 'sine', 0.05, 1400),
  hurt: () => tone('hurt', 0.25, 160, 0.18, 'sawtooth', 0.06, 60),
  zap: () => tone('zap', 0.1, 1200, 0.15, 'sawtooth', 0.04, 200),
  levelUp: () => {
    tone('lv1', 0, 523, 0.12, 'triangle', 0.08);
    setTimeout(() => tone('lv2', 0, 659, 0.12, 'triangle', 0.08), 90);
    setTimeout(() => tone('lv3', 0, 784, 0.2, 'triangle', 0.08), 180);
  },
  boss: () => tone('boss', 1, 90, 1.2, 'sawtooth', 0.09, 45),
  heal: () => tone('heal', 0.1, 600, 0.25, 'sine', 0.07, 1000),
};

export function isMuted() {
  return muted;
}

export function setMuted(v: boolean) {
  muted = v;
  localStorage.setItem('vs-muted', v ? '1' : '0');
}
