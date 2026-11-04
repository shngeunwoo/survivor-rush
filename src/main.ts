import './style.css';
import fontUrl from 'galmuri/dist/Galmuri11-Bold.woff2?url';
import { isMusicOn, isSfxOn, setMusic, setSfx, sfx, startMusic, stopMusic, unlockAudio } from './audio';
import { Game, VICTORY_TIME, type ChestReward, type HudState, type RunResult } from './game';
import { heroPortrait, iconUrl } from './sprites';
import {
  CHARACTERS,
  LIMIT_BONUS,
  LIMIT_DESC,
  LIMIT_MAX,
  META,
  PASSIVES,
  RELICS,
  SYNERGIES,
  WEAPONS,
  describeChoice,
  metaCost,
  type CharacterDef,
  type Choice,
  type MetaId,
  type RelicId,
  type WeaponId,
} from './upgrades';

new FontFace('Galmuri', `url(${fontUrl})`)
  .load()
  .then((f) => document.fonts.add(f))
  .catch(() => {});

// ---------- persistence ----------
interface Save {
  gold: number;
  meta: Record<MetaId, number>;
  best: { time: number; kills: number } | null;
  lastChar: string;
}

function loadSave(): Save {
  const empty: Save = {
    gold: 0,
    meta: Object.fromEntries(Object.keys(META).map((k) => [k, 0])) as Record<MetaId, number>,
    best: null,
    lastChar: CHARACTERS[0].id,
  };
  try {
    const raw = JSON.parse(localStorage.getItem('vs-save') ?? 'null');
    if (!raw) return empty;
    return { ...empty, ...raw, meta: { ...empty.meta, ...raw.meta } };
  } catch {
    return empty;
  }
}
let save = loadSave();
const persist = () => localStorage.setItem('vs-save', JSON.stringify(save));

// ---------- markup ----------
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <canvas id="game"></canvas>

  <div class="hud" hidden>
    <div class="xp"><div class="xp-fill"></div><span class="xp-level">LV 1</span></div>
    <div class="hud-row">
      <div class="inventory">
        <div class="slots weapons"></div>
        <div class="slots passives"></div>
        <div class="slots relics"></div>
      </div>
      <div class="hud-center">
        <div class="clock">00:00</div>
        <div class="boss-bar" hidden><span>죽음의 사신</span><div><i></i></div></div>
      </div>
      <div class="hud-right">
        <div class="counter"><img src="${iconUrl('gold')}" alt="" /><b class="gold-count">0</b></div>
        <div class="counter kills-row"><span class="skull">☠</span><b class="kill-count">0</b></div>
        <button class="icon-btn pause-btn" aria-label="일시정지">❚❚</button>
      </div>
    </div>
  </div>

  <section class="screen title-screen">
    <div class="title-wrap">
      <p class="eyebrow">NIGHT SURVIVOR</p>
      <h1><span>밤의</span> 생존자</h1>
      <p class="lead">끝없이 몰려오는 어둠의 무리 속에서 새벽까지 버텨라.<br />공격은 자동, 당신은 살아남기만 하면 된다.</p>
      <div class="menu">
        <button class="btn primary big start-btn">게임 시작</button>
        <button class="btn shop-btn"><img src="${iconUrl('gold')}" alt="" />강화 상점 <b class="title-gold"></b></button>
        <button class="btn book-btn"><img src="${iconUrl('synergy')}" alt="" />조합 도감</button>
        <div class="toggles">
          <button class="chip sfx-toggle"></button>
          <button class="chip music-toggle"></button>
        </div>
      </div>
      <p class="best"></p>
      <p class="controls"><kbd>WASD</kbd> 이동 · <kbd>Esc</kbd> 일시정지 · 모바일은 화면을 드래그</p>
    </div>
  </section>

  <section class="screen select-screen" hidden>
    <div class="panel wide">
      <p class="eyebrow">CHOOSE YOUR HERO</p>
      <h2>생존자를 선택하세요</h2>
      <div class="heroes"></div>
      <button class="btn ghost back-btn">돌아가기</button>
    </div>
  </section>

  <section class="screen shop-screen" hidden>
    <div class="panel wide">
      <p class="eyebrow">PERMANENT UPGRADES</p>
      <h2>강화 상점</h2>
      <p class="wallet"><img src="${iconUrl('gold')}" alt="" /><b class="shop-gold">0</b></p>
      <div class="shop-grid"></div>
      <button class="btn ghost back-btn">돌아가기</button>
    </div>
  </section>

  <section class="screen book-screen" hidden>
    <div class="panel wide">
      <p class="eyebrow">RECIPES</p>
      <h2>조합 도감</h2>
      <div class="book"></div>
      <button class="btn ghost back-btn">돌아가기</button>
    </div>
  </section>

  <section class="screen modal levelup-screen" hidden>
    <div class="panel wide">
      <p class="eyebrow blue">LEVEL UP</p>
      <h2>강화를 선택하세요</h2>
      <div class="choices"></div>
      <div class="levelup-foot">
        <button class="btn ghost small reroll-btn"></button>
        <span class="hint"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> 선택 · <kbd>R</kbd> 새로고침</span>
      </div>
    </div>
  </section>

  <section class="screen modal chest-screen" hidden>
    <div class="panel chest-panel">
      <div class="chest-rays"></div>
      <p class="eyebrow gold">TREASURE</p>
      <h2 class="chest-title">보물 상자</h2>
      <div class="rewards"></div>
      <button class="btn primary chest-btn">받기</button>
    </div>
  </section>

  <section class="screen modal pause-screen" hidden>
    <div class="panel wide">
      <h2>일시정지</h2>
      <div class="pause-cols">
        <div>
          <h3>무기</h3>
          <div class="slots big pause-weapons"></div>
          <h3>패시브</h3>
          <div class="slots big pause-passives"></div>
          <div class="pause-combos"></div>
        </div>
        <div>
          <h3>능력치</h3>
          <dl class="stat-list"></dl>
        </div>
      </div>
      <div class="toggles">
        <button class="chip sfx-toggle"></button>
        <button class="chip music-toggle"></button>
      </div>
      <div class="btn-row">
        <button class="btn primary resume-btn">계속하기</button>
        <button class="btn ghost quit-btn">포기하고 메뉴로</button>
      </div>
    </div>
  </section>

  <section class="screen modal end-screen" hidden>
    <div class="panel wide">
      <p class="eyebrow end-eyebrow"></p>
      <h2 class="end-title"></h2>
      <div class="stats"></div>
      <div class="damage-table"></div>
      <p class="best end-best"></p>
      <div class="btn-row two">
        <button class="btn primary retry-btn">다시 도전</button>
        <button class="btn ghost menu-btn">메인 메뉴</button>
      </div>
    </div>
  </section>
`;

const $ = <T extends HTMLElement>(sel: string) => app.querySelector<T>(sel)!;
const $$ = <T extends HTMLElement>(sel: string) => [...app.querySelectorAll<T>(sel)];

const canvas = $<HTMLCanvasElement>('#game');
const hud = $('.hud');
const screens = {
  title: $('.title-screen'),
  select: $('.select-screen'),
  shop: $('.shop-screen'),
  book: $('.book-screen'),
  levelup: $('.levelup-screen'),
  chest: $('.chest-screen'),
  pause: $('.pause-screen'),
  end: $('.end-screen'),
};
type ScreenId = keyof typeof screens;

function show(id: ScreenId | null) {
  for (const [k, el] of Object.entries(screens)) el.hidden = k !== id;
}

const game = new Game(canvas);
if (import.meta.env.DEV) Object.assign(window, { __game: game });
let currentChar: CharacterDef = CHARACTERS.find((c) => c.id === save.lastChar) ?? CHARACTERS[0];

const fmt = (t: number) => {
  const s = Math.floor(t);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// ---------- sound toggles ----------
function syncToggles() {
  for (const b of $$('.sfx-toggle')) {
    b.textContent = `효과음 ${isSfxOn() ? 'ON' : 'OFF'}`;
    b.classList.toggle('off', !isSfxOn());
  }
  for (const b of $$('.music-toggle')) {
    b.textContent = `음악 ${isMusicOn() ? 'ON' : 'OFF'}`;
    b.classList.toggle('off', !isMusicOn());
  }
}
for (const b of $$('.sfx-toggle')) b.addEventListener('click', () => (setSfx(!isSfxOn()), syncToggles(), sfx.click()));
for (const b of $$('.music-toggle')) b.addEventListener('click', () => (setMusic(!isMusicOn()), syncToggles()));
syncToggles();

// ---------- title ----------
function renderTitle() {
  $('.title-gold').textContent = save.gold.toLocaleString();
  $('.best').textContent = save.best ? `최고 기록 · ${fmt(save.best.time)} 생존 · ${save.best.kills.toLocaleString()} 처치` : '';
}
renderTitle();

$('.start-btn').addEventListener('click', () => {
  unlockAudio();
  sfx.click();
  renderHeroes();
  show('select');
});
$('.shop-btn').addEventListener('click', () => {
  unlockAudio();
  sfx.click();
  renderShop();
  show('shop');
});
$('.book-btn').addEventListener('click', () => {
  unlockAudio();
  sfx.click();
  renderBook();
  show('book');
});
for (const b of $$('.back-btn')) {
  b.addEventListener('click', () => {
    sfx.click();
    renderTitle();
    show('title');
  });
}

// ---------- hero select ----------
function renderHeroes() {
  const wrap = $('.heroes');
  wrap.innerHTML = '';
  CHARACTERS.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'hero';
    btn.classList.toggle('last', c.id === save.lastChar);
    btn.style.animationDelay = `${i * 70}ms`;
    const w = WEAPONS[c.weapon];
    btn.innerHTML = `
      <div class="hero-portrait"><img src="${heroPortrait(c.palette)}" alt="" /></div>
      <div class="hero-body">
        <span class="hero-title">${c.title}</span>
        <strong>${c.name}</strong>
        <span class="hero-desc">${c.desc}</span>
        <span class="hero-weapon"><img src="${iconUrl(c.weapon)}" alt="" />시작 무기 · ${w.name}</span>
      </div>`;
    btn.addEventListener('click', () => startRun(c));
    wrap.appendChild(btn);
  });
}

// ---------- shop ----------
function renderShop() {
  $('.shop-gold').textContent = save.gold.toLocaleString();
  const grid = $('.shop-grid');
  grid.innerHTML = '';
  for (const id of Object.keys(META) as MetaId[]) {
    const def = META[id];
    const lv = save.meta[id];
    const maxed = lv >= def.max;
    const cost = metaCost(id, lv);
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <img class="shop-icon" src="${iconUrl(def.icon)}" alt="" />
      <div class="shop-body">
        <strong>${def.name}</strong>
        <span>${def.desc}</span>
        <div class="pips">${Array.from({ length: def.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>
      </div>
      <button class="btn small buy" ${maxed || save.gold < cost ? 'disabled' : ''}>${maxed ? '최대' : `<img src="${iconUrl('gold')}" alt="" />${cost}`}</button>`;
    card.querySelector('button')!.addEventListener('click', () => {
      if (maxed || save.gold < cost) return;
      save.gold -= cost;
      save.meta[id]++;
      persist();
      sfx.buy();
      renderShop();
    });
    grid.appendChild(card);
  }
}

// ---------- recipe book ----------
const ico = (id: string) => `<img src="${iconUrl(id)}" alt="" />`;
function recipeN(inputs: [string, string][], out: string, outName: string, desc: string, color: string, lore = '') {
  const items = inputs.map(([id, name]) => `<span class="recipe-item">${ico(id)}<small>${name}</small></span>`).join('<b>+</b>');
  return `
    <div class="recipe${inputs.length > 2 ? ' triple' : ''}" style="--c:${color}">
      <div class="recipe-in">${items}<b>→</b></div>
      <div class="recipe-out">${ico(out)}<span><strong>${outName}</strong>${lore ? `<i>${lore}</i>` : ''}<small>${desc}</small></span></div>
    </div>`;
}
function recipe(a: string, aName: string, b: string, bName: string, out: string, outName: string, desc: string, color: string) {
  return recipeN([[a, aName], [b, bName]], out, outName, desc, color);
}
function synergyRecipe(sy: (typeof SYNERGIES)[number]) {
  const triple = sy.parts.length === 3;
  return recipeN(
    sy.parts.map((w) => [w, `${WEAPONS[w].name} LV8`]),
    triple ? 'synergy3' : 'synergy',
    sy.name,
    sy.desc,
    triple ? '#ffd36b' : '#7cc8ff',
    sy.lore,
  );
}
function renderBook() {
  const evo = (Object.keys(WEAPONS) as WeaponId[])
    .map((id) => {
      const w = WEAPONS[id];
      const pa = PASSIVES[w.evo.passive];
      return recipe(id, `${w.name} LV8`, w.evo.passive, pa.name, id, `★ ${w.evo.name}`, w.evo.desc, '#ffd36b');
    })
    .join('');
  const syn = SYNERGIES.filter((sy) => sy.parts.length === 2).map(synergyRecipe).join('');
  const syn3 = SYNERGIES.filter((sy) => sy.parts.length === 3).map(synergyRecipe).join('');
  const rel = (Object.keys(RELICS) as RelicId[])
    .map((id) => {
      const r = RELICS[id];
      return recipe(r.a, `${PASSIVES[r.a].name} MAX`, r.b, `${PASSIVES[r.b].name} MAX`, `relic-${id}`, r.name, r.desc, r.color);
    })
    .join('');
  $('.book').innerHTML = `
    <h3>무기 진화 <em>보물 상자를 열면 진화</em></h3>${evo}
    <h3>공명 <em>두 무기가 모두 최대 레벨이면 자동 발동</em></h3>${syn}
    <h3>삼중 공명 <em>세 무기가 모두 최대 레벨이면 자동 발동 · 2개 공명과 중복 적용</em></h3>${syn3}
    <h3>유물 합성 <em>레벨업·보물 상자에서 합성</em></h3>${rel}
    <h3>초월 <em>더 강화할 것이 없을 때</em></h3>
    <div class="recipe" style="--c:#ffd36b"><div class="recipe-out">${ico('limit')}<span><strong>무기 초월</strong><small>최대 레벨 무기 ${LIMIT_DESC}</small></span></div></div>`;
}

// ---------- run ----------
function startRun(c: CharacterDef) {
  currentChar = c;
  save.lastChar = c.id;
  persist();
  sfx.click();
  show(null);
  hud.hidden = false;
  lastHudKey = '';
  game.start({ character: c, meta: { ...save.meta } });
  startMusic();
}

// ---------- HUD ----------
let lastHudKey = '';
const xpFill = $('.xp-fill');
const xpLevel = $('.xp-level');
const clock = $('.clock');
const killCount = $('.kill-count');
const goldCount = $('.gold-count');
const bossBar = $('.boss-bar');
const bossFill = $('.boss-bar i');

interface SlotItem {
  icon: string;
  color: string;
  name: string;
  label: string;
  evo?: boolean;
}

function slotsHtml(items: SlotItem[], total: number) {
  let html = '';
  for (let i = 0; i < total; i++) {
    const it = items[i];
    html += it
      ? `<div class="slot ${it.evo ? 'evo' : ''}" style="--c:${it.color}" title="${it.name}"><img src="${iconUrl(it.icon)}" alt="" />${it.label ? `<i>${it.label}</i>` : ''}</div>`
      : `<div class="slot empty"></div>`;
  }
  return html;
}

let lastHud: HudState | null = null;
game.onHud = (h) => {
  lastHud = h;
  xpFill.style.width = `${Math.min(100, (h.xp / h.xpNeed) * 100)}%`;
  xpLevel.textContent = `LV ${h.level}`;
  clock.textContent = fmt(h.time);
  clock.classList.toggle('late', h.time > VICTORY_TIME - 60);
  killCount.textContent = h.kills.toLocaleString();
  goldCount.textContent = h.gold.toLocaleString();
  bossBar.hidden = h.boss < 0;
  if (h.boss >= 0) bossFill.style.width = `${h.boss * 100}%`;
  const key = JSON.stringify([h.weapons, h.passives, h.relics]);
  if (key !== lastHudKey) {
    lastHudKey = key;
    $('.slots.weapons').innerHTML = weaponSlots(h);
    $('.slots.passives').innerHTML = passiveSlots(h);
    $('.slots.relics').innerHTML = relicSlots(h);
  }
};

const weaponSlots = (h: HudState) =>
  slotsHtml(
    h.weapons.map(([id, lv, evo, limit]) => ({
      icon: id,
      color: evo ? '#ffd36b' : WEAPONS[id].color,
      name: evo ? WEAPONS[id].evo.name : WEAPONS[id].name,
      label: limit ? `★${limit}` : evo ? '★' : String(lv),
      evo: evo || limit > 0,
    })),
    6,
  );
const passiveSlots = (h: HudState) =>
  slotsHtml(
    h.passives.map(([id, lv]) => ({ icon: id, color: PASSIVES[id].color, name: PASSIVES[id].name, label: lv >= PASSIVES[id].maxLevel ? 'M' : String(lv) })),
    6,
  );
const relicSlots = (h: HudState) =>
  slotsHtml(
    h.relics.map((id) => ({ icon: `relic-${id}`, color: RELICS[id].color, name: RELICS[id].name, label: '', evo: true })),
    h.relics.length,
  );

// ---------- level up ----------
let currentChoices: Choice[] = [];
game.onLevelUp = (choices) => {
  currentChoices = choices;
  const { weapons, passives } = game.build;
  const wrap = $('.choices');
  wrap.innerHTML = '';
  choices.forEach((c, i) => {
    const d = describeChoice(c, weapons, passives);
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.style.setProperty('--c', d.color);
    btn.style.animationDelay = `${i * 60}ms`;
    const pips = d.max ? `<span class="pips">${Array.from({ length: d.max }, (_, k) => `<i class="${k < d.level ? 'on' : ''}"></i>`).join('')}</span>` : '';
    btn.innerHTML = `
      <span class="choice-icon"><img src="${iconUrl(d.icon)}" alt="" /></span>
      <span class="choice-body">
        <span class="choice-head"><strong>${d.name}</strong><em class="${d.tag === 'NEW' ? 'new' : c.kind === 'fuse' || c.kind === 'limit' ? 'special' : ''}">${d.tag}</em></span>
        <span class="choice-desc">${d.desc}</span>
        ${d.hint ? `<span class="choice-hint">${d.hint}</span>` : ''}
        ${pips}
      </span>
      <kbd>${i + 1}</kbd>`;
    btn.addEventListener('click', () => pick(i));
    wrap.appendChild(btn);
  });
  const rr = $<HTMLButtonElement>('.reroll-btn');
  rr.innerHTML = `<img src="${iconUrl('reroll')}" alt="" />새로고침 ${game.rerolls}`;
  rr.disabled = game.rerolls <= 0;
  show('levelup');
};

function pick(i: number) {
  const c = currentChoices[i];
  if (!c || screens.levelup.hidden) return;
  sfx.click();
  show(null);
  currentChoices = [];
  game.applyChoice(c);
}

$('.reroll-btn').addEventListener('click', () => {
  sfx.click();
  game.reroll();
});

// ---------- chest ----------
game.onChest = (rewards: ChestReward[]) => {
  const evo = rewards.some((r) => r.evo);
  $('.chest-title').textContent = evo ? '무기 진화!' : rewards.length > 1 ? '전설의 보물 상자' : '보물 상자';
  screens.chest.classList.toggle('evo', evo);
  const wrap = $('.rewards');
  wrap.innerHTML = rewards
    .map(
      (r, i) => `
      <div class="reward ${r.evo ? 'evo' : ''}" style="--c:${r.color};animation-delay:${200 + i * 280}ms">
        <span class="choice-icon"><img src="${iconUrl(r.icon)}" alt="" /></span>
        <span class="choice-body"><strong>${r.evo ? '★ ' : ''}${r.name}</strong><span class="choice-desc">${r.desc}</span></span>
      </div>`,
    )
    .join('');
  show('chest');
};

function closeChest() {
  if (screens.chest.hidden) return;
  sfx.click();
  show(null);
  game.closeChest();
}
$('.chest-btn').addEventListener('click', closeChest);

// ---------- pause ----------
function togglePause(force?: boolean) {
  if (!game.running) return;
  if (!screens.levelup.hidden || !screens.chest.hidden) return;
  const next = force ?? Boolean(screens.pause.hidden);
  game.setPaused(next);
  show(next ? 'pause' : null);
  if (next && lastHud) {
    $('.pause-weapons').innerHTML = weaponSlots(lastHud);
    $('.pause-passives').innerHTML = passiveSlots(lastHud);
    const relics = lastHud.relics.map((id) => `<li style="--c:${RELICS[id].color}">${ico(`relic-${id}`)}<span><strong>${RELICS[id].name}</strong><small>${RELICS[id].desc}</small></span></li>`);
    const syns = SYNERGIES.filter((sy) => lastHud!.synergies.includes(sy.id)).map(
      (sy) =>
        sy.parts.length === 3
          ? `<li style="--c:#ffd36b">${ico('synergy3')}<span><strong>삼중 공명 · ${sy.name}</strong><small>${sy.desc}</small></span></li>`
          : `<li style="--c:#7cc8ff">${ico('synergy')}<span><strong>공명 · ${sy.name}</strong><small>${sy.desc}</small></span></li>`,
    );
    const limits = lastHud.weapons
      .filter(([, , , l]) => l > 0)
      .map(([id, , , l]) => `<li style="--c:#ffd36b">${ico('limit')}<span><strong>${WEAPONS[id].name} 초월 ★${l}/${LIMIT_MAX}</strong><small>피해량 +${Math.round(l * LIMIT_BONUS * 100)}%</small></span></li>`);
    const all = [...syns, ...relics, ...limits];
    $('.pause-combos').innerHTML = all.length ? `<h3>조합 효과</h3><ul class="combo-list">${all.join('')}</ul>` : '';
    $('.stat-list').innerHTML = game.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  }
}
$('.pause-btn').addEventListener('click', () => togglePause(true));
$('.resume-btn').addEventListener('click', () => togglePause(false));
$('.quit-btn').addEventListener('click', () => {
  game.stop();
  stopMusic();
  hud.hidden = true;
  renderTitle();
  show('title');
});

// ---------- end ----------
game.onEnd = (r: RunResult) => {
  stopMusic();
  hud.hidden = true;
  const isRecord = !save.best || r.time > save.best.time + 0.5 || (Math.abs(r.time - save.best.time) <= 0.5 && r.kills > save.best.kills);
  if (isRecord) save.best = { time: r.time, kills: r.kills };
  save.gold += r.gold;
  persist();

  $('.end-eyebrow').textContent = r.victory ? 'DAWN HAS COME' : 'YOU HAVE FALLEN';
  $('.end-title').textContent = r.victory ? '새벽이 밝았다!' : '어둠에 삼켜졌다';
  screens.end.classList.toggle('victory', r.victory);
  $('.stats').innerHTML = `
    <div><span>생존 시간</span><b>${fmt(r.time)}</b></div>
    <div><span>처치 수</span><b>${r.kills.toLocaleString()}</b></div>
    <div><span>도달 레벨</span><b>${r.level}</b></div>
    <div class="gold-stat"><span>획득 골드</span><b><img src="${iconUrl('gold')}" alt="" />${r.gold.toLocaleString()}</b></div>`;
  const max = Math.max(1, ...r.damage.map(([, d]) => d));
  $('.damage-table').innerHTML = r.damage.length
    ? `<h3>무기별 피해량</h3>` +
      r.damage
        .map(
          ([id, d]) => `
        <div class="dmg-row" style="--c:${WEAPONS[id].color}">
          <img src="${iconUrl(id)}" alt="" />
          <span class="dmg-name">${WEAPONS[id].name}</span>
          <span class="dmg-bar"><i style="width:${(d / max) * 100}%"></i></span>
          <b>${Math.round(d).toLocaleString()}</b>
        </div>`,
        )
        .join('')
    : '';
  $('.end-best').textContent = isRecord ? '새로운 최고 기록!' : save.best ? `최고 기록 · ${fmt(save.best.time)}` : '';
  setTimeout(() => show('end'), 700);
};

$('.retry-btn').addEventListener('click', () => startRun(currentChar));
$('.menu-btn').addEventListener('click', () => {
  sfx.click();
  renderTitle();
  show('title');
});

// ---------- keyboard ----------
window.addEventListener('keydown', (e) => {
  if (!screens.levelup.hidden) {
    if (['1', '2', '3'].includes(e.key)) pick(Number(e.key) - 1);
    if (e.key.toLowerCase() === 'r' || e.key === 'ㄱ') game.reroll();
    return;
  }
  if (!screens.chest.hidden) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeChest();
    }
    return;
  }
  if (e.key === 'Escape' || e.key.toLowerCase() === 'p') togglePause();
  if ((e.key === 'Enter' || e.key === ' ') && !screens.title.hidden) {
    e.preventDefault();
    $('.start-btn').click();
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.running && !game.paused) togglePause(true);
});
