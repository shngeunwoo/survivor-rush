let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxOn = localStorage.getItem('vs-sfx') !== '0';
let musicOn = localStorage.getItem('vs-music') !== '0';
const lastPlayed: Record<string, number> = {};

function ac(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
    sfxBus = ctx.createGain();
    sfxBus.gain.value = sfxOn ? 1 : 0;
    sfxBus.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = musicOn ? 1 : 0;
    musicBus.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(key: string, minGap: number, freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0) {
  if (!sfxOn) return;
  const a = ac();
  if (!a || !sfxBus) return;
  const now = a.currentTime + delay;
  if (minGap > 0 && lastPlayed[key] !== undefined && now - lastPlayed[key] < minGap) return;
  lastPlayed[key] = now;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain).connect(sfxBus);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function noise(key: string, minGap: number, dur: number, vol: number, freq: number) {
  if (!sfxOn) return;
  const a = ac();
  if (!a || !sfxBus) return;
  const now = a.currentTime;
  if (lastPlayed[key] !== undefined && now - lastPlayed[key] < minGap) return;
  lastPlayed[key] = now;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq;
  const gain = a.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(sfxBus);
  src.start(now);
}

export const sfx = {
  hit: () => tone('hit', 0.045, 260, 0.05, 'square', 0.025, 120),
  crit: () => tone('crit', 0.08, 900, 0.08, 'square', 0.03, 300),
  kill: () => noise('kill', 0.035, 0.08, 0.08, 1800),
  pickup: () => tone('pickup', 0.025, 1100 + Math.random() * 300, 0.06, 'sine', 0.04, 1800),
  coin: () => {
    tone('coin1', 0.05, 1320, 0.06, 'square', 0.025);
    tone('coin2', 0.05, 1760, 0.1, 'square', 0.025, undefined, 0.05);
  },
  hurt: () => {
    tone('hurt', 0.2, 180, 0.2, 'sawtooth', 0.07, 50);
    noise('hurtn', 0.2, 0.15, 0.12, 900);
  },
  zap: () => {
    noise('zap', 0.1, 0.25, 0.14, 4000);
    tone('zapt', 0.1, 1400, 0.12, 'sawtooth', 0.03, 200);
  },
  whip: () => noise('whip', 0.1, 0.09, 0.06, 6000),
  fire: () => noise('fire', 0.2, 0.35, 0.07, 700),
  shoot: () => tone('shoot', 0.06, 700, 0.07, 'triangle', 0.025, 1200),
  boom: () => {
    noise('boom', 0.12, 0.35, 0.16, 500);
    tone('boomt', 0.12, 120, 0.25, 'sine', 0.08, 40);
  },
  ice: () => tone('ice', 0.12, 1800, 0.12, 'triangle', 0.03, 2600),
  beam: () => tone('beam', 0.15, 440, 0.3, 'sawtooth', 0.025, 880),
  levelUp: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(`lv${i}`, 0, f, 0.16, 'square', 0.04, undefined, i * 0.07));
  },
  chest: () => {
    [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(`ch${i}`, 0, f, 0.25, 'triangle', 0.06, undefined, i * 0.09));
  },
  evolve: () => {
    [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => tone(`ev${i}`, 0, f, 0.4, 'sawtooth', 0.03, undefined, i * 0.06));
  },
  boss: () => {
    tone('boss', 1, 90, 1.4, 'sawtooth', 0.1, 40);
    tone('boss2', 1, 135, 1.4, 'sawtooth', 0.06, 60);
  },
  heal: () => tone('heal', 0.1, 600, 0.3, 'sine', 0.07, 1200),
  click: () => tone('click', 0.03, 900, 0.04, 'square', 0.03),
  buy: () => {
    tone('buy1', 0, 880, 0.08, 'square', 0.04);
    tone('buy2', 0, 1320, 0.15, 'square', 0.04, undefined, 0.08);
  },
  gameOver: () => {
    [392, 330, 262, 196].forEach((f, i) => tone(`go${i}`, 0, f, 0.4, 'triangle', 0.07, undefined, i * 0.25));
  },
  victory: () => {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(`vi${i}`, 0, f, 0.3, 'square', 0.04, undefined, i * 0.14));
  },
};

// ---------- music ----------
const BPM = 108;
const STEP = 60 / BPM / 2;
// A minor → F → G → E, one bar each, eighth-note arpeggios over a pulsing bass
const PROGRESSION = [
  { bass: 55, arp: [220, 261.6, 329.6, 440, 329.6, 261.6, 220, 261.6] },
  { bass: 43.65, arp: [174.6, 220, 261.6, 349.2, 261.6, 220, 174.6, 220] },
  { bass: 49, arp: [196, 246.9, 293.7, 392, 293.7, 246.9, 196, 246.9] },
  { bass: 41.2, arp: [164.8, 207.7, 246.9, 329.6, 246.9, 207.7, 164.8, 207.7] },
];
const LEAD = [0, 0, 659, 0, 587, 0, 523, 494, 0, 0, 523, 0, 440, 0, 0, 0, 0, 0, 494, 0, 523, 0, 587, 659, 0, 0, 0, 0, 659, 0, 622, 0];

let musicTimer: number | null = null;
let nextTime = 0;
let step = 0;
let intensity = 0;

function note(freq: number, t: number, dur: number, type: OscillatorType, vol: number) {
  if (!ctx || !musicBus) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(musicBus);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function kick(t: number) {
  if (!ctx || !musicBus) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.frequency.setValueAtTime(140, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  osc.connect(g).connect(musicBus);
  osc.start(t);
  osc.stop(t + 0.2);
}

function schedule() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + 0.2) {
    const bar = PROGRESSION[Math.floor(step / 8) % PROGRESSION.length];
    const s = step % 8;
    if (s % 4 === 0) note(bar.bass, nextTime, STEP * 3.5, 'triangle', 0.11);
    if (s % 2 === 0 && intensity > 0) kick(nextTime);
    note(bar.arp[s], nextTime, STEP * 0.9, 'square', 0.014);
    if (intensity > 1) {
      const lead = LEAD[step % LEAD.length];
      if (lead) note(lead, nextTime, STEP * 1.8, 'sawtooth', 0.012);
    }
    nextTime += STEP;
    step++;
  }
}

export function startMusic() {
  const a = ac();
  if (!a) return;
  if (musicTimer !== null) return;
  nextTime = a.currentTime + 0.1;
  step = 0;
  musicTimer = window.setInterval(schedule, 50);
}

export function stopMusic() {
  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function setIntensity(level: number) {
  intensity = level;
}

export function isSfxOn() {
  return sfxOn;
}
export function isMusicOn() {
  return musicOn;
}
export function setSfx(v: boolean) {
  sfxOn = v;
  localStorage.setItem('vs-sfx', v ? '1' : '0');
  if (sfxBus) sfxBus.gain.value = v ? 1 : 0;
}
export function setMusic(v: boolean) {
  musicOn = v;
  localStorage.setItem('vs-music', v ? '1' : '0');
  if (musicBus) musicBus.gain.value = v ? 1 : 0;
}
export function unlockAudio() {
  ac();
}
