import { setIntensity, sfx } from './audio';
import { heroSprite, sprites, type Sprite } from './sprites';
import {
  LIMIT_BONUS,
  PASSIVES,
  RELICS,
  SYNERGIES,
  WEAPONS,
  fusableRelics,
  rollChoices,
  synergyReady,
  xpForLevel,
  type CharacterDef,
  type Choice,
  type MetaId,
  type PassiveId,
  type RelicId,
  type WeaponId,
} from './upgrades';

type EnemyKind = 'bat' | 'zombie' | 'skeleton' | 'ghost' | 'witch' | 'slime' | 'slimeling' | 'knight' | 'golem' | 'reaper';

interface EnemyDef {
  r: number;
  hp: number;
  speed: number;
  dmg: number;
  xp: number;
  knock: number;
  color: string;
}

const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  bat: { r: 11, hp: 6, speed: 92, dmg: 3, xp: 1, knock: 1, color: '#7a4fb0' },
  zombie: { r: 14, hp: 20, speed: 50, dmg: 6, xp: 2, knock: 0.8, color: '#6e9a55' },
  skeleton: { r: 13, hp: 34, speed: 74, dmg: 10, xp: 3, knock: 0.9, color: '#e8e2d0' },
  ghost: { r: 13, hp: 26, speed: 128, dmg: 8, xp: 3, knock: 1.2, color: '#cdeef8' },
  witch: { r: 13, hp: 40, speed: 62, dmg: 6, xp: 5, knock: 0.8, color: '#b070ff' },
  slime: { r: 15, hp: 30, speed: 58, dmg: 7, xp: 2, knock: 0.9, color: '#5adf8a' },
  slimeling: { r: 9, hp: 9, speed: 92, dmg: 4, xp: 1, knock: 1.1, color: '#5adf8a' },
  knight: { r: 15, hp: 95, speed: 52, dmg: 14, xp: 6, knock: 0.3, color: '#8a94a8' },
  golem: { r: 28, hp: 320, speed: 46, dmg: 15, xp: 25, knock: 0.15, color: '#b0a090' },
  reaper: { r: 34, hp: 3000, speed: 76, dmg: 25, xp: 150, knock: 0, color: '#ff2a3d' },
};

interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  r: number;
  hp: number;
  maxHp: number;
  speed: number;
  dmg: number;
  xp: number;
  flash: number;
  kx: number;
  ky: number;
  hitAt: Record<string, number>;
  dead: boolean;
  anim: number;
  face: number;
  shoot: number;
  slow: number;
  frozen: number;
  dash: number;
  dx: number;
  dy: number;
}

interface Projectile {
  kind: 'orb' | 'axe' | 'cross' | 'ice' | 'wisp';
  src: WeaponId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  pierce: number;
  life: number;
  hit: Set<number>;
  evo: boolean;
  age: number;
  grav: number;
  turn: number;
  dirX: number;
  dirY: number;
  speed0: number;
  span: number;
  turned: boolean;
  spin: number;
  target: Enemy | null;
  retarget: number;
}

interface Bomb {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  t: number;
  dur: number;
  r: number;
  dmg: number;
  evo: boolean;
  mini: boolean;
}

interface EnemyShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  life: number;
}

interface Zone {
  x: number;
  y: number;
  r: number;
  dps: number;
  life: number;
  maxLife: number;
  tick: number;
  evo: boolean;
}

type PickupKind = 'gem' | 'coin' | 'heal' | 'magnet' | 'chest';

interface Pickup {
  x: number;
  y: number;
  kind: PickupKind;
  value: number;
  vacuum: boolean;
  speed: number;
  bob: number;
  taken: boolean;
}

interface FloatText {
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  max: number;
  color: string;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  grav: number;
  glow: boolean;
}

interface Decal {
  x: number;
  y: number;
  r: number;
  life: number;
  seed: number;
}

interface Fx {
  kind: 'bolt' | 'slash' | 'ring' | 'corpse' | 'nova' | 'beam';
  x: number;
  y: number;
  life: number;
  max: number;
  dir: number;
  len: number;
  r: number;
  color: string;
  seed: number;
  sprite?: HTMLCanvasElement;
  flip?: number;
}

export interface HudState {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpNeed: number;
  time: number;
  kills: number;
  gold: number;
  boss: number;
  weapons: [WeaponId, number, boolean, number][];
  passives: [PassiveId, number][];
  relics: RelicId[];
  synergies: string[];
}

export interface RunResult {
  victory: boolean;
  time: number;
  kills: number;
  level: number;
  gold: number;
  damage: [WeaponId, number][];
}

export interface ChestReward {
  icon: string;
  name: string;
  desc: string;
  color: string;
  evo: boolean;
}

export interface RunConfig {
  character: CharacterDef;
  meta: Record<MetaId, number>;
}

export const VICTORY_TIME = 600;
const MAX_ENEMIES = 420;
const CELL = 64;
const BOSS_TIMES = [180, 360, 540];
const DECOR_CHUNK = 360;

const glowCache = new Map<string, HTMLCanvasElement>();
function glow(color: string): HTMLCanvasElement {
  let c = glowCache.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color.replace(/[\d.]+\)$/, '0.35)'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowCache.set(color, c);
  return c;
}

function hash2(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function buildGround(): HTMLCanvasElement {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const px = 4;
  const base = ['#1a2418', '#1c2719', '#1e291b', '#19221a', '#1b2618'];
  for (let y = 0; y < S / px; y++) {
    for (let x = 0; x < S / px; x++) {
      const h = hash2(x * 7 + 3, y * 13 + 1);
      g.fillStyle = base[Math.floor(h * base.length)];
      g.fillRect(x * px, y * px, px, px);
    }
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(hash2(i, 91) * (S / px)) * px;
    const y = Math.floor(hash2(i, 37) * (S / px)) * px;
    g.fillStyle = hash2(i, 5) > 0.5 ? '#2a3c24' : '#24331f';
    g.fillRect(x, y, px, px * 2);
    g.fillRect(x - px, y + px, px, px);
    g.fillRect(x + px, y, px, px);
  }
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(hash2(i, 191) * (S / px)) * px;
    const y = Math.floor(hash2(i, 137) * (S / px)) * px;
    g.fillStyle = '#262c28';
    g.fillRect(x, y, px * 2, px);
    g.fillStyle = '#1a1f1c';
    g.fillRect(x, y + px, px * 2, px);
  }
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(hash2(i, 311) * (S / px)) * px;
    const y = Math.floor(hash2(i, 277) * (S / px)) * px;
    g.fillStyle = i % 2 ? '#6a3a5a' : '#7a6a3a';
    g.fillRect(x, y, px, px);
  }
  return c;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private light: HTMLCanvasElement;
  private lctx: CanvasRenderingContext2D;
  private groundPattern: CanvasPattern | null = null;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private scale = 1;

  private cfg: RunConfig | null = null;
  private heroSprite: Sprite | null = null;

  private player = this.freshPlayer();
  private cam = { x: 0, y: 0 };
  private shake = 0;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private enemyShots: EnemyShot[] = [];
  private zones: Zone[] = [];
  private bombs: Bomb[] = [];
  private pickups: Pickup[] = [];
  private texts: FloatText[] = [];
  private particles: Particle[] = [];
  private decals: Decal[] = [];
  private fx: Fx[] = [];
  private grid = new Map<number, Enemy[]>();
  private fireflies: { x: number; y: number; p: number }[] = [];

  private weapons = new Map<WeaponId, number>();
  private evolved = new Set<WeaponId>();
  private weaponTimers = new Map<WeaponId, number>();
  private passives = new Map<PassiveId, number>();
  private damageBy = new Map<WeaponId, number>();
  private relics = new Set<RelicId>();
  private limits = new Map<WeaponId, number>();
  private synergies = new Set<string>();

  private time = 0;
  private clock = 0;
  private kills = 0;
  private gold = 0;
  private level = 1;
  private xp = 0;
  private pendingLevelUps = 0;
  private nextId = 1;
  private spawnAcc = 0;
  private nextElite = 40;
  private nextSwarm = 60;
  private swarmIdx = 0;
  private bossIdx = 0;
  private orbitAngle = 0;
  private auraTick = 0;
  private heavenTimer = 3;
  private healBudget = 0;
  private flash = 0;
  private banner: { text: string; sub: string; life: number; color: string } | null = null;
  private revives = 0;
  rerolls = 0;
  private currentChoices: Choice[] = [];

  running = false;
  paused = false;
  private ended = false;

  private keys = new Set<string>();
  private joy: { id: number; ox: number; oy: number; x: number; y: number } | null = null;

  onLevelUp: (choices: Choice[]) => void = () => {};
  onChest: (rewards: ChestReward[]) => void = () => {};
  onEnd: (r: RunResult) => void = () => {};
  onHud: (h: HudState) => void = () => {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D를 지원하지 않는 브라우저입니다.');
    this.ctx = ctx;
    this.light = document.createElement('canvas');
    this.lctx = this.light.getContext('2d')!;
    this.groundPattern = ctx.createPattern(buildGround(), 'repeat');
    for (let i = 0; i < 36; i++) this.fireflies.push({ x: Math.random(), y: Math.random(), p: Math.random() * 10 });
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindInput();
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      this.clock += dt;
      if (this.running && !this.paused) this.update(dt);
      else if (!this.running) this.idle(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private freshPlayer() {
    return { x: 0, y: 0, r: 10, hp: 120, maxHp: 120, facing: 1, dirX: 1, dirY: 0, iframes: 0, hurt: 0, moving: false, step: 0 };
  }

  start(cfg: RunConfig) {
    this.cfg = cfg;
    this.heroSprite = heroSprite(cfg.character.palette);
    this.player = this.freshPlayer();
    this.player.maxHp = this.player.hp = this.maxHpFor(0);
    this.cam = { x: 0, y: 0 };
    this.enemies = [];
    this.projectiles = [];
    this.enemyShots = [];
    this.zones = [];
    this.bombs = [];
    this.pickups = [];
    this.texts = [];
    this.particles = [];
    this.decals = [];
    this.fx = [];
    this.weapons = new Map([[cfg.character.weapon, 1]]);
    this.evolved = new Set();
    this.weaponTimers = new Map();
    this.passives = new Map();
    this.damageBy = new Map();
    this.relics = new Set();
    this.limits = new Map();
    this.synergies = new Set();
    this.heavenTimer = 3;
    this.time = 0;
    this.kills = 0;
    this.gold = 0;
    this.level = 1;
    this.xp = 0;
    this.pendingLevelUps = 0;
    this.spawnAcc = 0;
    this.nextElite = 40;
    this.nextSwarm = 60;
    this.swarmIdx = 0;
    this.bossIdx = 0;
    this.shake = 0;
    this.flash = 0;
    this.revives = cfg.meta.revive;
    this.rerolls = 2 + cfg.meta.reroll;
    this.banner = { text: '살아남아라', sub: '새벽까지 10분', life: 2.6, color: '#ffd36b' };
    this.running = true;
    this.paused = false;
    this.ended = false;
    setIntensity(0);
    this.emitHud();
  }

  stop() {
    this.running = false;
    this.paused = false;
  }

  applyChoice(c: Choice) {
    if (c.kind === 'weapon') {
      this.weapons.set(c.id, c.nextLevel);
      this.checkSynergies();
    } else if (c.kind === 'fuse') {
      this.fuse(c.id);
    } else if (c.kind === 'limit') {
      this.limits.set(c.id, c.nextLevel);
    } else if (c.kind === 'passive') {
      this.passives.set(c.id, c.nextLevel);
      if (c.id === 'vitality') this.refreshMaxHp(20);
    } else if (c.kind === 'heal') {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);
    } else {
      this.gold += 25;
    }
    this.pendingLevelUps--;
    this.emitHud();
    if (this.pendingLevelUps > 0) this.offerLevelUp();
    else this.paused = false;
  }

  reroll() {
    if (this.rerolls <= 0 || this.pendingLevelUps <= 0) return;
    this.rerolls--;
    this.currentChoices = rollChoices(this.weapons, this.passives, this.relics, this.limits);
    this.onLevelUp(this.currentChoices);
  }

  private fuse(id: RelicId) {
    this.relics.add(id);
    if (id === 'phoenix') this.revives++;
    this.banner = { text: '유물 합성!', sub: RELICS[id].name, life: 2.4, color: RELICS[id].color };
    this.flash = 0.4;
    sfx.evolve();
  }

  private checkSynergies() {
    for (const syn of SYNERGIES) {
      if (this.synergies.has(syn.id)) continue;
      if (synergyReady(syn, this.weapons)) {
        this.synergies.add(syn.id);
        const triple = syn.parts.length === 3;
        this.banner = { text: `${triple ? '삼중 공명' : '공명'} · ${syn.name}`, sub: syn.lore, life: triple ? 3.4 : 2.8, color: triple ? '#ffd36b' : '#7cc8ff' };
        this.flash = 0.4;
        sfx.evolve();
      }
    }
  }

  closeChest() {
    if (this.pendingLevelUps > 0) this.offerLevelUp();
    else this.paused = false;
  }

  setPaused(p: boolean) {
    if (!this.running || this.pendingLevelUps > 0) return;
    this.paused = p;
  }

  get build() {
    return { weapons: this.weapons, passives: this.passives, relics: this.relics, synergies: this.synergies, limits: this.limits, evolved: this.evolved };
  }

  get stats() {
    return [
      ['최대 체력', `${Math.round(this.player.maxHp)}`],
      ['피해량', `${Math.round(this.might * 100)}%`],
      ['치명타', `${Math.round(this.critChance * 100)}% · ${this.critMult}배`],
      ['재사용 대기', `${Math.round(this.cdMult * 100)}%`],
      ['공격 범위', `${Math.round(this.areaMult * 100)}%`],
      ['이동 속도', `${Math.round((this.moveSpeed / 165) * 100)}%`],
      ['방어', `${this.armor}`],
      ['회복', `${this.regen.toFixed(1)}/초`],
      ['지속시간', `${Math.round(this.durMult * 100)}%`],
      ['경험치', `${Math.round(this.xpMult * 100)}%`],
      ['획득 범위', `${Math.round(this.magnet)}`],
    ];
  }

  // ---------- stats ----------
  private pl(id: PassiveId) {
    return this.passives.get(id) ?? 0;
  }
  private meta(id: MetaId) {
    return this.cfg?.meta[id] ?? 0;
  }
  private get ch() {
    return this.cfg!.character;
  }
  private maxHpFor(vit: number) {
    return 120 + this.ch.maxHp + this.meta('hp') * 10 + 20 * vit;
  }
  private refreshMaxHp(heal: number) {
    this.player.maxHp = this.maxHpFor(this.pl('vitality'));
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
  }
  private get might() {
    return (1 + 0.1 * this.pl('might')) * (1 + 0.05 * this.meta('might')) * this.ch.might;
  }
  private get cdMult() {
    return (1 - 0.08 * this.pl('haste')) * this.ch.cd * (this.relics.has('hourglass') ? 0.85 : 1);
  }
  private get areaMult() {
    return (1 + 0.1 * this.pl('area')) * (this.relics.has('compass') ? 1.2 : 1) * (this.relics.has('eclipse') ? 1.1 : 1);
  }
  private get moveSpeed() {
    return 165 * (1 + 0.1 * this.pl('speed')) * (1 + 0.04 * this.meta('speed')) * this.ch.speed * (this.relics.has('gale') ? 1.15 : 1) * (this.relics.has('gambler') ? 1.1 : 1);
  }
  private get magnet() {
    return 70 * (1 + 0.3 * this.pl('magnet')) * (1 + 0.15 * this.meta('magnet')) * (this.relics.has('compass') ? 2 : 1);
  }
  private get armor() {
    return this.pl('armor') + this.ch.armor + (this.relics.has('gale') ? 2 : 0);
  }
  private get regen() {
    return 0.4 * this.pl('regen') + (this.relics.has('phoenix') ? 2 : 0);
  }
  private get amount() {
    return this.pl('amount') + (this.relics.has('hourglass') ? 1 : 0);
  }
  private get critChance() {
    return 0.08 + 0.04 * this.pl('luck') + (this.relics.has('berserk') ? 0.1 : 0) + (this.relics.has('gambler') ? 0.08 : 0);
  }
  private get durMult() {
    return (1 + 0.12 * this.pl('duration')) * (this.relics.has('eclipse') ? 1.3 : 1);
  }
  private get xpMult() {
    return (1 + 0.08 * this.pl('wisdom') + 0.08 * this.meta('growth')) * (this.relics.has('sage') ? 1.25 : 1);
  }
  private get goldMult() {
    return (1 + 0.15 * this.meta('gold')) * (this.relics.has('sage') ? 1.25 : 1);
  }
  private get critMult() {
    return this.relics.has('berserk') ? 3 : 2;
  }
  private weaponMult(id: WeaponId) {
    let m = 1 + LIMIT_BONUS * (this.limits.get(id) ?? 0);
    if (id === 'aura' && this.synergies.has('purgatory')) m *= 1.5;
    if (id === 'whip' && this.synergies.has('bladestorm')) m *= 1.3;
    if ((id === 'axe' || id === 'cross') && this.synergies.has('crusade')) m *= 1.4;
    if (id === 'spirit' && this.synergies.has('ghostfire')) m *= 1.4;
    if ((id === 'fire' || id === 'frost' || id === 'lightning') && this.synergies.has('elements')) m *= 1.4;
    if ((id === 'orbit' || id === 'axe' || id === 'whip') && this.synergies.has('armory')) m *= 1.35;
    return m;
  }

  // ---------- input ----------
  private bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.joy || !this.running) return;
      this.canvas.setPointerCapture(e.pointerId);
      this.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (this.joy && this.joy.id === e.pointerId) {
        this.joy.x = e.clientX;
        this.joy.y = e.clientY;
      }
    });
    const end = (e: PointerEvent) => {
      if (this.joy && this.joy.id === e.pointerId) this.joy = null;
    };
    this.canvas.addEventListener('pointerup', end);
    this.canvas.addEventListener('pointercancel', end);
  }

  private readMove(): [number, number] {
    let x = 0;
    let y = 0;
    const k = this.keys;
    if (k.has('a') || k.has('arrowleft') || k.has('ㅁ')) x -= 1;
    if (k.has('d') || k.has('arrowright') || k.has('ㅇ')) x += 1;
    if (k.has('w') || k.has('arrowup') || k.has('ㅈ')) y -= 1;
    if (k.has('s') || k.has('arrowdown') || k.has('ㄴ')) y += 1;
    if (this.joy) {
      const dx = this.joy.x - this.joy.ox;
      const dy = this.joy.y - this.joy.oy;
      const d = Math.hypot(dx, dy);
      if (d > 8) {
        const m = Math.min(1, d / 50);
        return [(dx / d) * m, (dy / d) * m];
      }
    }
    const len = Math.hypot(x, y);
    return len > 0 ? [x / len, y / len] : [0, 0];
  }

  // ---------- update ----------
  private idle(dt: number) {
    this.cam.x += 22 * dt;
    this.cam.y += 8 * dt;
    this.player.x = this.cam.x;
    this.player.y = this.cam.y;
    this.updateParticles(dt);
  }

  private update(dt: number) {
    this.time += dt;
    const p = this.player;

    const [mx, my] = this.readMove();
    p.moving = mx !== 0 || my !== 0;
    if (p.moving) {
      p.x += mx * this.moveSpeed * dt;
      p.y += my * this.moveSpeed * dt;
      const l = Math.hypot(mx, my);
      p.dirX = mx / l;
      p.dirY = my / l;
      if (Math.abs(mx) > 0.15) p.facing = mx > 0 ? 1 : -1;
      p.step += dt * 9;
      if (Math.random() < dt * 8) this.dust(p.x, p.y + 18);
    }
    p.iframes = Math.max(0, p.iframes - dt);
    p.hurt = Math.max(0, p.hurt - dt);
    p.hp = Math.min(p.maxHp, p.hp + this.regen * dt);
    this.healBudget = Math.min(8, this.healBudget + dt * 8);

    this.cam.x += (p.x - this.cam.x) * Math.min(1, dt * 10);
    this.cam.y += (p.y - this.cam.y) * Math.min(1, dt * 10);
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt * 3);

    this.spawn(dt);
    this.buildGrid();
    this.updateEnemies(dt);
    this.updateWeapons(dt);
    this.updateProjectiles(dt);
    this.updateEnemyShots(dt);
    this.updateZones(dt);
    this.updateBombs(dt);
    this.updatePickups(dt);
    this.updateParticles(dt);

    for (const t of this.texts) {
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy *= 0.92;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const f of this.fx) f.life -= dt;
    this.fx = this.fx.filter((f) => f.life > 0);
    for (const d of this.decals) d.life -= dt;
    this.decals = this.decals.filter((d) => d.life > 0);
    if (this.banner) {
      this.banner.life -= dt;
      if (this.banner.life <= 0) this.banner = null;
    }
    this.enemies = this.enemies.filter((e) => !e.dead);

    if (p.hp <= 0) {
      if (this.revives > 0) {
        this.revive();
      } else {
        p.hp = 0;
        this.finish(false);
        return;
      }
    }
    if (this.time >= VICTORY_TIME) {
      this.finish(true);
      return;
    }
    if (this.pendingLevelUps > 0 && !this.paused) this.offerLevelUp();
    this.emitHud();
  }

  private revive() {
    const p = this.player;
    this.revives--;
    p.hp = p.maxHp * 0.6;
    p.iframes = 2.5;
    this.nova(p.x, p.y, 320, 9999, '#ffe9a0');
    this.banner = { text: '부활!', sub: '빛이 당신을 다시 일으켰다', life: 2.4, color: '#ffe9a0' };
    sfx.evolve();
  }

  private nova(x: number, y: number, r: number, dmg: number, color: string) {
    this.query(x, y, r, (e) => {
      if (e.kind === 'reaper') this.hitEnemy(e, 300, x, y, 0, null);
      else this.hitEnemy(e, dmg, x, y, 600, null);
    });
    this.fx.push({ kind: 'nova', x, y, life: 0.6, max: 0.6, dir: 0, len: 0, r, color, seed: 0 });
    this.shake = 14;
    this.flash = 0.6;
  }

  private finish(victory: boolean) {
    if (this.ended) return;
    this.ended = true;
    this.running = false;
    this.joy = null;
    this.emitHud();
    if (victory) sfx.victory();
    else sfx.gameOver();
    const goldMult = this.goldMult;
    this.onEnd({
      victory,
      time: this.time,
      kills: this.kills,
      level: this.level,
      gold: Math.round(this.gold * goldMult) + (victory ? 300 : 0),
      damage: [...this.damageBy.entries()].sort((a, b) => b[1] - a[1]),
    });
  }

  private offerLevelUp() {
    this.paused = true;
    sfx.levelUp();
    this.currentChoices = rollChoices(this.weapons, this.passives, this.relics, this.limits);
    this.onLevelUp(this.currentChoices);
  }

  private emitHud() {
    const boss = this.enemies.find((e) => e.kind === 'reaper' && !e.dead);
    this.onHud({
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      level: this.level,
      xp: this.xp,
      xpNeed: xpForLevel(this.level),
      time: this.time,
      kills: this.kills,
      gold: Math.round(this.gold * this.goldMult),
      boss: boss ? boss.hp / boss.maxHp : -1,
      weapons: [...this.weapons.entries()].map(([id, lv]) => [id, lv, this.evolved.has(id), this.limits.get(id) ?? 0]),
      passives: [...this.passives.entries()],
      relics: [...this.relics],
      synergies: [...this.synergies],
    });
  }

  private get viewW() {
    return this.w / this.scale;
  }
  private get viewH() {
    return this.h / this.scale;
  }

  private pickKind(): EnemyKind {
    const t = this.time;
    const r = Math.random();
    if (t < 50) return r < 0.75 ? 'bat' : 'zombie';
    if (t < 120) return r < 0.35 ? 'bat' : r < 0.65 ? 'zombie' : r < 0.85 ? 'slime' : 'skeleton';
    if (t < 240) return r < 0.2 ? 'bat' : r < 0.4 ? 'zombie' : r < 0.55 ? 'slime' : r < 0.8 ? 'skeleton' : r < 0.92 ? 'ghost' : 'witch';
    if (t < 400) return r < 0.12 ? 'bat' : r < 0.27 ? 'zombie' : r < 0.4 ? 'slime' : r < 0.58 ? 'skeleton' : r < 0.75 ? 'ghost' : r < 0.86 ? 'witch' : 'knight';
    return r < 0.08 ? 'bat' : r < 0.2 ? 'zombie' : r < 0.32 ? 'slime' : r < 0.5 ? 'skeleton' : r < 0.68 ? 'ghost' : r < 0.8 ? 'witch' : 'knight';
  }

  private spawnPos(): [number, number] {
    const p = this.player;
    let a = Math.random() * Math.PI * 2;
    // bias spawns toward the direction of travel so running away isn't free
    if (p.moving && Math.random() < 0.5) a = Math.atan2(p.dirY, p.dirX) + (Math.random() - 0.5) * 1.6;
    const d = Math.hypot(this.viewW, this.viewH) / 2 + 40;
    return [p.x + Math.cos(a) * d, p.y + Math.sin(a) * d];
  }

  private spawnEnemy(kind: EnemyKind, x?: number, y?: number): Enemy {
    const def = ENEMY_DEFS[kind];
    const [sx, sy] = x !== undefined && y !== undefined ? [x, y] : this.spawnPos();
    const hpScale = 1 + (this.time / 60) * 0.38 + Math.pow(this.time / 300, 2) * 0.6;
    const hp = def.hp * hpScale;
    const e: Enemy = {
      id: this.nextId++,
      kind,
      x: sx,
      y: sy,
      r: def.r,
      hp,
      maxHp: hp,
      speed: def.speed * (0.9 + Math.random() * 0.2),
      dmg: def.dmg * (1 + this.time / 300),
      xp: def.xp,
      flash: 0,
      kx: 0,
      ky: 0,
      hitAt: {},
      dead: false,
      anim: Math.random() * 10,
      face: 1,
      shoot: 1 + Math.random() * 2,
      slow: 0,
      frozen: 0,
      dash: 0,
      dx: 0,
      dy: 0,
    };
    this.enemies.push(e);
    return e;
  }

  private spawn(dt: number) {
    const t = this.time;
    const rate = Math.min(15, 0.6 + t / 20 + Math.pow(t / 190, 2));
    this.spawnAcc += dt * rate;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (this.enemies.length < MAX_ENEMIES) this.spawnEnemy(this.pickKind());
    }

    if (t >= this.nextElite) {
      this.nextElite += 40;
      this.spawnEnemy('golem');
    }

    if (t >= this.nextSwarm) {
      this.nextSwarm += 60;
      const kinds: EnemyKind[] = ['bat', 'skeleton', 'ghost'];
      const kind = kinds[this.swarmIdx % kinds.length];
      this.swarmIdx++;
      const n = (kind === 'bat' ? 30 : 20) + Math.floor(t / 25);
      const d = Math.hypot(this.viewW, this.viewH) / 2 + 20;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.spawnEnemy(kind, this.player.x + Math.cos(a) * d, this.player.y + Math.sin(a) * d);
      }
      const label = { bat: '박쥐 떼가 몰려온다', skeleton: '해골 군단이 포위한다', ghost: '원혼들이 깨어난다' }[kind as 'bat'];
      this.banner = { text: label, sub: '포위망을 뚫어라', life: 2.2, color: '#ff8a7a' };
    }

    if (this.bossIdx < BOSS_TIMES.length && t >= BOSS_TIMES[this.bossIdx]) {
      this.bossIdx++;
      const boss = this.spawnEnemy('reaper');
      boss.maxHp = boss.hp = ENEMY_DEFS.reaper.hp * this.bossIdx * (1 + t / 240);
      boss.speed = ENEMY_DEFS.reaper.speed + this.bossIdx * 8;
      this.banner = { text: '죽음의 사신', sub: `${this.bossIdx}번째 심판이 다가온다`, life: 3, color: '#ff4a5a' };
      this.shake = 12;
      sfx.boss();
      setIntensity(2);
    } else if (t > 60 && this.bossIdx === 0) {
      setIntensity(1);
    }
  }

  private key(cx: number, cy: number) {
    return (cx + 32768) * 65536 + (cy + 32768);
  }

  private buildGrid() {
    this.grid.clear();
    for (const e of this.enemies) {
      const k = this.key(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
      const b = this.grid.get(k);
      if (b) b.push(e);
      else this.grid.set(k, [e]);
    }
  }

  private query(x: number, y: number, r: number, fn: (e: Enemy) => void) {
    const pad = r + 40;
    const x0 = Math.floor((x - pad) / CELL);
    const x1 = Math.floor((x + pad) / CELL);
    const y0 = Math.floor((y - pad) / CELL);
    const y1 = Math.floor((y + pad) / CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const b = this.grid.get(this.key(cx, cy));
        if (!b) continue;
        for (const e of b) {
          if (e.dead) continue;
          const dx = e.x - x;
          const dy = e.y - y;
          const rr = r + e.r;
          if (dx * dx + dy * dy <= rr * rr) fn(e);
        }
      }
    }
  }

  private updateEnemies(dt: number) {
    const p = this.player;
    const far = Math.hypot(this.viewW, this.viewH) * 0.85;
    let contact: Enemy | null = null;
    for (const e of this.enemies) {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;

      if (d > far && e.kind !== 'reaper') {
        const [nx, ny] = this.spawnPos();
        e.x = nx;
        e.y = ny;
        continue;
      }

      let speed = e.speed;
      let mx = dx / d;
      let my = dy / d;
      if (e.kind === 'witch') {
        if (d < 230) {
          mx = -my * 0.8 - mx * 0.4;
          my = (dx / d) * 0.8 - my * 0.4;
        }
        e.shoot -= dt;
        if (e.shoot <= 0 && d < 460) {
          e.shoot = 2.6;
          const sp = 170;
          this.enemyShots.push({ x: e.x, y: e.y - 8, vx: (dx / d) * sp, vy: (dy / d) * sp, r: 7, dmg: 7 * (1 + this.time / 400), life: 4 });
        }
      }
      if (e.kind === 'knight') {
        e.shoot -= dt;
        if (e.dash > 0) {
          e.dash -= dt;
          mx = e.dx;
          my = e.dy;
          speed *= 4.2;
        } else if (e.shoot <= 0 && d < 320) {
          e.shoot = 3.5;
          e.dash = 0.45;
          e.dx = dx / d;
          e.dy = dy / d;
        }
      }
      if (e.kind === 'reaper' && d > 500) speed *= 2.2;
      if (e.frozen > this.time) speed = 0;
      else if (e.slow > this.time) speed *= 0.5;

      e.x += mx * speed * dt + e.kx * dt;
      e.y += my * speed * dt + e.ky * dt;
      const decay = Math.pow(0.0008, dt);
      e.kx *= decay;
      e.ky *= decay;
      e.flash = Math.max(0, e.flash - dt);
      e.anim += dt * (e.kind === 'bat' ? 10 : 5);
      if (Math.abs(dx) > 4) e.face = dx > 0 ? 1 : -1;

      if (e.kind !== 'ghost') {
        const bucket = this.grid.get(this.key(Math.floor(e.x / CELL), Math.floor(e.y / CELL)));
        if (bucket) {
          for (const o of bucket) {
            if (o === e || o.kind === 'ghost') continue;
            const ox = e.x - o.x;
            const oy = e.y - o.y;
            const od = Math.hypot(ox, oy);
            const min = (e.r + o.r) * 0.85;
            if (od > 0 && od < min) {
              const push = ((min - od) / od) * 0.5;
              e.x += ox * push;
              e.y += oy * push;
            }
          }
        }
      }

      if (d < e.r + p.r && (!contact || e.dmg > contact.dmg)) contact = e;
    }
    if (contact && p.iframes <= 0) this.damagePlayer(contact.dmg, contact.x, contact.y);
  }

  private damagePlayer(raw: number, fromX: number, fromY: number) {
    const p = this.player;
    const dmg = Math.max(1, raw - this.armor);
    p.hp -= dmg;
    p.iframes = 0.6;
    p.hurt = 0.25;
    this.shake = Math.max(this.shake, 7);
    sfx.hurt();
    this.texts.push({ x: p.x, y: p.y - 30, vy: -60, text: `-${Math.round(dmg)}`, life: 0.8, max: 0.8, color: '#ff4a5a', size: 16 });
    const a = Math.atan2(p.y - fromY, p.x - fromX);
    for (let i = 0; i < 8; i++) {
      const s = 60 + Math.random() * 120;
      const aa = a + (Math.random() - 0.5) * 1.5;
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(aa) * s, vy: Math.sin(aa) * s, life: 0.4, max: 0.4, color: '#ff3a4a', size: 3, grav: 200, glow: false });
    }
  }

  private hitEnemy(e: Enemy, dmg: number, fromX: number, fromY: number, knock: number, src: WeaponId | null) {
    if (e.dead) return;
    const crit = Math.random() < this.critChance;
    const chilled = this.synergies.has('superconduct') && e.slow > this.time ? 1.5 : 1;
    const aura = this.weapons.get('aura');
    const blessed =
      aura && this.synergies.has('sanctuary') && Math.hypot(e.x - this.player.x, e.y - this.player.y) < this.auraRadius(aura, this.evolved.has('aura')) + e.r ? 1.25 : 1;
    const amount = dmg * this.might * (src ? this.weaponMult(src) : 1) * chilled * blessed * (0.9 + Math.random() * 0.2) * (crit ? this.critMult : 1);
    e.hp -= amount;
    e.flash = 0.09;
    if (src) this.damageBy.set(src, (this.damageBy.get(src) ?? 0) + Math.min(amount, e.hp + amount));
    const def = ENEMY_DEFS[e.kind];
    if (def.knock > 0 && knock > 0) {
      const dx = e.x - fromX;
      const dy = e.y - fromY;
      const d = Math.hypot(dx, dy) || 1;
      e.kx += (dx / d) * knock * def.knock;
      e.ky += (dy / d) * knock * def.knock;
    }
    if (this.texts.length < 140) {
      this.texts.push({
        x: e.x + (Math.random() - 0.5) * 14,
        y: e.y - e.r - 4,
        vy: -70,
        text: String(Math.round(amount)),
        life: crit ? 0.8 : 0.55,
        max: crit ? 0.8 : 0.55,
        color: crit ? '#ffd36b' : '#ffffff',
        size: crit ? 18 : 12,
      });
    }
    if (crit) sfx.crit();
    else sfx.hit();
    if (this.particles.length < 700) {
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          x: e.x,
          y: e.y,
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          life: 0.2,
          max: 0.2,
          color: '#ffffff',
          size: 2,
          grav: 0,
          glow: false,
        });
      }
    }
    if (e.hp <= 0) this.killEnemy(e);
  }

  private spriteFor(kind: EnemyKind): Sprite {
    const s = sprites();
    return s[kind];
  }

  private killEnemy(e: Enemy) {
    e.dead = true;
    this.kills++;
    sfx.kill();
    const def = ENEMY_DEFS[e.kind];
    const spr = this.spriteFor(e.kind);
    this.fx.push({ kind: 'corpse', x: e.x, y: e.y, life: 0.18, max: 0.18, dir: 0, len: 0, r: 0, color: '', seed: 0, sprite: spr.white[0], flip: e.face });
    const n = e.kind === 'reaper' ? 60 : e.kind === 'golem' ? 24 : 7;
    for (let i = 0; i < n && this.particles.length < 800; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * (e.kind === 'reaper' ? 400 : 160);
      this.particles.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 40,
        life: 0.5 + Math.random() * 0.3,
        max: 0.8,
        color: Math.random() < 0.6 ? def.color : '#8a1a2a',
        size: 2 + Math.random() * 3,
        grav: 260,
        glow: false,
      });
    }
    if (this.decals.length < 160 && e.kind !== 'ghost') {
      this.decals.push({ x: e.x, y: e.y + e.r * 0.5, r: e.r * (0.6 + Math.random() * 0.5), life: 8, seed: Math.random() * 1000 });
    }

    if (e.kind === 'reaper') {
      this.pickups.push(this.mkPickup(e.x, e.y, 'chest', 3));
      for (let i = 0; i < 12; i++) this.pickups.push(this.mkPickup(e.x + (Math.random() - 0.5) * 80, e.y + (Math.random() - 0.5) * 80, 'coin', 5));
      this.banner = { text: '사신 처치!', sub: '전설의 보물 상자를 획득하세요', life: 3, color: '#ffd36b' };
      this.shake = 18;
      this.flash = 0.8;
      setIntensity(1);
    } else if (e.kind === 'golem') {
      this.pickups.push(this.mkPickup(e.x, e.y, 'chest', 1));
    } else if (e.kind === 'slime' && this.enemies.length < MAX_ENEMIES) {
      for (const off of [-12, 12]) this.spawnEnemy('slimeling', e.x + off, e.y + (Math.random() - 0.5) * 10);
    }
    this.dropGem(e.x, e.y, e.xp);
    const r = Math.random();
    if (r < 0.01) this.pickups.push(this.mkPickup(e.x, e.y, 'heal', 30));
    else if (r < 0.0115) this.pickups.push(this.mkPickup(e.x, e.y, 'magnet', 0));
    else if (r < 0.05) this.pickups.push(this.mkPickup(e.x + 6, e.y, 'coin', 1 + Math.floor(Math.random() * 3)));
  }

  private mkPickup(x: number, y: number, kind: PickupKind, value: number): Pickup {
    return { x, y, kind, value, vacuum: false, speed: 0, bob: Math.random() * 6, taken: false };
  }

  private dropGem(x: number, y: number, value: number) {
    let gems = 0;
    for (const pk of this.pickups) if (pk.kind === 'gem') gems++;
    if (gems > 450) {
      const target = this.pickups.find((pk) => pk.kind === 'gem' && !pk.vacuum);
      if (target) {
        target.value += value;
        return;
      }
    }
    this.pickups.push(this.mkPickup(x, y, 'gem', value));
  }

  private nearestEnemies(n: number, maxDist: number): Enemy[] {
    const p = this.player;
    const list: { e: Enemy; d: number }[] = [];
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
      if (d < maxDist * maxDist) list.push({ e, d });
    }
    list.sort((a, b) => a.d - b.d);
    return list.slice(0, n).map((x) => x.e);
  }

  private tickTimer(id: WeaponId, dt: number, cd: number): boolean {
    const t = (this.weaponTimers.get(id) ?? 0) - dt;
    if (t <= 0) {
      const steel = this.synergies.has('armory') && (id === 'axe' || id === 'whip') ? 0.8 : 1;
      this.weaponTimers.set(id, cd * this.cdMult * steel);
      return true;
    }
    this.weaponTimers.set(id, t);
    return false;
  }

  private lifesteal(amount: number) {
    const take = Math.min(amount, this.healBudget);
    if (take <= 0) return;
    this.healBudget -= take;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + take);
  }

  private orbitParams(lv: number, evo: boolean) {
    const extra = this.amount + (this.synergies.has('bladestorm') ? 4 : 0);
    if (evo) return { count: 8 + extra, dmg: 34, speed: 4.2, radius: 150 * this.areaMult, size: 1.6 };
    return {
      count: [1, 2, 2, 3, 3, 4, 4, 5][lv - 1] + extra,
      dmg: 10 + (lv >= 3 ? 4 : 0) + (lv >= 5 ? 4 : 0) + (lv >= 7 ? 4 : 0),
      speed: 3 + (lv >= 3 ? 0.6 : 0) + (lv >= 7 ? 0.6 : 0),
      radius: (80 + (lv >= 5 ? 20 : 0)) * this.areaMult,
      size: 1,
    };
  }

  private auraRadius(lv: number, evo: boolean) {
    return (60 + 10 * lv + (evo ? 50 : 0)) * this.areaMult * (this.synergies.has('sanctuary') ? 1.2 : 1);
  }

  private updateWeapons(dt: number) {
    const p = this.player;
    const area = this.areaMult;

    const wand = this.weapons.get('wand');
    if (wand) {
      const evo = this.evolved.has('wand');
      const cd = evo ? 0.22 : Math.max(0.35, 1.0 - 0.07 * (wand - 1));
      if (this.tickTimer('wand', dt, cd)) {
        const count = (evo ? 4 : 1 + (wand >= 3 ? 1 : 0) + (wand >= 6 ? 1 : 0)) + this.amount + (this.synergies.has('prism') ? 2 : 0);
        const dmg = 12 + 5 * (Math.min(wand, 2) - 1) + (wand >= 4 ? 5 : 0) + (wand >= 7 ? 5 : 0) + (evo ? 12 : 0);
        const pierce = evo ? 6 : 1 + (wand >= 5 ? 1 : 0) + (wand >= 8 ? 1 : 0);
        const targets = this.nearestEnemies(count, 650);
        for (let i = 0; i < count; i++) {
          const t = targets[i] ?? targets[0];
          let dx = p.dirX;
          let dy = p.dirY;
          if (t) {
            dx = t.x - p.x;
            dy = t.y - p.y;
            const d = Math.hypot(dx, dy) || 1;
            dx /= d;
            dy /= d;
          }
          if (!targets[i] && i > 0) {
            const a = Math.atan2(dy, dx) + (i % 2 ? 0.25 : -0.25) * Math.ceil(i / 2);
            dx = Math.cos(a);
            dy = Math.sin(a);
          }
          this.projectiles.push(
            this.mkProjectile('orb', 'wand', p.x, p.y - 6, dx * (evo ? 620 : 460), dy * (evo ? 620 : 460), (wand >= 8 ? 8 : 6) * area * (evo ? 1.3 : 1), dmg, pierce, 1.6, evo),
          );
        }
        sfx.shoot();
      }
    }

    const aura = this.weapons.get('aura');
    if (aura) {
      const evo = this.evolved.has('aura');
      this.auraTick -= dt;
      if (this.auraTick <= 0) {
        this.auraTick = 0.45;
        const r = this.auraRadius(aura, evo);
        const dmg = (5 + 3 * aura) * (evo ? 1.6 : 1);
        this.query(p.x, p.y, r, (e) => {
          this.hitEnemy(e, dmg, p.x, p.y, 70, 'aura');
          if (evo) this.lifesteal(0.5);
        });
      }
    }

    const orbit = this.weapons.get('orbit');
    if (orbit) {
      const o = this.orbitParams(orbit, this.evolved.has('orbit'));
      this.orbitAngle += o.speed * (this.synergies.has('armory') ? 1.5 : 1) * dt;
      for (let i = 0; i < o.count; i++) {
        const a = this.orbitAngle + (i / o.count) * Math.PI * 2;
        const bx = p.x + Math.cos(a) * o.radius;
        const by = p.y + Math.sin(a) * o.radius;
        this.query(bx, by, 13 * area * o.size, (e) => {
          if ((e.hitAt.orbit ?? -1) > this.time) return;
          e.hitAt.orbit = this.time + 0.35;
          this.hitEnemy(e, o.dmg, p.x, p.y, 240, 'orbit');
        });
      }
    }

    const lightning = this.weapons.get('lightning');
    if (lightning) {
      const evo = this.evolved.has('lightning');
      const cd = evo ? 0.8 : Math.max(0.9, 2.4 - 0.15 * lightning);
      if (this.tickTimer('lightning', dt, cd)) {
        const strikes = 1 + (lightning >= 3 ? 1 : 0) + (lightning >= 5 ? 1 : 0) + (lightning >= 7 ? 1 : 0) + (lightning >= 8 ? 1 : 0) + (evo ? 4 : 0) + this.amount;
        const dmg = (25 + 10 * (lightning - 1)) * (evo ? 1.6 : 1);
        const r = (lightning >= 6 ? 55 : 40) * area * (evo ? 1.4 : 1);
        const vw = this.viewW / 2;
        const vh = this.viewH / 2;
        const visible = this.enemies.filter((e) => !e.dead && Math.abs(e.x - p.x) < vw && Math.abs(e.y - p.y) < vh);
        let struck = 0;
        for (let i = 0; i < strikes && visible.length > 0; i++) {
          const t = visible.splice(Math.floor(Math.random() * visible.length), 1)[0];
          this.strike(t.x, t.y, r, dmg, 'lightning');
          if (this.synergies.has('superconduct')) this.query(t.x, t.y, r, (e) => this.chill(e, 2, 0.5));
          if (this.synergies.has('elements')) {
            this.query(t.x, t.y, r * 1.3, (e) => this.chill(e, 1.5, 0));
            const dur = 1.6 * this.durMult;
            if (this.zones.length < 60) this.zones.push({ x: t.x, y: t.y, r: r * 0.9, dps: 18, life: dur, maxLife: dur, tick: 0, evo: false });
          }
          struck++;
        }
        if (struck) {
          sfx.zap();
          this.shake = Math.max(this.shake, 3);
        }
      }
    }

    const whip = this.weapons.get('whip');
    if (whip) {
      const evo = this.evolved.has('whip');
      const cd = Math.max(0.6, 1.3 - (whip >= 3 ? 0.15 : 0) - (whip >= 6 ? 0.15 : 0)) * (evo ? 0.8 : 1);
      if (this.tickTimer('whip', dt, cd)) {
        const dmg = (15 + 6 * (whip - 1 - (whip >= 4 ? 1 : 0))) * (evo ? 1.7 : 1);
        const len = (140 + (whip >= 2 ? 20 : 0) + (whip >= 5 ? 20 : 0) + (whip >= 7 ? 20 : 0)) * area * (evo ? 1.2 : 1);
        const half = (whip >= 8 ? 34 : 24) * area * (evo ? 1.2 : 1);
        const dirs = whip >= 4 ? [p.facing, -p.facing] : [p.facing];
        dirs.forEach((dir, i) => {
          const y = p.y - 4 + i * 10;
          const x0 = dir > 0 ? p.x : p.x - len;
          const x1 = dir > 0 ? p.x + len : p.x;
          const cx = (x0 + x1) / 2;
          this.query(cx, y, len / 2 + half, (e) => {
            if (e.x + e.r >= x0 && e.x - e.r <= x1 && Math.abs(e.y - y) <= half + e.r) {
              this.hitEnemy(e, dmg, p.x, y, 200, 'whip');
              if (evo) this.lifesteal(1);
            }
          });
          this.fx.push({ kind: 'slash', x: p.x, y, life: 0.2, max: 0.2, dir, len, r: half, color: evo ? '#ff3a5a' : '#ffd8d0', seed: i });
        });
        sfx.whip();
      }
    }

    const fire = this.weapons.get('fire');
    if (fire) {
      const evo = this.evolved.has('fire');
      const cd = fire >= 7 ? 2.4 : 3;
      if (this.tickTimer('fire', dt, cd)) {
        const count = 1 + (fire >= 4 ? 1 : 0) + (fire >= 8 ? 1 : 0) + (evo ? 2 : 0) + this.amount;
        const r = (45 + (fire >= 3 ? 12 : 0) + (fire >= 6 ? 12 : 0)) * area * (evo ? 1.5 : 1);
        const dps = (16 + (fire >= 2 ? 8 : 0) + (fire >= 5 ? 8 : 0) + (fire >= 7 ? 8 : 0)) * (evo ? 1.6 : 1);
        const dur = (2.6 + (fire >= 2 ? 0.5 : 0) + (fire >= 5 ? 0.5 : 0) + (evo ? 1 : 0)) * this.durMult;
        const targets = this.nearestEnemies(14, 400);
        for (let i = 0; i < count; i++) {
          const t = targets.length ? targets[Math.floor(Math.random() * targets.length)] : null;
          const a = Math.random() * Math.PI * 2;
          const x = t ? t.x : p.x + Math.cos(a) * 140;
          const y = t ? t.y : p.y + Math.sin(a) * 140;
          this.zones.push({ x, y, r, dps, life: dur, maxLife: dur, tick: 0, evo });
        }
        sfx.fire();
      }
    }

    const crusade = this.synergies.has('crusade') ? 1.25 : 1;

    const axe = this.weapons.get('axe');
    if (axe) {
      const evo = this.evolved.has('axe');
      if (this.tickTimer('axe', dt, evo ? 1.3 : 1.4)) {
        const dmg = (26 + (axe >= 2 ? 6 : 0) + (axe >= 3 ? 10 : 0) + (axe >= 6 ? 10 : 0) + (axe >= 8 ? 10 : 0)) * (evo ? 1.5 : 1);
        const size = (axe >= 8 ? 1.3 : 1) * (evo ? 1.4 : 1) * area * crusade;
        if (evo) {
          const n = 8 + this.amount * 2;
          const off = this.clock * 1.7;
          for (let i = 0; i < n; i++) {
            const a = off + (i / n) * Math.PI * 2;
            const pr = this.mkProjectile('axe', 'axe', p.x, p.y, Math.cos(a) * 300, Math.sin(a) * 300, 14 * size, dmg, 999, 2.4, true);
            pr.turn = 1.4;
            this.projectiles.push(pr);
          }
        } else {
          const n = 2 + (axe >= 5 ? 1 : 0) + this.amount;
          const pierce = 3 + (axe >= 4 ? 2 : 0) + (axe >= 7 ? 2 : 0);
          for (let i = 0; i < n; i++) {
            const vx = p.facing * 60 + (i - (n - 1) / 2) * 140 + (Math.random() - 0.5) * 40;
            const pr = this.mkProjectile('axe', 'axe', p.x, p.y - 10, vx, -560 - Math.random() * 80, 14 * size, dmg, pierce, 2, false);
            pr.grav = 1100;
            this.projectiles.push(pr);
          }
        }
        sfx.whip();
      }
    }

    const cross = this.weapons.get('cross');
    if (cross) {
      const evo = this.evolved.has('cross');
      if (this.tickTimer('cross', dt, evo ? 1.4 : 1.8)) {
        const dmg = (18 + (cross >= 2 ? 10 : 0) + (cross >= 5 ? 10 : 0) + (cross >= 7 ? 10 : 0)) * (evo ? 1.6 : 1);
        const size = (cross >= 8 ? 1.3 : 1) * (evo ? 1.8 : 1) * area * crusade;
        const speed = cross >= 4 ? 600 : 520;
        const span = cross >= 4 ? 1.6 : 1.4;
        const n = (evo ? 4 : 1 + (cross >= 3 ? 1 : 0) + (cross >= 6 ? 1 : 0)) + this.amount;
        const targets = this.nearestEnemies(n, 600);
        for (let i = 0; i < n; i++) {
          let a: number;
          if (evo) a = this.clock * 0.9 + (i / n) * Math.PI * 2;
          else if (targets[i]) a = Math.atan2(targets[i].y - p.y, targets[i].x - p.x);
          else a = Math.atan2(p.dirY, p.dirX) + (i - (n - 1) / 2) * 0.5;
          this.projectiles.push(this.mkProjectile('cross', 'cross', p.x, p.y - 4, Math.cos(a) * speed, Math.sin(a) * speed, 13 * size, dmg, 999, span * 1.15, evo));
        }
        sfx.shoot();
      }
    }

    const frost = this.weapons.get('frost');
    if (frost) {
      const evo = this.evolved.has('frost');
      if (this.tickTimer('frost', dt, evo ? 1.1 : frost >= 7 ? 1.3 : 1.6)) {
        const n = evo ? 20 : 6 + (frost >= 2 ? 2 : 0) + (frost >= 5 ? 2 : 0) + (frost >= 8 ? 2 : 0) + this.amount * 2;
        const dmg = (8 + (frost >= 3 ? 6 : 0) + (frost >= 6 ? 6 : 0) + (frost >= 8 ? 6 : 0)) * (evo ? 1.5 : 1);
        const pierce = evo ? 3 : 1 + (frost >= 6 ? 1 : 0);
        const off = this.clock * 2.3;
        for (let i = 0; i < n; i++) {
          const a = off + (i / n) * Math.PI * 2;
          this.projectiles.push(this.mkProjectile('ice', 'frost', p.x, p.y - 4, Math.cos(a) * 380, Math.sin(a) * 380, 7 * area * (evo ? 1.3 : 1), dmg, pierce, 0.9 * this.durMult, evo));
        }
        sfx.ice();
      }
    }

    const beam = this.weapons.get('beam');
    if (beam) {
      const evo = this.evolved.has('beam');
      if (this.tickTimer('beam', dt, evo ? 0.45 : beam >= 8 ? 1.8 : 2.2)) {
        const prism = this.synergies.has('prism') ? 2 : 0;
        const dmg = (20 + (beam >= 2 ? 8 : 0) + (beam >= 5 ? 8 : 0) + (beam >= 8 ? 8 : 0)) * (evo ? 0.6 : 1);
        const len = (evo ? 520 : 300 + (beam >= 3 ? 80 : 0)) * area;
        const width = (evo ? 22 : 10 + (beam >= 6 ? 6 : 0)) * area;
        const n = (evo ? 4 : 1 + (beam >= 4 ? 1 : 0) + (beam >= 7 ? 1 : 0)) + prism + this.amount;
        let base: number;
        if (evo) base = this.clock * 1.2;
        else {
          const t = this.nearestEnemies(1, 600)[0];
          base = t ? Math.atan2(t.y - p.y, t.x - p.x) : Math.atan2(p.dirY, p.dirX);
        }
        for (let i = 0; i < n; i++) {
          const a = evo ? base + (i / n) * Math.PI * 2 : base + (i - (n - 1) / 2) * 0.35;
          this.fireBeam(p.x, p.y - 6, a, len, width, dmg, evo);
        }
        if (!evo || Math.floor(this.clock * 2) % 2 === 0) sfx.beam();
      }
    }

    const spirit = this.weapons.get('spirit');
    if (spirit) {
      const evo = this.evolved.has('spirit');
      if (this.tickTimer('spirit', dt, evo ? 0.9 : 1.5)) {
        const n =
          (evo ? 8 : 1 + (spirit >= 2 ? 1 : 0) + (spirit >= 4 ? 1 : 0) + (spirit >= 6 ? 1 : 0) + (spirit >= 8 ? 2 : 0)) +
          this.amount;
        const dmg = (12 + (spirit >= 3 ? 5 : 0) + (spirit >= 7 ? 5 : 0)) * (evo ? 1.4 : 1);
        const pierce = evo ? 2 : 1 + (spirit >= 5 ? 1 : 0);
        const sp = spirit >= 7 || evo ? 320 : 260;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
          this.projectiles.push(this.mkProjectile('wisp', 'spirit', p.x, p.y - 6, Math.cos(a) * sp, Math.sin(a) * sp, 8 * area, dmg, pierce, 3 * this.durMult, evo));
        }
      }
    }

    const bomb = this.weapons.get('bomb');
    if (bomb) {
      const evo = this.evolved.has('bomb');
      if (this.tickTimer('bomb', dt, evo ? 2 : bomb >= 6 ? 2.2 : 2.8)) {
        const n = 1 + (bomb >= 4 ? 1 : 0) + (bomb >= 7 ? 1 : 0) + this.amount;
        const dmg = (30 + (bomb >= 2 ? 12 : 0) + (bomb >= 5 ? 12 : 0) + (bomb >= 8 ? 12 : 0)) * (evo ? 1.4 : 1);
        const r = (60 + (bomb >= 3 ? 15 : 0) + (bomb >= 8 ? 15 : 0)) * area;
        const targets = this.nearestEnemies(10, 450);
        for (let i = 0; i < n; i++) {
          const t = targets.length ? targets[Math.floor(Math.random() * targets.length)] : null;
          const a = Math.random() * Math.PI * 2;
          const tx = t ? t.x : p.x + Math.cos(a) * 160;
          const ty = t ? t.y : p.y + Math.sin(a) * 160;
          this.bombs.push({ sx: p.x, sy: p.y - 10, tx, ty, t: 0, dur: 0.55, r, dmg, evo, mini: false });
        }
        sfx.whip();
      }
    }

    if (this.synergies.has('heaven')) {
      this.heavenTimer -= dt;
      if (this.heavenTimer <= 0) {
        this.heavenTimer = 6;
        const r = 360 * area;
        this.query(p.x, p.y, r, (e) => this.hitEnemy(e, 140, p.x, p.y, 260, null));
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
        this.fx.push({ kind: 'nova', x: p.x, y: p.y, life: 0.7, max: 0.7, dir: 0, len: 0, r, color: '#fff2b0', seed: 0 });
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + this.clock;
          this.fx.push({ kind: 'bolt', x: p.x + Math.cos(a) * r * 0.55, y: p.y + Math.sin(a) * r * 0.55, life: 0.4, max: 0.4, dir: 0, len: 0, r: 40, color: '#fff2b0', seed: Math.random() * 1000 });
        }
        this.texts.push({ x: p.x, y: p.y - 40, vy: -50, text: '+20', life: 0.9, max: 0.9, color: '#7dff9a', size: 15 });
        this.flash = Math.max(this.flash, 0.25);
        this.shake = Math.max(this.shake, 6);
        sfx.zap();
      }
    }
  }

  private chill(e: Enemy, slow: number, freeze: number) {
    e.slow = Math.max(e.slow, this.time + slow * this.durMult);
    if (freeze > 0 && e.kind !== 'reaper') e.frozen = Math.max(e.frozen, this.time + freeze * this.durMult);
  }

  private fireBeam(x: number, y: number, a: number, len: number, width: number, dmg: number, evo: boolean) {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const hit = new Set<number>();
    const step = Math.max(12, width * 1.2);
    for (let d = step / 2; d < len; d += step) {
      this.query(x + ca * d, y + sa * d, width, (e) => {
        if (hit.has(e.id)) return;
        hit.add(e.id);
        this.hitEnemy(e, dmg, x, y, 90, 'beam');
      });
    }
    this.fx.push({ kind: 'beam', x, y, life: evo ? 0.3 : 0.25 * this.durMult, max: evo ? 0.3 : 0.25 * this.durMult, dir: a, len, r: width, color: evo ? '#ffe9a0' : '#fff6c0', seed: 0 });
  }

  private updateBombs(dt: number) {
    const fresh: Bomb[] = [];
    for (const b of this.bombs) {
      b.t += dt;
      if (b.t < b.dur) continue;
      this.query(b.tx, b.ty, b.r, (e) => this.hitEnemy(e, b.dmg, b.tx, b.ty, 300, 'bomb'));
      this.fx.push({ kind: 'nova', x: b.tx, y: b.ty, life: 0.35, max: 0.35, dir: 0, len: 0, r: b.r, color: '#ffb060', seed: 0 });
      for (let k = 0; k < (b.mini ? 8 : 18) && this.particles.length < 800; k++) {
        const a = Math.random() * Math.PI * 2;
        const s = 80 + Math.random() * 260;
        this.particles.push({ x: b.tx, y: b.ty, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.45, max: 0.45, color: Math.random() < 0.5 ? '#ffd060' : '#ff6a30', size: 3 + Math.random() * 3, grav: 0, glow: true });
      }
      if (this.synergies.has('napalm') && !b.mini) {
        const dur = 2 * this.durMult;
        this.zones.push({ x: b.tx, y: b.ty, r: b.r * 0.8, dps: 22, life: dur, maxLife: dur, tick: 0, evo: false });
      }
      if (b.evo && !b.mini) {
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + Math.random();
          const tx = b.tx + Math.cos(a) * b.r * 1.1;
          const ty = b.ty + Math.sin(a) * b.r * 1.1;
          fresh.push({ sx: b.tx, sy: b.ty, tx, ty, t: 0, dur: 0.2, r: b.r * 0.6, dmg: b.dmg * 0.5, evo: true, mini: true });
        }
      }
      this.shake = Math.max(this.shake, b.mini ? 2 : 5);
      sfx.boom();
    }
    this.bombs = this.bombs.filter((b) => b.t < b.dur).concat(fresh);
  }

  private strike(tx: number, ty: number, r: number, dmg: number, src: WeaponId) {
    this.query(tx, ty, r, (e) => this.hitEnemy(e, dmg, tx, ty, 120, src));
    this.fx.push({ kind: 'bolt', x: tx, y: ty, life: 0.28, max: 0.28, dir: 0, len: 0, r, color: '#d9c2ff', seed: Math.random() * 1000 });
    for (let k = 0; k < 10 && this.particles.length < 800; k++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 200;
      this.particles.push({ x: tx, y: ty, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.3, max: 0.3, color: '#e8d8ff', size: 2, grav: 0, glow: true });
    }
  }

  private mkProjectile(
    kind: Projectile['kind'],
    src: WeaponId,
    x: number,
    y: number,
    vx: number,
    vy: number,
    r: number,
    dmg: number,
    pierce: number,
    life: number,
    evo: boolean,
  ): Projectile {
    const sp = Math.hypot(vx, vy) || 1;
    return {
      kind,
      src,
      x,
      y,
      vx,
      vy,
      r,
      dmg,
      pierce,
      life,
      hit: new Set(),
      evo,
      age: 0,
      grav: 0,
      turn: 0,
      dirX: vx / sp,
      dirY: vy / sp,
      speed0: sp,
      span: life,
      turned: false,
      spin: Math.random() * 6,
      target: null,
      retarget: 0,
    };
  }

  private updateProjectiles(dt: number) {
    const storm = this.synergies.has('storm');
    for (const pr of this.projectiles) {
      pr.age += dt;
      pr.spin += dt * (pr.kind === 'orb' ? 0 : 14);
      if (pr.kind === 'axe') {
        pr.vy += pr.grav * dt;
        if (pr.turn) {
          const c = Math.cos(pr.turn * dt);
          const sn = Math.sin(pr.turn * dt);
          const vx = pr.vx * c - pr.vy * sn;
          pr.vy = pr.vx * sn + pr.vy * c;
          pr.vx = vx;
        }
      } else if (pr.kind === 'wisp') {
        pr.retarget -= dt;
        if (!pr.target || pr.target.dead || pr.retarget <= 0) {
          pr.retarget = 0.3;
          let best: Enemy | null = null;
          let bd = Infinity;
          this.query(pr.x, pr.y, 380, (e) => {
            if (pr.hit.has(e.id)) return;
            const d = (e.x - pr.x) ** 2 + (e.y - pr.y) ** 2;
            if (d < bd) {
              bd = d;
              best = e;
            }
          });
          pr.target = best;
        }
        if (pr.age > 0.15 && pr.target) {
          const dx = pr.target.x - pr.x;
          const dy = pr.target.y - pr.y;
          const d = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, dt * 7);
          pr.vx += ((dx / d) * pr.speed0 - pr.vx) * k;
          pr.vy += ((dy / d) * pr.speed0 - pr.vy) * k;
        }
        if (this.particles.length < 700 && Math.random() < 0.5) {
          this.particles.push({ x: pr.x, y: pr.y, vx: 0, vy: -20, life: 0.3, max: 0.3, color: pr.evo ? '#e8ffb0' : '#8aff7a', size: 3, grav: 0, glow: true });
        }
      } else if (pr.kind === 'cross') {
        const f = pr.speed0 * (1 - (2 * pr.age) / pr.span);
        pr.vx = pr.dirX * f;
        pr.vy = pr.dirY * f;
        if (!pr.turned && f < 0) {
          pr.turned = true;
          pr.hit.clear();
        }
      }
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      if (pr.kind === 'orb' && this.particles.length < 700 && Math.random() < 0.6) {
        this.particles.push({ x: pr.x, y: pr.y, vx: 0, vy: 0, life: 0.18, max: 0.18, color: pr.evo ? '#ffe9a0' : '#7cc8ff', size: 3, grav: 0, glow: true });
      }
      if (pr.pierce <= 0) continue;
      this.query(pr.x, pr.y, pr.r, (e) => {
        if (pr.pierce <= 0 || pr.hit.has(e.id)) return;
        pr.hit.add(e.id);
        pr.pierce--;
        this.hitEnemy(e, pr.dmg, pr.x - pr.vx * 0.05, pr.y - pr.vy * 0.05, 150, pr.src);
        if (pr.kind === 'ice') this.chill(e, this.weapons.get('frost')! >= 4 ? 2.5 : 1.5, pr.evo ? 1 : 0);
        if (pr.kind === 'wisp') {
          pr.target = null;
          if (pr.evo) this.lifesteal(0.3);
          if (this.synergies.has('ghostfire') && this.zones.length < 60) {
            const dur = 1.4 * this.durMult;
            this.zones.push({ x: e.x, y: e.y, r: 26 * this.areaMult, dps: 14, life: dur, maxLife: dur, tick: 0, evo: false });
          }
        }
        if (storm && pr.src === 'wand' && Math.random() < 0.25) this.strike(e.x, e.y, 40 * this.areaMult, 30, 'wand');
      });
    }
    this.projectiles = this.projectiles.filter((pr) => pr.life > 0 && pr.pierce > 0);
  }

  private updateEnemyShots(dt: number) {
    const p = this.player;
    for (const s of this.enemyShots) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (Math.hypot(s.x - p.x, s.y - p.y) < s.r + p.r - 2) {
        s.life = 0;
        if (p.iframes <= 0) this.damagePlayer(s.dmg, s.x, s.y);
      }
    }
    this.enemyShots = this.enemyShots.filter((s) => s.life > 0);
  }

  private updateZones(dt: number) {
    for (const z of this.zones) {
      z.life -= dt;
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = 0.3;
        this.query(z.x, z.y, z.r, (e) => this.hitEnemy(e, z.dps * 0.3, z.x, z.y, 10, 'fire'));
      }
      if (this.particles.length < 750) {
        for (let i = 0; i < (z.evo ? 3 : 2); i++) {
          const a = Math.random() * Math.PI * 2;
          const d = Math.sqrt(Math.random()) * z.r * 0.9;
          this.particles.push({
            x: z.x + Math.cos(a) * d,
            y: z.y + Math.sin(a) * d * 0.7,
            vx: (Math.random() - 0.5) * 20,
            vy: -40 - Math.random() * 60,
            life: 0.5,
            max: 0.5,
            color: Math.random() < 0.5 ? '#ffb040' : z.evo ? '#ff3a6a' : '#ff6a20',
            size: 3 + Math.random() * 3,
            grav: 0,
            glow: true,
          });
        }
      }
    }
    this.zones = this.zones.filter((z) => z.life > 0);
  }

  private updatePickups(dt: number) {
    const p = this.player;
    const mag = this.magnet;
    for (const pk of this.pickups) {
      pk.bob += dt * 4;
      const dx = p.x - pk.x;
      const dy = p.y - pk.y;
      const d = Math.hypot(dx, dy) || 1;
      const range = pk.kind === 'gem' || pk.kind === 'coin' ? mag : 36;
      if (!pk.vacuum && d < range) pk.vacuum = true;
      if (pk.vacuum) {
        pk.speed = Math.min(950, pk.speed + 1500 * dt);
        const step = Math.min(d, pk.speed * dt);
        pk.x += (dx / d) * step;
        pk.y += (dy / d) * step;
      }
      if (d < p.r + 10) {
        pk.taken = true;
        this.collect(pk);
      }
    }
    this.pickups = this.pickups.filter((pk) => !pk.taken);
  }

  private collect(pk: Pickup) {
    const p = this.player;
    if (pk.kind === 'gem') {
      sfx.pickup();
      this.xp += pk.value * this.xpMult;
      while (this.xp >= xpForLevel(this.level)) {
        this.xp -= xpForLevel(this.level);
        this.level++;
        this.pendingLevelUps++;
        this.fx.push({ kind: 'ring', x: p.x, y: p.y, life: 0.6, max: 0.6, dir: 0, len: 0, r: 140, color: '#7cc8ff', seed: 0 });
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, life: 0.5, max: 0.5, color: '#9fd8ff', size: 3, grav: 0, glow: true });
        }
      }
    } else if (pk.kind === 'coin') {
      sfx.coin();
      this.gold += pk.value;
    } else if (pk.kind === 'heal') {
      sfx.heal();
      p.hp = Math.min(p.maxHp, p.hp + pk.value);
      this.texts.push({ x: p.x, y: p.y - 30, vy: -50, text: `+${pk.value}`, life: 0.9, max: 0.9, color: '#7dff9a', size: 16 });
    } else if (pk.kind === 'magnet') {
      sfx.heal();
      for (const g of this.pickups) if (g.kind === 'gem' || g.kind === 'coin') g.vacuum = true;
    } else if (pk.kind === 'chest') {
      this.openChest(pk.value);
    }
  }

  private openChest(tier: number) {
    this.paused = true;
    const rewards: ChestReward[] = [];
    let anyEvo = false;
    for (let i = 0; i < tier; i++) {
      const evoReady = [...this.weapons.entries()].find(
        ([id, lv]) => lv >= WEAPONS[id].maxLevel && !this.evolved.has(id) && this.passives.has(WEAPONS[id].evo.passive),
      );
      if (evoReady) {
        const id = evoReady[0];
        this.evolved.add(id);
        anyEvo = true;
        rewards.push({ icon: id, name: WEAPONS[id].evo.name, desc: WEAPONS[id].evo.desc, color: '#ffd36b', evo: true });
        continue;
      }
      const fusable = fusableRelics(this.passives, this.relics);
      if (fusable.length) {
        const id = fusable[0];
        this.relics.add(id);
        if (id === 'phoenix') this.revives++;
        anyEvo = true;
        rewards.push({ icon: `relic-${id}`, name: `유물 합성 · ${RELICS[id].name}`, desc: RELICS[id].desc, color: RELICS[id].color, evo: true });
        continue;
      }
      const ups: (['w', WeaponId] | ['p', PassiveId])[] = [];
      for (const [id, lv] of this.weapons) if (lv < WEAPONS[id].maxLevel) ups.push(['w', id]);
      for (const [id, lv] of this.passives) if (lv < PASSIVES[id].maxLevel) ups.push(['p', id]);
      if (ups.length) {
        const [k, id] = ups[Math.floor(Math.random() * ups.length)];
        if (k === 'w') {
          const lv = this.weapons.get(id)! + 1;
          this.weapons.set(id, lv);
          this.checkSynergies();
          rewards.push({ icon: id, name: WEAPONS[id].name, desc: `LV ${lv} · ${WEAPONS[id].levels[lv - 1]}`, color: WEAPONS[id].color, evo: false });
        } else {
          const lv = this.passives.get(id)! + 1;
          this.passives.set(id, lv);
          if (id === 'vitality') this.refreshMaxHp(20);
          rewards.push({ icon: id, name: PASSIVES[id].name, desc: `LV ${lv} · ${PASSIVES[id].desc}`, color: PASSIVES[id].color, evo: false });
        }
      } else {
        this.gold += 60;
        rewards.push({ icon: 'gold', name: '금화 더미', desc: '골드 +60', color: '#ffd04a', evo: false });
      }
    }
    if (anyEvo) sfx.evolve();
    else sfx.chest();
    this.emitHud();
    this.onChest(rewards);
  }

  private dust(x: number, y: number) {
    if (this.particles.length > 700) return;
    this.particles.push({ x: x + (Math.random() - 0.5) * 10, y, vx: (Math.random() - 0.5) * 20, vy: -10, life: 0.4, max: 0.4, color: '#3a4632', size: 3, grav: 0, glow: false });
  }

  private updateParticles(dt: number) {
    for (const pt of this.particles) {
      pt.life -= dt;
      pt.vy += pt.grav * dt;
      pt.vx *= 0.94;
      pt.vy *= pt.grav ? 0.98 : 0.94;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
  }

  // ---------- render ----------
  private resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.light.width = Math.ceil(this.w / 2);
    this.light.height = Math.ceil(this.h / 2);
    this.scale = Math.min(1.25, Math.max(0.62, Math.min(this.w, this.h) / 620));
  }

  private toScreen(x: number, y: number): [number, number] {
    return [(x - this.cam.x) * this.scale + this.w / 2, (y - this.cam.y) * this.scale + this.h / 2];
  }

  private render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#10160f';
    ctx.fillRect(0, 0, this.w, this.h);

    const sx = (Math.random() - 0.5) * this.shake;
    const sy = (Math.random() - 0.5) * this.shake;

    ctx.save();
    ctx.translate(this.w / 2 + sx, this.h / 2 + sy);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.cam.x, -this.cam.y);

    this.drawGround();
    this.drawDecals();
    this.drawDecor();
    this.drawZones();
    this.drawAura();
    this.drawPickups();
    this.drawEnemies();
    if (this.running || this.ended) this.drawPlayer();
    this.drawOrbit();
    this.drawSlashes();
    this.drawProjectiles();
    this.drawBombs();
    this.drawParticles(false);
    ctx.restore();

    this.drawLighting();

    ctx.save();
    ctx.translate(this.w / 2 + sx, this.h / 2 + sy);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.cam.x, -this.cam.y);
    ctx.globalCompositeOperation = 'lighter';
    this.drawGlows();
    this.drawParticles(true);
    this.drawBolts();
    this.drawFireflies();
    ctx.globalCompositeOperation = 'source-over';
    this.drawEnemyShots();
    this.drawTexts();
    ctx.restore();

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,250,235,${this.flash * 0.35})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    if (this.running) {
      const p = this.player;
      const low = p.hp / p.maxHp;
      if (p.hurt > 0 || low < 0.3) {
        const a = p.hurt > 0 ? p.hurt * 1.6 : (0.3 - low) * (0.8 + Math.sin(this.clock * 6) * 0.4);
        const g = ctx.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.3, this.w / 2, this.h / 2, Math.hypot(this.w, this.h) / 1.7);
        g.addColorStop(0, 'rgba(160,0,20,0)');
        g.addColorStop(1, `rgba(160,0,20,${Math.min(0.6, a)})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.w, this.h);
      }
      this.drawBossPointer();
      this.drawBanner();
      this.drawJoystick();
    }
  }

  private drawGround() {
    const ctx = this.ctx;
    if (!this.groundPattern) return;
    ctx.fillStyle = this.groundPattern;
    const pad = 80;
    ctx.fillRect(this.cam.x - this.viewW / 2 - pad, this.cam.y - this.viewH / 2 - pad, this.viewW + pad * 2, this.viewH + pad * 2);
  }

  private drawDecals() {
    const ctx = this.ctx;
    for (const d of this.decals) {
      ctx.globalAlpha = Math.min(1, d.life / 2) * 0.55;
      ctx.fillStyle = '#4a0e18';
      const px = 3;
      for (let i = 0; i < 6; i++) {
        const a = hash2(Math.floor(d.seed), i) * Math.PI * 2;
        const rr = hash2(i, Math.floor(d.seed)) * d.r;
        const s = (1 + Math.floor(hash2(i + 9, Math.floor(d.seed)) * 3)) * px;
        ctx.fillRect(Math.round((d.x + Math.cos(a) * rr) / px) * px, Math.round((d.y + Math.sin(a) * rr * 0.6) / px) * px, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  private decorItems(): { x: number; y: number; kind: 'tomb' | 'tree' | 'rock' | 'candle' }[] {
    const items: { x: number; y: number; kind: 'tomb' | 'tree' | 'rock' | 'candle' }[] = [];
    const x0 = Math.floor((this.cam.x - this.viewW / 2 - 120) / DECOR_CHUNK);
    const x1 = Math.floor((this.cam.x + this.viewW / 2 + 120) / DECOR_CHUNK);
    const y0 = Math.floor((this.cam.y - this.viewH / 2 - 120) / DECOR_CHUNK);
    const y1 = Math.floor((this.cam.y + this.viewH / 2 + 120) / DECOR_CHUNK);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const n = Math.floor(hash2(cx, cy) * 4);
        for (let i = 0; i < n; i++) {
          const h = hash2(cx * 31 + i, cy * 17 - i);
          const kind = h < 0.38 ? 'tomb' : h < 0.6 ? 'rock' : h < 0.82 ? 'tree' : 'candle';
          items.push({
            x: cx * DECOR_CHUNK + hash2(cx + i * 7, cy - 3) * DECOR_CHUNK,
            y: cy * DECOR_CHUNK + hash2(cx - 5, cy + i * 11) * DECOR_CHUNK,
            kind,
          });
        }
      }
    }
    return items;
  }

  private drawDecor() {
    const ctx = this.ctx;
    const s = sprites();
    for (const d of this.decorItems()) {
      const spr = d.kind === 'candle' ? s.tomb : s[d.kind];
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + spr.h / 2 - 4, spr.w * 0.4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(spr.frames[0], Math.round(d.x - spr.w / 2), Math.round(d.y - spr.h / 2));
      if (d.kind === 'candle') {
        const c = s.candle;
        ctx.drawImage(c.frames[0], Math.round(d.x + 18), Math.round(d.y + spr.h / 2 - c.h));
        ctx.drawImage(c.frames[0], Math.round(d.x - 18 - c.w), Math.round(d.y + spr.h / 2 - c.h + 3));
      }
    }
  }

  private drawZones() {
    const ctx = this.ctx;
    for (const z of this.zones) {
      const a = Math.min(1, z.life / 0.4) * Math.min(1, (z.maxLife - z.life) / 0.15);
      ctx.globalAlpha = 0.35 * a;
      ctx.fillStyle = z.evo ? '#5a0a1a' : '#4a1a08';
      ctx.beginPath();
      ctx.ellipse(z.x, z.y, z.r, z.r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawAura() {
    const lv = this.weapons.get('aura');
    if (!lv || !this.running) return;
    const evo = this.evolved.has('aura');
    const ctx = this.ctx;
    const p = this.player;
    const r = this.auraRadius(lv, evo);
    const pulse = 1 + Math.sin(this.clock * 4) * 0.03;
    ctx.fillStyle = evo ? 'rgba(255,80,120,0.08)' : 'rgba(130,255,170,0.07)';
    ctx.strokeStyle = evo ? 'rgba(255,120,150,0.45)' : 'rgba(150,255,180,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = evo ? '#ff9ab0' : '#c8ffd8';
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = this.clock * 0.8 + (i / n) * Math.PI * 2;
      ctx.fillRect(Math.round(p.x + Math.cos(a) * r * pulse) - 2, Math.round(p.y + Math.sin(a) * r * pulse) - 2, 4, 4);
    }
  }

  private drawPickups() {
    const ctx = this.ctx;
    const s = sprites();
    for (const pk of this.pickups) {
      let spr: Sprite;
      if (pk.kind === 'gem') spr = pk.value >= 20 ? s.gemRed : pk.value >= 3 ? s.gemGreen : s.gemBlue;
      else if (pk.kind === 'coin') spr = s.coin;
      else if (pk.kind === 'heal') spr = s.chicken;
      else if (pk.kind === 'magnet') spr = s.magnet;
      else spr = s.chest;
      const bob = pk.vacuum ? 0 : Math.sin(pk.bob) * 2;
      ctx.drawImage(spr.frames[0], Math.round(pk.x - spr.w / 2), Math.round(pk.y - spr.h / 2 + bob));
    }
  }

  private drawEnemies() {
    const ctx = this.ctx;
    this.enemies.sort((a, b) => a.y - b.y);
    for (const e of this.enemies) {
      const spr = this.spriteFor(e.kind);
      const frame = Math.floor(e.anim) % spr.frames.length;
      const img = e.flash > 0 ? spr.white[frame] : spr.frames[frame];
      const bob = spr.frames.length === 1 ? Math.abs(Math.sin(e.anim)) * 2 : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + spr.h / 2 - 3, spr.w * 0.32, 4 + spr.w * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      if (e.kind === 'ghost') ctx.globalAlpha = 0.78;
      ctx.save();
      ctx.translate(Math.round(e.x), Math.round(e.y - bob + (e.kind === 'bat' ? Math.sin(e.anim * 0.5) * 3 - 6 : 0)));
      if (e.face < 0) ctx.scale(-1, 1);
      ctx.drawImage(img, -spr.w / 2, -spr.h / 2);
      const frozen = e.frozen > this.time;
      if (frozen || e.slow > this.time) {
        ctx.globalAlpha = frozen ? 0.6 : 0.3;
        ctx.drawImage(spr.white[frame], -spr.w / 2, -spr.h / 2);
        ctx.globalAlpha = 1;
        ctx.fillStyle = frozen ? '#e0f8ff' : '#7ad8ff';
        ctx.fillRect(-spr.w / 2 + 2, spr.h / 2 - 6, spr.w - 4, 3);
      }
      if (e.kind === 'knight' && e.dash > 0) {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(spr.white[frame], -spr.w / 2 - e.dx * 8 * e.face, -spr.h / 2 - e.dy * 8);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      if (e.kind === 'golem') this.hpBar(e, spr.h / 2 + 6, '#ffb347');
    }
  }

  private hpBar(e: Enemy, off: number, color: string) {
    const ctx = this.ctx;
    const w = e.r * 2;
    const y = e.y - off;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 6);
    ctx.fillStyle = color;
    ctx.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 4);
  }

  private drawPlayer() {
    const ctx = this.ctx;
    const p = this.player;
    const spr = this.heroSprite;
    if (!spr) return;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + spr.h / 2 - 3, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (p.iframes > 0 && Math.floor(this.clock * 20) % 2 === 0) ctx.globalAlpha = 0.45;
    const frame = p.moving ? Math.floor(p.step) % 2 : 0;
    const bob = p.moving ? Math.abs(Math.sin(p.step * Math.PI * 0.5)) * 2 : Math.sin(this.clock * 3) > 0.7 ? 1 : 0;
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y - bob));
    ctx.scale(p.facing, 1);
    ctx.drawImage(p.hurt > 0.15 ? spr.white[frame] : spr.frames[frame], -spr.w / 2, -spr.h / 2);
    ctx.restore();
    ctx.globalAlpha = 1;

    const w = 36;
    const y = p.y + spr.h / 2 + 2;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(p.x - w / 2 - 1, y - 1, w + 2, 6);
    ctx.fillStyle = p.hp / p.maxHp < 0.3 ? '#ff2a3d' : '#e8384f';
    ctx.fillRect(p.x - w / 2, y, w * Math.max(0, p.hp / p.maxHp), 4);
  }

  private drawOrbit() {
    const lv = this.weapons.get('orbit');
    if (!lv || !this.running) return;
    const evo = this.evolved.has('orbit');
    const o = this.orbitParams(lv, evo);
    const ctx = this.ctx;
    const p = this.player;
    const k = this.areaMult * o.size;
    for (let i = 0; i < o.count; i++) {
      const a = this.orbitAngle + (i / o.count) * Math.PI * 2;
      const x = p.x + Math.cos(a) * o.radius;
      const y = p.y + Math.sin(a) * o.radius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI);
      ctx.fillStyle = evo ? '#fff3c0' : '#e8ecf8';
      ctx.beginPath();
      ctx.moveTo(18 * k, 0);
      ctx.lineTo(0, -5 * k);
      ctx.lineTo(-6 * k, 0);
      ctx.lineTo(0, 5 * k);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = evo ? '#ffb020' : '#8a92a8';
      ctx.fillRect(-2 * k, -5 * k, 3 * k, 10 * k);
      ctx.fillStyle = '#6a3a1a';
      ctx.fillRect(-9 * k, -2 * k, 7 * k, 4 * k);
      ctx.restore();
    }
  }

  private drawSlashes() {
    const ctx = this.ctx;
    for (const f of this.fx) {
      if (f.kind === 'corpse' && f.sprite) {
        const t = f.life / f.max;
        ctx.globalAlpha = t;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale((f.flip ?? 1) * (1 + (1 - t) * 0.4), 1 - (1 - t) * 0.5);
        ctx.drawImage(f.sprite, -f.sprite.width / 2, -f.sprite.height / 2);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      if (f.kind !== 'slash') continue;
      const t = f.life / f.max;
      const prog = Math.min(1, (1 - t) * 3);
      const x0 = this.player.x;
      const x1 = x0 + f.dir * f.len * prog;
      ctx.globalAlpha = Math.min(1, t * 2);
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.moveTo(x0, f.y - f.r * 0.2);
      ctx.quadraticCurveTo((x0 + x1) / 2, f.y - f.r * 1.3, x1, f.y);
      ctx.quadraticCurveTo((x0 + x1) / 2, f.y - f.r * 0.3, x0, f.y + f.r * 0.25);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x0, f.y - f.r * 0.1);
      ctx.quadraticCurveTo((x0 + x1) / 2, f.y - f.r * 1.0, x1, f.y);
      ctx.quadraticCurveTo((x0 + x1) / 2, f.y - f.r * 0.6, x0, f.y);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  private drawProjectiles() {
    const ctx = this.ctx;
    for (const pr of this.projectiles) {
      if (pr.kind === 'orb' || pr.kind === 'wisp') {
        const ghost = pr.kind === 'wisp' && this.synergies.has('ghostfire');
        ctx.fillStyle = pr.kind === 'wisp' ? (ghost ? '#ffe2b0' : pr.evo ? '#f4ffd0' : '#d8ffc8') : pr.evo ? '#fff6d0' : '#e8f6ff';
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      if (pr.kind === 'ice') {
        const a = Math.atan2(pr.vy, pr.vx);
        ctx.save();
        ctx.translate(pr.x, pr.y);
        ctx.rotate(a);
        ctx.fillStyle = '#0c0910';
        ctx.fillRect(-pr.r * 1.4 - 1, -pr.r * 0.45 - 1, pr.r * 2.8 + 2, pr.r * 0.9 + 2);
        ctx.fillStyle = pr.evo ? '#ffffff' : '#bff0ff';
        ctx.fillRect(-pr.r * 1.4, -pr.r * 0.45, pr.r * 2.8, pr.r * 0.9);
        ctx.fillStyle = '#4ac8f0';
        ctx.fillRect(-pr.r * 1.4, 0, pr.r * 2.8, pr.r * 0.45);
        ctx.restore();
        continue;
      }
      const k = pr.r / 14;
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pr.spin);
      ctx.scale(k, k);
      if (pr.kind === 'axe') {
        ctx.fillStyle = '#0c0910';
        ctx.fillRect(-3, -14, 6, 28);
        ctx.fillStyle = '#8a5a2a';
        ctx.fillRect(-2, -13, 4, 26);
        ctx.fillStyle = '#0c0910';
        ctx.fillRect(1, -15, 13, 14);
        ctx.fillStyle = pr.evo ? '#ffb0b8' : '#c8ccd8';
        ctx.fillRect(2, -14, 11, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, -14, 3, 12);
      } else {
        ctx.fillStyle = '#0c0910';
        ctx.fillRect(-4, -15, 8, 30);
        ctx.fillRect(-12, -7, 24, 8);
        ctx.fillStyle = pr.evo ? '#fff3c0' : '#e8f0ff';
        ctx.fillRect(-3, -14, 6, 28);
        ctx.fillRect(-11, -6, 22, 6);
        ctx.fillStyle = '#ffd36b';
        ctx.fillRect(-2, -5, 4, 4);
      }
      ctx.restore();
    }
  }

  private drawBombs() {
    const ctx = this.ctx;
    for (const b of this.bombs) {
      const t = Math.min(1, b.t / b.dur);
      const x = b.sx + (b.tx - b.sx) * t;
      const y = b.sy + (b.ty - b.sy) * t - Math.sin(t * Math.PI) * (b.mini ? 30 : 90);
      const s = b.mini ? 5 : 8;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(b.tx, b.ty, b.r * t * 0.4, b.r * t * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0c0910';
      ctx.fillRect(Math.round(x - s - 1), Math.round(y - s - 1), s * 2 + 2, s * 2 + 2);
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(Math.round(x - s), Math.round(y - s), s * 2, s * 2);
      ctx.fillStyle = '#9a9ab0';
      ctx.fillRect(Math.round(x - s + 2), Math.round(y - s + 2), 3, 3);
      ctx.fillStyle = Math.floor(this.clock * 20) % 2 ? '#ffd040' : '#ff6a30';
      ctx.fillRect(Math.round(x + s - 2), Math.round(y - s - 4), 3, 3);
    }
  }

  private drawEnemyShots() {
    const ctx = this.ctx;
    for (const s of this.enemyShots) {
      const g = glow('rgba(255,90,210,0.9)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(g, s.x - 22, s.y - 22, 44, 44);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ffd0f4';
      ctx.fillRect(Math.round(s.x) - 3, Math.round(s.y) - 3, 6, 6);
    }
  }

  private drawGlows() {
    const ctx = this.ctx;
    for (const pr of this.projectiles) {
      if (pr.kind === 'axe') continue;
      const g = glow(
        pr.kind === 'cross'
          ? 'rgba(200,220,255,0.18)'
          : pr.kind === 'ice'
            ? 'rgba(120,220,255,0.45)'
            : pr.kind === 'wisp'
              ? this.synergies.has('ghostfire')
                ? 'rgba(255,150,70,0.85)'
                : 'rgba(130,255,110,0.85)'
              : pr.evo
                ? 'rgba(255,220,120,0.9)'
                : 'rgba(110,190,255,0.9)',
      );
      const s = pr.r * (pr.kind === 'cross' ? 2.6 : pr.kind === 'ice' ? 3.5 : 6);
      ctx.drawImage(g, pr.x - s / 2, pr.y - s / 2, s, s);
    }
    for (const z of this.zones) {
      const a = Math.min(1, z.life / 0.4);
      const flick = 0.9 + Math.sin(this.clock * 18 + z.x) * 0.1;
      ctx.globalAlpha = a * 0.7;
      const g = glow(z.evo ? 'rgba(255,60,90,0.8)' : 'rgba(255,120,30,0.8)');
      const s = z.r * 2.4 * flick;
      ctx.drawImage(g, z.x - s / 2, z.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    for (const pk of this.pickups) {
      if (pk.kind === 'chest') {
        const g = glow('rgba(255,210,90,0.7)');
        const s = 110 + Math.sin(this.clock * 4) * 10;
        ctx.drawImage(g, pk.x - s / 2, pk.y - s / 2, s, s);
      } else if (pk.kind === 'gem' && pk.value >= 3) {
        const g = glow(pk.value >= 20 ? 'rgba(255,80,110,0.6)' : 'rgba(80,255,120,0.5)');
        ctx.drawImage(g, pk.x - 14, pk.y - 14, 28, 28);
      }
    }
    for (const e of this.enemies) {
      if (e.kind === 'reaper') {
        const g = glow('rgba(255,30,60,0.7)');
        const s = 200 + Math.sin(this.clock * 5) * 20;
        ctx.drawImage(g, e.x - s / 2, e.y - s / 2, s, s);
      }
    }
    for (const f of this.fx) {
      if (f.kind === 'ring') {
        const t = f.life / f.max;
        ctx.strokeStyle = `rgba(124,200,255,${t})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, f.r * (1 - t) + 10, 0, Math.PI * 2);
        ctx.stroke();
      } else if (f.kind === 'beam') {
        const t = f.life / f.max;
        const ex = f.x + Math.cos(f.dir) * f.len;
        const ey = f.y + Math.sin(f.dir) * f.len;
        ctx.lineCap = 'round';
        for (const [w, col] of [
          [f.r * 2.4, `rgba(255,210,90,${t * 0.35})`],
          [f.r * 1.1, `rgba(255,240,170,${t * 0.8})`],
          [f.r * 0.4, `rgba(255,255,255,${t})`],
        ] as const) {
          ctx.strokeStyle = col;
          ctx.lineWidth = w * (0.6 + t * 0.4);
          ctx.beginPath();
          ctx.moveTo(f.x, f.y);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
        ctx.lineCap = 'butt';
      } else if (f.kind === 'nova') {
        const t = f.life / f.max;
        ctx.strokeStyle = `rgba(255,240,180,${t})`;
        ctx.lineWidth = 10 * t;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (1 - t * t), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private drawParticles(glowPass: boolean) {
    const ctx = this.ctx;
    for (const pt of this.particles) {
      if (pt.glow !== glowPass) continue;
      ctx.globalAlpha = Math.min(1, (pt.life / pt.max) * 1.5);
      ctx.fillStyle = pt.color;
      const s = pt.size * (glowPass ? pt.life / pt.max + 0.3 : 1);
      ctx.fillRect(Math.round(pt.x - s / 2), Math.round(pt.y - s / 2), Math.ceil(s), Math.ceil(s));
    }
    ctx.globalAlpha = 1;
  }

  private drawBolts() {
    const ctx = this.ctx;
    for (const f of this.fx) {
      if (f.kind !== 'bolt') continue;
      const t = f.life / f.max;
      const pts: [number, number][] = [];
      const top = f.y - 520;
      for (let i = 0; i <= 10; i++) {
        const y = top + (i / 10) * (f.y - top);
        const jitter = i === 10 ? 0 : (hash2(i, Math.floor(f.seed + this.clock * 30)) - 0.5) * 50;
        pts.push([f.x + jitter, y]);
      }
      for (const [w, col] of [
        [10, `rgba(160,120,255,${t * 0.5})`],
        [3, `rgba(255,255,255,${t})`],
      ] as const) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      const g = glow('rgba(200,170,255,0.9)');
      const s = f.r * 3 * (0.6 + t);
      ctx.drawImage(g, f.x - s / 2, f.y - s / 2, s, s);
    }
  }

  private drawFireflies() {
    const ctx = this.ctx;
    const g = glow('rgba(210,255,140,0.8)');
    const W = this.viewW + 200;
    const H = this.viewH + 200;
    for (const f of this.fireflies) {
      const fx = this.cam.x - W / 2 + ((((f.x * W + Math.sin(this.clock * 0.3 + f.p) * 60 - this.cam.x * 0.15) % W) + W) % W);
      const fy = this.cam.y - H / 2 + ((((f.y * H + Math.cos(this.clock * 0.4 + f.p) * 40 - this.cam.y * 0.15) % H) + H) % H);
      const a = 0.4 + Math.sin(this.clock * 2 + f.p * 3) * 0.4;
      if (a <= 0.05) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(g, fx - 8, fy - 8, 16, 16);
    }
    ctx.globalAlpha = 1;
  }

  private drawLighting() {
    const l = this.lctx;
    const lw = this.light.width;
    const lh = this.light.height;
    const k = 0.5;
    const darkness = this.running ? Math.min(0.72, 0.5 + this.time / 2500) : 0.5;
    l.globalCompositeOperation = 'source-over';
    l.clearRect(0, 0, lw, lh);
    l.fillStyle = `rgba(6,4,18,${darkness})`;
    l.fillRect(0, 0, lw, lh);
    l.globalCompositeOperation = 'destination-out';

    const hole = (wx: number, wy: number, r: number, strength = 1) => {
      const [sx, sy] = this.toScreen(wx, wy);
      const rr = r * this.scale * k;
      const x = sx * k;
      const y = sy * k;
      if (x + rr < 0 || y + rr < 0 || x - rr > lw || y - rr > lh) return;
      const g = l.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, `rgba(0,0,0,${strength})`);
      g.addColorStop(0.55, `rgba(0,0,0,${strength * 0.6})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      l.fillStyle = g;
      l.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    };

    if (this.running || this.ended) hole(this.player.x, this.player.y, 330);
    else hole(this.cam.x, this.cam.y, 420, 0.7);
    for (const d of this.decorItems()) {
      if (d.kind === 'candle') hole(d.x, d.y + 20, 120 + Math.sin(this.clock * 9 + d.x) * 8, 0.8);
    }
    for (const z of this.zones) hole(z.x, z.y, z.r * 2.2, 0.9);
    for (const pr of this.projectiles) if (pr.kind !== 'axe') hole(pr.x, pr.y, pr.kind === 'wisp' ? 80 : 60, 0.5);
    for (const b of this.bombs) if (b.t >= b.dur - 0.05) hole(b.tx, b.ty, b.r * 2, 1);
    for (const f of this.fx) {
      if (f.kind === 'bolt') hole(f.x, f.y, 260 * (f.life / f.max), 1);
      if (f.kind === 'nova') hole(f.x, f.y, f.r * 1.5, f.life / f.max);
      if (f.kind === 'beam') hole(f.x + Math.cos(f.dir) * f.len * 0.5, f.y + Math.sin(f.dir) * f.len * 0.5, f.len * 0.6, (f.life / f.max) * 0.8);
    }
    for (const pk of this.pickups) if (pk.kind === 'chest') hole(pk.x, pk.y, 90, 0.7);
    for (const e of this.enemies) if (e.kind === 'reaper') hole(e.x, e.y, 120, 0.5);

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.drawImage(this.light, 0, 0, this.w, this.h);
    this.ctx.imageSmoothingEnabled = false;
  }

  private drawTexts() {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const t of this.texts) {
      const age = t.max - t.life;
      const pop = age < 0.1 ? 1 + (1 - age / 0.1) * 0.6 : 1;
      ctx.globalAlpha = Math.min(1, t.life * 4);
      ctx.font = `${Math.round(t.size * pop)}px Galmuri, monospace`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0c0910';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  private drawBossPointer() {
    const boss = this.enemies.find((e) => e.kind === 'reaper' && !e.dead);
    if (!boss) return;
    const [bx, by] = this.toScreen(boss.x, boss.y);
    if (bx > 30 && bx < this.w - 30 && by > 30 && by < this.h - 30) return;
    const a = Math.atan2(by - this.h / 2, bx - this.w / 2);
    const m = 40;
    const k = Math.min((this.w / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (this.h / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.w / 2 + Math.cos(a) * k, this.h / 2 + Math.sin(a) * k);
    ctx.rotate(a);
    const pulse = 1 + Math.sin(this.clock * 8) * 0.15;
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff2a3d';
    ctx.strokeStyle = '#0c0910';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-8, -11);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-8, 11);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }

  private drawBanner() {
    if (!this.banner) return;
    const b = this.banner;
    const ctx = this.ctx;
    const inT = Math.min(1, (3 - b.life) * 4);
    const a = Math.min(1, b.life * 2) * Math.min(1, inT + 0.2);
    const y = this.h * 0.24;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    const bw = Math.min(this.w, 560);
    ctx.fillRect(this.w / 2 - bw / 2, y - 34, bw, 72);
    ctx.fillStyle = b.color;
    ctx.fillRect(this.w / 2 - bw / 2, y - 34, bw, 2);
    ctx.fillRect(this.w / 2 - bw / 2, y + 36, bw, 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const size = Math.max(22, Math.min(36, this.w / 16));
    ctx.font = `${size}px Galmuri, monospace`;
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0c0910';
    ctx.strokeText(b.text, this.w / 2, y - 6);
    ctx.fillStyle = b.color;
    ctx.fillText(b.text, this.w / 2, y - 6);
    ctx.font = '13px Galmuri, monospace';
    ctx.fillStyle = '#d8d0c8';
    ctx.fillText(b.sub, this.w / 2, y + 22);
    ctx.globalAlpha = 1;
  }

  private drawJoystick() {
    if (!this.joy) return;
    const ctx = this.ctx;
    const { ox, oy, x, y } = this.joy;
    const dx = x - ox;
    const dy = y - oy;
    const d = Math.hypot(dx, dy);
    const k = d > 50 ? 50 / d : 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ox, oy, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(ox + dx * k, oy + dy * k, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}
