import { sfx } from './audio';
import { rollChoices, xpForLevel, type Choice, type PassiveId, type WeaponId } from './upgrades';

type EnemyKind = 'bat' | 'zombie' | 'skeleton' | 'ghost' | 'golem' | 'reaper';

interface EnemyDef {
  r: number;
  hp: number;
  speed: number;
  dps: number;
  xp: number;
  color: string;
}

const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  bat: { r: 10, hp: 6, speed: 105, dps: 8, xp: 1, color: '#8a5cc2' },
  zombie: { r: 14, hp: 18, speed: 52, dps: 12, xp: 2, color: '#6e9a55' },
  skeleton: { r: 13, hp: 32, speed: 78, dps: 15, xp: 3, color: '#e4dccb' },
  ghost: { r: 12, hp: 24, speed: 135, dps: 12, xp: 3, color: '#a8e3f0' },
  golem: { r: 26, hp: 280, speed: 48, dps: 25, xp: 20, color: '#9b7650' },
  reaper: { r: 40, hp: 2600, speed: 72, dps: 40, xp: 120, color: '#c3283d' },
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
  dps: number;
  xp: number;
  flash: number;
  kx: number;
  ky: number;
  hitAt: Record<string, number>;
  dead: boolean;
  wobble: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  pierce: number;
  life: number;
  hit: Set<number>;
}

interface Zone {
  x: number;
  y: number;
  r: number;
  dps: number;
  life: number;
  maxLife: number;
  tick: number;
}

type PickupKind = 'gem' | 'heal' | 'magnet' | 'chest';

interface Pickup {
  x: number;
  y: number;
  kind: PickupKind;
  value: number;
  vacuum: boolean;
  speed: number;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
  size: number;
}

interface Fx {
  kind: 'bolt' | 'slash' | 'burst' | 'ring';
  x: number;
  y: number;
  life: number;
  maxLife: number;
  dir: number;
  len: number;
  r: number;
  color: string;
}

export interface HudState {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpNeed: number;
  time: number;
  kills: number;
  weapons: [WeaponId, number][];
  passives: [PassiveId, number][];
}

export interface RunResult {
  victory: boolean;
  time: number;
  kills: number;
  level: number;
  damage: number;
}

export const VICTORY_TIME = 600;
const MAX_ENEMIES = 450;
const CELL = 64;
const BOSS_TIMES = [180, 360, 540];

export class Game {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private scale = 1;
  private vignette: CanvasGradient | null = null;

  private player = { x: 0, y: 0, r: 14, hp: 100, maxHp: 100, facing: 1, dirX: 1, dirY: 0, hurt: 0, moving: false, step: 0 };
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private zones: Zone[] = [];
  private pickups: Pickup[] = [];
  private texts: FloatText[] = [];
  private fx: Fx[] = [];
  private grid = new Map<number, Enemy[]>();

  private weapons = new Map<WeaponId, number>();
  private weaponTimers = new Map<WeaponId, number>();
  private passives = new Map<PassiveId, number>();

  private time = 0;
  private kills = 0;
  private damage = 0;
  private level = 1;
  private xp = 0;
  private pendingLevelUps = 0;
  private nextId = 1;
  private spawnAcc = 0;
  private nextElite = 45;
  private nextSwarm = 60;
  private bossIdx = 0;
  private orbitAngle = 0;
  private auraTick = 0;
  private banner: { text: string; life: number } | null = null;

  running = false;
  paused = false;
  private ended = false;

  private keys = new Set<string>();
  private joy: { id: number; ox: number; oy: number; x: number; y: number } | null = null;

  onLevelUp: (choices: Choice[]) => void = () => {};
  onEnd: (r: RunResult) => void = () => {};
  onHud: (h: HudState) => void = () => {};

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D를 지원하지 않는 브라우저입니다.');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindInput();
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (this.running && !this.paused) this.update(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  start() {
    this.player = { x: 0, y: 0, r: 14, hp: 100, maxHp: 100, facing: 1, dirX: 1, dirY: 0, hurt: 0, moving: false, step: 0 };
    this.enemies = [];
    this.projectiles = [];
    this.zones = [];
    this.pickups = [];
    this.texts = [];
    this.fx = [];
    this.weapons = new Map([['wand', 1]]);
    this.weaponTimers = new Map();
    this.passives = new Map();
    this.time = 0;
    this.kills = 0;
    this.damage = 0;
    this.level = 1;
    this.xp = 0;
    this.pendingLevelUps = 0;
    this.spawnAcc = 0;
    this.nextElite = 45;
    this.nextSwarm = 60;
    this.bossIdx = 0;
    this.banner = { text: '살아남아라!', life: 2.2 };
    this.running = true;
    this.paused = false;
    this.ended = false;
    this.emitHud();
  }

  applyChoice(c: Choice) {
    if (c.kind === 'weapon') {
      this.weapons.set(c.id, c.nextLevel);
    } else if (c.kind === 'passive') {
      this.passives.set(c.id, c.nextLevel);
      if (c.id === 'vitality') {
        this.player.maxHp = 100 + 20 * c.nextLevel;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
      }
    } else {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 40);
    }
    this.pendingLevelUps--;
    this.emitHud();
    if (this.pendingLevelUps > 0) this.offerLevelUp();
    else this.paused = false;
  }

  setPaused(p: boolean) {
    if (!this.running || this.pendingLevelUps > 0) return;
    this.paused = p;
  }

  // ---------- stats ----------
  private pl(id: PassiveId) {
    return this.passives.get(id) ?? 0;
  }
  private get might() {
    return 1 + 0.1 * this.pl('might');
  }
  private get cdMult() {
    return 1 - 0.08 * this.pl('haste');
  }
  private get areaMult() {
    return 1 + 0.1 * this.pl('area');
  }
  private get moveSpeed() {
    return 165 * (1 + 0.1 * this.pl('speed'));
  }
  private get magnet() {
    return 75 * (1 + 0.3 * this.pl('magnet'));
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
      if (this.joy) return;
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
        x = (dx / d) * m;
        y = (dy / d) * m;
        return [x, y];
      }
    }
    const len = Math.hypot(x, y);
    return len > 0 ? [x / len, y / len] : [0, 0];
  }

  // ---------- update ----------
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
      p.step += dt * 10;
    }
    p.hurt = Math.max(0, p.hurt - dt);
    p.hp = Math.min(p.maxHp, p.hp + 0.4 * this.pl('regen') * dt);

    this.spawn(dt);
    this.buildGrid();
    this.updateEnemies(dt);
    this.updateWeapons(dt);
    this.updateProjectiles(dt);
    this.updateZones(dt);
    this.updatePickups(dt);

    for (const t of this.texts) {
      t.life -= dt;
      t.y -= 30 * dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
    for (const f of this.fx) f.life -= dt;
    this.fx = this.fx.filter((f) => f.life > 0);
    if (this.banner) {
      this.banner.life -= dt;
      if (this.banner.life <= 0) this.banner = null;
    }
    this.enemies = this.enemies.filter((e) => !e.dead);

    if (p.hp <= 0) {
      p.hp = 0;
      this.finish(false);
      return;
    }
    if (this.time >= VICTORY_TIME) {
      this.finish(true);
      return;
    }
    if (this.pendingLevelUps > 0 && !this.paused) this.offerLevelUp();
    this.emitHud();
  }

  private finish(victory: boolean) {
    if (this.ended) return;
    this.ended = true;
    this.running = false;
    this.emitHud();
    this.onEnd({ victory, time: this.time, kills: this.kills, level: this.level, damage: Math.round(this.damage) });
  }

  private offerLevelUp() {
    this.paused = true;
    sfx.levelUp();
    this.onLevelUp(rollChoices(this.weapons, this.passives));
  }

  private emitHud() {
    this.onHud({
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      level: this.level,
      xp: this.xp,
      xpNeed: xpForLevel(this.level),
      time: this.time,
      kills: this.kills,
      weapons: [...this.weapons.entries()],
      passives: [...this.passives.entries()],
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
    if (t < 60) return r < 0.7 ? 'bat' : 'zombie';
    if (t < 120) return r < 0.4 ? 'bat' : r < 0.8 ? 'zombie' : 'skeleton';
    if (t < 240) return r < 0.25 ? 'bat' : r < 0.5 ? 'zombie' : r < 0.8 ? 'skeleton' : 'ghost';
    return r < 0.15 ? 'bat' : r < 0.35 ? 'zombie' : r < 0.7 ? 'skeleton' : 'ghost';
  }

  private spawnPos(): [number, number] {
    const a = Math.random() * Math.PI * 2;
    const d = Math.hypot(this.viewW, this.viewH) / 2 + 40;
    return [this.player.x + Math.cos(a) * d, this.player.y + Math.sin(a) * d];
  }

  private spawnEnemy(kind: EnemyKind, x?: number, y?: number) {
    const def = ENEMY_DEFS[kind];
    const [sx, sy] = x !== undefined && y !== undefined ? [x, y] : this.spawnPos();
    const hpScale = 1 + (this.time / 60) * 0.35;
    const hp = def.hp * hpScale;
    this.enemies.push({
      id: this.nextId++,
      kind,
      x: sx,
      y: sy,
      r: def.r,
      hp,
      maxHp: hp,
      speed: def.speed * (0.9 + Math.random() * 0.2),
      dps: def.dps,
      xp: def.xp,
      flash: 0,
      kx: 0,
      ky: 0,
      hitAt: {},
      dead: false,
      wobble: Math.random() * 10,
    });
  }

  private spawn(dt: number) {
    const rate = Math.min(14, 0.9 + this.time / 14);
    this.spawnAcc += dt * rate;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (this.enemies.length < MAX_ENEMIES) this.spawnEnemy(this.pickKind());
    }

    if (this.time >= this.nextElite) {
      this.nextElite += 45;
      this.spawnEnemy('golem');
    }

    if (this.time >= this.nextSwarm) {
      this.nextSwarm += 60;
      const n = 28 + Math.floor(this.time / 30);
      const d = Math.hypot(this.viewW, this.viewH) / 2 + 20;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.spawnEnemy('bat', this.player.x + Math.cos(a) * d, this.player.y + Math.sin(a) * d);
      }
      this.banner = { text: '박쥐 떼가 몰려온다!', life: 2 };
    }

    if (this.bossIdx < BOSS_TIMES.length && this.time >= BOSS_TIMES[this.bossIdx]) {
      this.bossIdx++;
      this.spawnEnemy('reaper');
      const boss = this.enemies[this.enemies.length - 1];
      boss.maxHp = boss.hp = ENEMY_DEFS.reaper.hp * this.bossIdx * (1 + this.time / 300);
      this.banner = { text: '죽음의 사신이 나타났다!', life: 3 };
      sfx.boss();
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
    const far = Math.hypot(this.viewW, this.viewH) * 0.9;
    let tookDamage = false;
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

      e.x += (dx / d) * e.speed * dt + e.kx * dt;
      e.y += (dy / d) * e.speed * dt + e.ky * dt;
      e.kx *= Math.pow(0.0005, dt);
      e.ky *= Math.pow(0.0005, dt);
      e.flash = Math.max(0, e.flash - dt);
      e.wobble += dt * 8;

      if (e.kind !== 'ghost') {
        const k = this.key(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
        const bucket = this.grid.get(k);
        if (bucket) {
          for (const o of bucket) {
            if (o === e || o.kind === 'ghost') continue;
            const ox = e.x - o.x;
            const oy = e.y - o.y;
            const od = Math.hypot(ox, oy);
            const min = e.r + o.r;
            if (od > 0 && od < min) {
              const push = ((min - od) / od) * 0.5;
              e.x += ox * push;
              e.y += oy * push;
            }
          }
        }
      }

      if (d < e.r + p.r) {
        p.hp -= e.dps * dt;
        tookDamage = true;
      }
    }
    if (tookDamage) {
      if (p.hurt <= 0) sfx.hurt();
      p.hurt = 0.15;
    }
  }

  private hitEnemy(e: Enemy, dmg: number, fromX: number, fromY: number, knock: number) {
    if (e.dead) return;
    const amount = dmg * this.might * (0.9 + Math.random() * 0.2);
    e.hp -= amount;
    e.flash = 0.1;
    this.damage += amount;
    if (e.kind !== 'reaper' && e.kind !== 'golem') {
      const dx = e.x - fromX;
      const dy = e.y - fromY;
      const d = Math.hypot(dx, dy) || 1;
      e.kx += (dx / d) * knock;
      e.ky += (dy / d) * knock;
    }
    if (this.texts.length < 120) {
      this.texts.push({
        x: e.x + (Math.random() - 0.5) * 10,
        y: e.y - e.r,
        text: String(Math.round(amount)),
        life: 0.6,
        color: amount > 60 ? '#ffd36b' : '#ffffff',
        size: amount > 60 ? 16 : 12,
      });
    }
    sfx.hit();
    if (e.hp <= 0) this.killEnemy(e);
  }

  private killEnemy(e: Enemy) {
    e.dead = true;
    this.kills++;
    sfx.kill();
    this.fx.push({ kind: 'burst', x: e.x, y: e.y, life: 0.3, maxLife: 0.3, dir: 0, len: 0, r: e.r, color: ENEMY_DEFS[e.kind].color });
    if (e.kind === 'reaper') {
      this.pickups.push({ x: e.x, y: e.y, kind: 'chest', value: 1, vacuum: false, speed: 0 });
      this.banner = { text: '사신을 처치했다! 보물 상자를 획득하세요', life: 3 };
    }
    this.dropGem(e.x, e.y, e.xp);
    const r = Math.random();
    if (r < 0.012) this.pickups.push({ x: e.x, y: e.y, kind: 'heal', value: 30, vacuum: false, speed: 0 });
    else if (r < 0.016) this.pickups.push({ x: e.x, y: e.y, kind: 'magnet', value: 0, vacuum: false, speed: 0 });
  }

  private dropGem(x: number, y: number, value: number) {
    let gems = 0;
    for (const pk of this.pickups) if (pk.kind === 'gem') gems++;
    if (gems > 500) {
      const target = this.pickups.find((pk) => pk.kind === 'gem' && !pk.vacuum);
      if (target) {
        target.value += value;
        return;
      }
    }
    this.pickups.push({ x, y, kind: 'gem', value, vacuum: false, speed: 0 });
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
      this.weaponTimers.set(id, cd * this.cdMult);
      return true;
    }
    this.weaponTimers.set(id, t);
    return false;
  }

  private updateWeapons(dt: number) {
    const p = this.player;
    const area = this.areaMult;

    const wand = this.weapons.get('wand');
    if (wand) {
      const cd = Math.max(0.35, 1.0 - 0.07 * (wand - 1));
      if (this.tickTimer('wand', dt, cd)) {
        const count = 1 + (wand >= 3 ? 1 : 0) + (wand >= 6 ? 1 : 0);
        const dmg = 12 + 5 * (Math.min(wand, 2) - 1) + (wand >= 4 ? 5 : 0) + (wand >= 7 ? 5 : 0);
        const pierce = 1 + (wand >= 5 ? 1 : 0) + (wand >= 8 ? 1 : 0);
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
            const a = Math.atan2(dy, dx) + (i % 2 ? 0.25 : -0.25);
            dx = Math.cos(a);
            dy = Math.sin(a);
          }
          this.projectiles.push({
            x: p.x,
            y: p.y,
            vx: dx * 440,
            vy: dy * 440,
            r: (wand >= 8 ? 9 : 6) * area,
            dmg,
            pierce,
            life: 1.6,
            hit: new Set(),
          });
        }
      }
    }

    const aura = this.weapons.get('aura');
    if (aura) {
      this.auraTick -= dt;
      if (this.auraTick <= 0) {
        this.auraTick = 0.45;
        const r = (60 + 10 * aura) * area;
        const dmg = 5 + 3 * aura;
        this.query(p.x, p.y, r, (e) => this.hitEnemy(e, dmg, p.x, p.y, 60));
      }
    }

    const orbit = this.weapons.get('orbit');
    if (orbit) {
      const count = [1, 2, 2, 3, 3, 4, 4, 5][orbit - 1];
      const dmg = 10 + (orbit >= 3 ? 4 : 0) + (orbit >= 5 ? 4 : 0) + (orbit >= 7 ? 4 : 0);
      const speed = 3 + (orbit >= 3 ? 0.6 : 0) + (orbit >= 7 ? 0.6 : 0);
      const radius = (80 + (orbit >= 5 ? 20 : 0)) * area;
      this.orbitAngle += speed * dt;
      for (let i = 0; i < count; i++) {
        const a = this.orbitAngle + (i / count) * Math.PI * 2;
        const bx = p.x + Math.cos(a) * radius;
        const by = p.y + Math.sin(a) * radius;
        this.query(bx, by, 12 * area, (e) => {
          if ((e.hitAt.orbit ?? -1) > this.time) return;
          e.hitAt.orbit = this.time + 0.35;
          this.hitEnemy(e, dmg, p.x, p.y, 220);
        });
      }
    }

    const lightning = this.weapons.get('lightning');
    if (lightning) {
      const cd = Math.max(0.9, 2.4 - 0.15 * lightning);
      if (this.tickTimer('lightning', dt, cd)) {
        const strikes = 1 + (lightning >= 3 ? 1 : 0) + (lightning >= 5 ? 1 : 0) + (lightning >= 7 ? 1 : 0) + (lightning >= 8 ? 1 : 0);
        const dmg = 25 + 10 * (lightning - 1);
        const r = (lightning >= 6 ? 55 : 40) * area;
        const vw = this.viewW / 2;
        const vh = this.viewH / 2;
        const visible = this.enemies.filter((e) => !e.dead && Math.abs(e.x - p.x) < vw && Math.abs(e.y - p.y) < vh);
        for (let i = 0; i < strikes && visible.length > 0; i++) {
          const idx = Math.floor(Math.random() * visible.length);
          const t = visible.splice(idx, 1)[0];
          const tx = t.x;
          const ty = t.y;
          this.query(tx, ty, r, (e) => this.hitEnemy(e, dmg, tx, ty, 120));
          this.fx.push({ kind: 'bolt', x: tx, y: ty, life: 0.25, maxLife: 0.25, dir: Math.random(), len: 0, r, color: '#d9c2ff' });
        }
        if (strikes > 0) sfx.zap();
      }
    }

    const whip = this.weapons.get('whip');
    if (whip) {
      const cd = Math.max(0.6, 1.3 - (whip >= 3 ? 0.15 : 0) - (whip >= 6 ? 0.15 : 0));
      if (this.tickTimer('whip', dt, cd)) {
        const dmg = 15 + 6 * (whip - 1 - (whip >= 4 ? 1 : 0));
        const len = (140 + (whip >= 2 ? 20 : 0) + (whip >= 5 ? 20 : 0) + (whip >= 7 ? 20 : 0)) * area;
        const half = (whip >= 8 ? 34 : 24) * area;
        const dirs = whip >= 4 ? [p.facing, -p.facing] : [p.facing];
        dirs.forEach((dir, i) => {
          const y = p.y - 6 + i * 10;
          const x0 = dir > 0 ? p.x : p.x - len;
          const x1 = dir > 0 ? p.x + len : p.x;
          const cx = (x0 + x1) / 2;
          this.query(cx, y, len / 2 + half, (e) => {
            if (e.x + e.r >= x0 && e.x - e.r <= x1 && Math.abs(e.y - y) <= half + e.r) {
              this.hitEnemy(e, dmg, p.x, y, 180);
            }
          });
          this.fx.push({ kind: 'slash', x: p.x, y, life: 0.22, maxLife: 0.22, dir, len, r: half, color: '#ffb3a8' });
        });
      }
    }

    const fire = this.weapons.get('fire');
    if (fire) {
      const cd = fire >= 7 ? 2.4 : 3;
      if (this.tickTimer('fire', dt, cd)) {
        const count = 1 + (fire >= 4 ? 1 : 0) + (fire >= 8 ? 1 : 0);
        const r = (45 + (fire >= 3 ? 12 : 0) + (fire >= 6 ? 12 : 0)) * area;
        const dps = 16 + (fire >= 2 ? 8 : 0) + (fire >= 5 ? 8 : 0) + (fire >= 7 ? 8 : 0);
        const dur = 2.6 + (fire >= 2 ? 0.5 : 0) + (fire >= 5 ? 0.5 : 0);
        const targets = this.nearestEnemies(12, 380);
        for (let i = 0; i < count; i++) {
          const t = targets.length ? targets[Math.floor(Math.random() * targets.length)] : null;
          const a = Math.random() * Math.PI * 2;
          const x = t ? t.x : p.x + Math.cos(a) * 140;
          const y = t ? t.y : p.y + Math.sin(a) * 140;
          this.zones.push({ x, y, r, dps, life: dur, maxLife: dur, tick: 0 });
        }
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (const pr of this.projectiles) {
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      if (pr.pierce <= 0) continue;
      this.query(pr.x, pr.y, pr.r, (e) => {
        if (pr.pierce <= 0 || pr.hit.has(e.id)) return;
        pr.hit.add(e.id);
        pr.pierce--;
        this.hitEnemy(e, pr.dmg, pr.x - pr.vx, pr.y - pr.vy, 140);
      });
    }
    this.projectiles = this.projectiles.filter((pr) => pr.life > 0 && pr.pierce > 0);
  }

  private updateZones(dt: number) {
    for (const z of this.zones) {
      z.life -= dt;
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = 0.3;
        this.query(z.x, z.y, z.r, (e) => this.hitEnemy(e, z.dps * 0.3, z.x, z.y, 10));
      }
    }
    this.zones = this.zones.filter((z) => z.life > 0);
  }

  private updatePickups(dt: number) {
    const p = this.player;
    const mag = this.magnet;
    for (const pk of this.pickups) {
      const dx = p.x - pk.x;
      const dy = p.y - pk.y;
      const d = Math.hypot(dx, dy) || 1;
      const range = pk.kind === 'gem' ? mag : 40;
      if (!pk.vacuum && d < range) pk.vacuum = true;
      if (pk.vacuum) {
        pk.speed = Math.min(900, pk.speed + 1400 * dt);
        const step = Math.min(d, pk.speed * dt);
        pk.x += (dx / d) * step;
        pk.y += (dy / d) * step;
      }
      if (d < p.r + 8) {
        this.collect(pk);
        pk.value = -1;
      }
    }
    this.pickups = this.pickups.filter((pk) => pk.value !== -1);
  }

  private collect(pk: Pickup) {
    const p = this.player;
    if (pk.kind === 'gem') {
      sfx.pickup();
      this.xp += pk.value;
      while (this.xp >= xpForLevel(this.level)) {
        this.xp -= xpForLevel(this.level);
        this.level++;
        this.pendingLevelUps++;
        this.fx.push({ kind: 'ring', x: p.x, y: p.y, life: 0.6, maxLife: 0.6, dir: 0, len: 0, r: 120, color: '#7cc8ff' });
      }
    } else if (pk.kind === 'heal') {
      sfx.heal();
      p.hp = Math.min(p.maxHp, p.hp + 30);
      this.texts.push({ x: p.x, y: p.y - 24, text: '+30', life: 0.9, color: '#7dff9a', size: 16 });
    } else if (pk.kind === 'magnet') {
      sfx.heal();
      for (const g of this.pickups) if (g.kind === 'gem') g.vacuum = true;
    } else if (pk.kind === 'chest') {
      sfx.levelUp();
      this.pendingLevelUps += 2;
    }
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
    this.scale = Math.min(1.15, Math.max(0.6, Math.min(this.w, this.h) / 640));
    const g = this.ctx.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.35, this.w / 2, this.h / 2, Math.hypot(this.w, this.h) / 1.6);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.65)');
    this.vignette = g;
  }

  private render() {
    const ctx = this.ctx;
    const p = this.player;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#1a2419';
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.save();
    ctx.translate(this.w / 2, this.h / 2);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-p.x, -p.y);

    this.drawGround();
    this.drawZones();
    this.drawPickups();
    this.drawAura();
    for (const e of this.enemies) this.drawEnemy(e);
    this.drawPlayer();
    this.drawOrbit();
    this.drawProjectiles();
    this.drawFx();
    this.drawTexts();
    ctx.restore();

    if (this.vignette) {
      ctx.fillStyle = this.vignette;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    if (p.hurt > 0 && this.running) {
      ctx.fillStyle = `rgba(200,20,40,${p.hurt * 1.2})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    this.drawBossPointer();
    this.drawBanner();
    this.drawJoystick();
  }

  private hash(x: number, y: number) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  private drawGround() {
    const ctx = this.ctx;
    const T = 64;
    const p = this.player;
    const x0 = Math.floor((p.x - this.viewW / 2) / T) - 1;
    const x1 = Math.floor((p.x + this.viewW / 2) / T) + 1;
    const y0 = Math.floor((p.y - this.viewH / 2) / T) - 1;
    const y1 = Math.floor((p.y + this.viewH / 2) / T) + 1;
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = y0; ty <= y1; ty++) {
        const h = this.hash(tx, ty);
        if ((tx + ty) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.018)';
          ctx.fillRect(tx * T, ty * T, T, T);
        }
        const px = tx * T + 10 + (h * 997 % 44);
        const py = ty * T + 10 + (h * 7919 % 44);
        if (h < 0.12) {
          ctx.strokeStyle = '#2f4a2a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - 4, py - 8);
          ctx.moveTo(px, py);
          ctx.lineTo(px, py - 10);
          ctx.moveTo(px, py);
          ctx.lineTo(px + 4, py - 8);
          ctx.stroke();
        } else if (h < 0.16) {
          ctx.fillStyle = '#323b33';
          ctx.beginPath();
          ctx.ellipse(px, py, 7, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (h < 0.175) {
          ctx.fillStyle = '#8a3a4a';
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (h < 0.18) {
          ctx.fillStyle = '#3d3a36';
          ctx.fillRect(px - 6, py - 12, 12, 14);
          ctx.fillRect(px - 9, py - 8, 18, 4);
        }
      }
    }
  }

  private drawZones() {
    const ctx = this.ctx;
    for (const z of this.zones) {
      const a = Math.min(1, z.life / 0.4) * Math.min(1, (z.maxLife - z.life) / 0.15);
      const flick = 0.85 + Math.sin(this.time * 20 + z.x) * 0.15;
      const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r * flick);
      g.addColorStop(0, `rgba(255,220,120,${0.55 * a})`);
      g.addColorStop(0.5, `rgba(255,110,40,${0.4 * a})`);
      g.addColorStop(1, 'rgba(200,40,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.r * flick, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPickups() {
    const ctx = this.ctx;
    for (const pk of this.pickups) {
      if (pk.kind === 'gem') {
        const v = pk.value;
        const color = v >= 20 ? '#ff5d7a' : v >= 3 ? '#5dff9a' : '#5db8ff';
        const s = v >= 20 ? 8 : v >= 3 ? 6.5 : 5;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(pk.x, pk.y - s * 1.3);
        ctx.lineTo(pk.x + s, pk.y);
        ctx.lineTo(pk.x, pk.y + s * 1.3);
        ctx.lineTo(pk.x - s, pk.y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(pk.x - 1.5, pk.y - s * 0.7, 2, 3);
      } else if (pk.kind === 'heal') {
        ctx.fillStyle = '#c9783a';
        ctx.beginPath();
        ctx.ellipse(pk.x, pk.y, 10, 7, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f1e6d2';
        ctx.fillRect(pk.x + 5, pk.y + 2, 8, 3);
      } else if (pk.kind === 'magnet') {
        ctx.strokeStyle = '#ff4d5e';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(pk.x, pk.y, 8, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(pk.x - 10.5, pk.y, 5, 5);
        ctx.fillRect(pk.x + 5.5, pk.y, 5, 5);
      } else {
        const bob = Math.sin(this.time * 4) * 3;
        ctx.fillStyle = '#7a4a1f';
        ctx.fillRect(pk.x - 16, pk.y - 10 + bob, 32, 22);
        ctx.fillStyle = '#ffcf4a';
        ctx.fillRect(pk.x - 16, pk.y - 2 + bob, 32, 4);
        ctx.fillRect(pk.x - 3, pk.y - 5 + bob, 6, 8);
        ctx.strokeStyle = 'rgba(255,220,100,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(pk.x - 18, pk.y - 12 + bob, 36, 26);
      }
    }
  }

  private drawAura() {
    const lv = this.weapons.get('aura');
    if (!lv) return;
    const ctx = this.ctx;
    const p = this.player;
    const r = (60 + 10 * lv) * this.areaMult;
    const pulse = 1 + Math.sin(this.time * 4) * 0.03;
    ctx.fillStyle = 'rgba(150,255,180,0.08)';
    ctx.strokeStyle = 'rgba(150,255,180,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private drawEnemy(e: Enemy) {
    const ctx = this.ctx;
    const def = ENEMY_DEFS[e.kind];
    const facing = this.player.x < e.x ? -1 : 1;
    const color = e.flash > 0 ? '#ffffff' : def.color;
    ctx.save();
    ctx.translate(e.x, e.y);

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, e.r * 0.9, e.r * 0.9, e.r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (e.kind) {
      case 'bat': {
        const flap = Math.sin(e.wobble * 2) * 6;
        ctx.fillStyle = e.flash > 0 ? '#fff' : '#5e3a8a';
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-18, -6 + flap);
        ctx.lineTo(-12, 4);
        ctx.moveTo(4, 0);
        ctx.lineTo(18, -6 + flap);
        ctx.lineTo(12, 4);
        ctx.fill();
        this.blob(e.r * 0.75, color);
        this.eyes(e.r * 0.75, facing, '#ff4d4d');
        break;
      }
      case 'zombie': {
        ctx.translate(0, Math.sin(e.wobble) * 1.5);
        this.blob(e.r, color);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-e.r * 0.6, e.r * 0.2, e.r * 1.2, 3);
        this.eyes(e.r, facing, '#e8f070');
        break;
      }
      case 'skeleton': {
        ctx.translate(0, Math.sin(e.wobble) * 1.5);
        this.blob(e.r, color);
        ctx.fillStyle = '#1b1b1b';
        ctx.beginPath();
        ctx.arc(facing * 2 - 4, -2, 3.2, 0, Math.PI * 2);
        ctx.arc(facing * 2 + 4, -2, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(facing * 2 - 4, 5, 8, 2);
        break;
      }
      case 'ghost': {
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, -2, e.r, Math.PI, 0);
        const w = e.r;
        for (let i = 0; i <= 4; i++) {
          const x = w - (i * 2 * w) / 4;
          ctx.lineTo(x, e.r * 0.8 + (i % 2 ? -3 : 2) + Math.sin(e.wobble + i) * 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        this.eyes(e.r, facing, '#1b2a44');
        break;
      }
      case 'golem': {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(-e.r, -e.r, e.r * 2, e.r * 2, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-e.r, e.r * 0.3, e.r * 2, 4);
        this.eyes(e.r, facing, '#ffb347');
        this.hpBar(e);
        break;
      }
      case 'reaper': {
        const float = Math.sin(e.wobble * 0.5) * 4;
        ctx.translate(0, float);
        ctx.fillStyle = e.flash > 0 ? '#fff' : '#1c0f18';
        ctx.beginPath();
        ctx.moveTo(-e.r, e.r);
        ctx.quadraticCurveTo(-e.r * 1.1, -e.r * 1.2, 0, -e.r * 1.1);
        ctx.quadraticCurveTo(e.r * 1.1, -e.r * 1.2, e.r, e.r);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ff2a3d';
        ctx.beginPath();
        ctx.arc(facing * 4 - 9, -e.r * 0.3, 4, 0, Math.PI * 2);
        ctx.arc(facing * 4 + 9, -e.r * 0.3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b8b8c8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(facing * e.r * 1.1, e.r);
        ctx.lineTo(facing * e.r * 1.1, -e.r * 1.4);
        ctx.quadraticCurveTo(facing * e.r * 0.2, -e.r * 1.8, -facing * e.r * 0.4, -e.r * 1.0);
        ctx.stroke();
        this.hpBar(e);
        break;
      }
    }
    ctx.restore();
  }

  private blob(r: number, color: string) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private eyes(r: number, facing: number, color: string) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    const s = Math.max(2, r * 0.18);
    ctx.fillRect(facing * r * 0.25 - r * 0.35 - s / 2, -r * 0.25, s, s);
    ctx.fillRect(facing * r * 0.25 + r * 0.35 - s / 2, -r * 0.25, s, s);
  }

  private hpBar(e: Enemy) {
    const ctx = this.ctx;
    const w = e.r * 2;
    const y = -e.r - (e.kind === 'reaper' ? 70 : 12);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-w / 2, y, w, 5);
    ctx.fillStyle = e.kind === 'reaper' ? '#ff2a3d' : '#ffb347';
    ctx.fillRect(-w / 2, y, w * Math.max(0, e.hp / e.maxHp), 5);
  }

  private drawPlayer() {
    const ctx = this.ctx;
    const p = this.player;
    const bob = p.moving ? Math.abs(Math.sin(p.step)) * 3 : 0;
    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 15, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -bob);
    ctx.scale(p.facing, 1);

    ctx.fillStyle = '#7a1f2b';
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.quadraticCurveTo(-20, 6 + Math.sin(p.step) * 3, -14, 15);
    ctx.lineTo(4, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = p.hurt > 0 ? '#ffffff' : '#2b3a67';
    ctx.beginPath();
    ctx.roundRect(-9, -6, 18, 20, 5);
    ctx.fill();

    ctx.fillStyle = '#f2d2b0';
    ctx.beginPath();
    ctx.arc(1, -12, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2416';
    ctx.beginPath();
    ctx.arc(0, -15, 8.5, Math.PI * 1.05, Math.PI * 2.05);
    ctx.fill();
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(4, -13, 2, 3);

    ctx.fillStyle = '#c33a4a';
    ctx.fillRect(-9, -6, 18, 3);
    ctx.restore();

    const w = 34;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(p.x - w / 2, p.y + 22, w, 4);
    ctx.fillStyle = '#e8384f';
    ctx.fillRect(p.x - w / 2, p.y + 22, w * (p.hp / p.maxHp), 4);
  }

  private drawOrbit() {
    const lv = this.weapons.get('orbit');
    if (!lv) return;
    const ctx = this.ctx;
    const p = this.player;
    const count = [1, 2, 2, 3, 3, 4, 4, 5][lv - 1];
    const radius = (80 + (lv >= 5 ? 20 : 0)) * this.areaMult;
    for (let i = 0; i < count; i++) {
      const a = this.orbitAngle + (i / count) * Math.PI * 2;
      const x = p.x + Math.cos(a) * radius;
      const y = p.y + Math.sin(a) * radius;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI / 2 + this.time * 10);
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.moveTo(0, -14 * this.areaMult);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 14 * this.areaMult);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c99a2e';
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();
    }
  }

  private drawProjectiles() {
    const ctx = this.ctx;
    for (const pr of this.projectiles) {
      const sp = Math.hypot(pr.vx, pr.vy) || 1;
      ctx.strokeStyle = 'rgba(124,200,255,0.35)';
      ctx.lineWidth = pr.r * 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pr.x, pr.y);
      ctx.lineTo(pr.x - (pr.vx / sp) * 22, pr.y - (pr.vy / sp) * 22);
      ctx.stroke();
      ctx.fillStyle = '#dff3ff';
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineCap = 'butt';
  }

  private drawFx() {
    const ctx = this.ctx;
    for (const f of this.fx) {
      const t = f.life / f.maxLife;
      if (f.kind === 'bolt') {
        ctx.strokeStyle = `rgba(230,210,255,${t})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        let x = f.x + (f.dir - 0.5) * 60;
        let y = f.y - 400;
        ctx.moveTo(x, y);
        for (let i = 1; i <= 8; i++) {
          x = f.x + (i === 8 ? 0 : (this.hash(i, Math.floor(f.dir * 1000)) - 0.5) * 40);
          y = f.y - 400 + i * 50;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = `rgba(200,170,255,${t * 0.4})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (1.2 - t * 0.3), 0, Math.PI * 2);
        ctx.fill();
      } else if (f.kind === 'slash') {
        const prog = 1 - t;
        ctx.fillStyle = `rgba(255,190,170,${t * 0.8})`;
        ctx.beginPath();
        const x0 = this.player.x;
        const x1 = x0 + f.dir * f.len * Math.min(1, prog * 3);
        ctx.moveTo(x0, f.y - f.r * 0.3);
        ctx.quadraticCurveTo((x0 + x1) / 2, f.y - f.r * 1.2, x1, f.y);
        ctx.quadraticCurveTo((x0 + x1) / 2, f.y + f.r * 0.6, x0, f.y + f.r * 0.3);
        ctx.fill();
      } else if (f.kind === 'burst') {
        ctx.strokeStyle = f.color;
        ctx.globalAlpha = t;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (1.6 - t), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (f.kind === 'ring') {
        ctx.strokeStyle = `rgba(124,200,255,${t})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, f.r * (1 - t) + 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private drawTexts() {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life * 3);
      ctx.font = `800 ${t.size}px system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(t.text, t.x + 1, t.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  private drawBossPointer() {
    const boss = this.enemies.find((e) => e.kind === 'reaper' && !e.dead);
    if (!boss) return;
    const p = this.player;
    const sx = (boss.x - p.x) * this.scale;
    const sy = (boss.y - p.y) * this.scale;
    if (Math.abs(sx) < this.w / 2 - 20 && Math.abs(sy) < this.h / 2 - 20) return;
    const a = Math.atan2(sy, sx);
    const m = 36;
    const k = Math.min((this.w / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (this.h / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.w / 2 + Math.cos(a) * k, this.h / 2 + Math.sin(a) * k);
    ctx.rotate(a);
    ctx.fillStyle = '#ff2a3d';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawBanner() {
    if (!this.banner || !this.running) return;
    const ctx = this.ctx;
    const a = Math.min(1, this.banner.life * 2);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const size = Math.max(20, Math.min(34, this.w / 18));
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(this.banner.text, this.w / 2 + 2, this.h * 0.28 + 2);
    ctx.fillStyle = '#ffd36b';
    ctx.fillText(this.banner.text, this.w / 2, this.h * 0.28);
    ctx.globalAlpha = 1;
  }

  private drawJoystick() {
    if (!this.joy || !this.running) return;
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
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(ox + dx * k, oy + dy * k, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}
