import './style.css';
import { isMuted, setMuted } from './audio';
import { Game, VICTORY_TIME, type HudState, type RunResult } from './game';
import { describeChoice, PASSIVES, WEAPONS, type Choice } from './upgrades';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <canvas id="game"></canvas>

  <div class="hud" hidden>
    <div class="xp"><div class="xp-fill"></div><span class="xp-level">LV 1</span></div>
    <div class="hud-row">
      <div class="inventory">
        <div class="slots weapons"></div>
        <div class="slots passives"></div>
      </div>
      <div class="clock">00:00</div>
      <div class="hud-right">
        <div class="kills">처치 <b>0</b></div>
        <div class="hud-buttons">
          <button class="icon-btn mute-btn" aria-label="소리 켜기/끄기"></button>
          <button class="icon-btn pause-btn" aria-label="일시정지">II</button>
        </div>
      </div>
    </div>
  </div>

  <section class="overlay title-screen">
    <div class="panel">
      <p class="eyebrow">10분간 살아남아라</p>
      <h1>밤의 생존자</h1>
      <p class="lead">끝없이 몰려오는 어둠의 무리 속에서 버티세요. 공격은 자동입니다. 당신은 움직이기만 하면 됩니다.</p>
      <ul class="howto">
        <li><kbd>WASD</kbd> / <kbd>방향키</kbd> 이동 <span>· 모바일은 화면을 드래그</span></li>
        <li><span class="gem-dot"></span> 경험치 보석을 모아 레벨업하고 무기를 강화하세요</li>
        <li><kbd>Esc</kbd> 일시정지 · 3분마다 <em>죽음의 사신</em>이 찾아옵니다</li>
      </ul>
      <button class="btn primary start-btn">게임 시작</button>
      <p class="best"></p>
    </div>
  </section>

  <section class="overlay levelup-screen" hidden>
    <div class="panel wide">
      <p class="eyebrow">LEVEL UP</p>
      <h2>강화를 선택하세요</h2>
      <div class="choices"></div>
      <p class="hint">숫자키 <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> 로도 선택할 수 있습니다</p>
    </div>
  </section>

  <section class="overlay pause-screen" hidden>
    <div class="panel">
      <h2>일시정지</h2>
      <div class="pause-build"></div>
      <div class="btn-row">
        <button class="btn primary resume-btn">계속하기</button>
        <button class="btn quit-btn">포기하기</button>
      </div>
    </div>
  </section>

  <section class="overlay end-screen" hidden>
    <div class="panel">
      <p class="eyebrow end-eyebrow"></p>
      <h2 class="end-title"></h2>
      <div class="stats"></div>
      <p class="best end-best"></p>
      <button class="btn primary restart-btn">다시 도전</button>
    </div>
  </section>
`;

const $ = <T extends HTMLElement>(sel: string) => app.querySelector<T>(sel)!;
const canvas = $<HTMLCanvasElement>('#game');
const hud = $('.hud');
const titleScreen = $('.title-screen');
const levelScreen = $('.levelup-screen');
const pauseScreen = $('.pause-screen');
const endScreen = $('.end-screen');
const muteBtn = $<HTMLButtonElement>('.mute-btn');

const game = new Game(canvas);

const fmt = (t: number) => {
  const s = Math.floor(t);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

interface Best {
  time: number;
  kills: number;
}
const loadBest = (): Best | null => {
  try {
    return JSON.parse(localStorage.getItem('vs-best') ?? 'null');
  } catch {
    return null;
  }
};
const renderBest = (el: HTMLElement) => {
  const b = loadBest();
  el.textContent = b ? `최고 기록 · ${fmt(b.time)} 생존 · ${b.kills.toLocaleString()} 처치` : '';
};
renderBest($('.title-screen .best'));

const syncMute = () => {
  muteBtn.textContent = isMuted() ? '♪̸' : '♪';
  muteBtn.classList.toggle('off', isMuted());
};
syncMute();
muteBtn.addEventListener('click', () => {
  setMuted(!isMuted());
  syncMute();
});

let lastHudKey = '';
const xpFill = $('.xp-fill');
const xpLevel = $('.xp-level');
const clock = $('.clock');
const kills = $('.kills b');
const weaponSlots = $('.slots.weapons');
const passiveSlots = $('.slots.passives');

game.onHud = (h: HudState) => {
  xpFill.style.width = `${Math.min(100, (h.xp / h.xpNeed) * 100)}%`;
  xpLevel.textContent = `LV ${h.level}`;
  clock.textContent = fmt(h.time);
  clock.classList.toggle('late', h.time > VICTORY_TIME - 60);
  kills.textContent = h.kills.toLocaleString();
  const key = JSON.stringify([h.weapons, h.passives]);
  if (key !== lastHudKey) {
    lastHudKey = key;
    weaponSlots.innerHTML = slotHtml(h.weapons.map(([id, lv]) => ({ ...WEAPONS[id], lv })), 6);
    passiveSlots.innerHTML = slotHtml(h.passives.map(([id, lv]) => ({ ...PASSIVES[id], lv })), 6);
  }
};

function slotHtml(items: { icon: string; color: string; name: string; lv: number }[], total: number) {
  let html = '';
  for (let i = 0; i < total; i++) {
    const it = items[i];
    html += it
      ? `<div class="slot" style="--c:${it.color}" title="${it.name} LV ${it.lv}"><span>${it.icon}</span><i>${it.lv}</i></div>`
      : `<div class="slot empty"></div>`;
  }
  return html;
}

let currentChoices: Choice[] = [];
game.onLevelUp = (choices) => {
  currentChoices = choices;
  const wrap = $('.choices');
  wrap.innerHTML = '';
  choices.forEach((c, i) => {
    const d = describeChoice(c);
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.style.setProperty('--c', d.color);
    btn.style.animationDelay = `${i * 60}ms`;
    btn.innerHTML = `
      <span class="choice-icon">${d.icon}</span>
      <span class="choice-body">
        <span class="choice-head"><strong>${d.name}</strong><em class="${d.tag === 'NEW' ? 'new' : ''}">${d.tag}</em></span>
        <span class="choice-desc">${d.desc}</span>
      </span>
      <kbd>${i + 1}</kbd>`;
    btn.addEventListener('click', () => pick(i));
    wrap.appendChild(btn);
  });
  levelScreen.hidden = false;
};

function pick(i: number) {
  const c = currentChoices[i];
  if (!c || levelScreen.hidden) return;
  levelScreen.hidden = true;
  currentChoices = [];
  game.applyChoice(c);
}

game.onEnd = (r: RunResult) => {
  hud.hidden = true;
  levelScreen.hidden = true;
  pauseScreen.hidden = true;
  const prev = loadBest();
  const isRecord = !prev || r.time > prev.time || (Math.floor(r.time) === Math.floor(prev.time) && r.kills > prev.kills);
  if (isRecord) localStorage.setItem('vs-best', JSON.stringify({ time: r.time, kills: r.kills }));

  $('.end-eyebrow').textContent = r.victory ? '새벽이 밝았다' : '쓰러졌다…';
  $('.end-title').textContent = r.victory ? '생존 성공!' : '게임 오버';
  endScreen.classList.toggle('victory', r.victory);
  $('.stats').innerHTML = `
    <div><span>생존 시간</span><b>${fmt(r.time)}</b></div>
    <div><span>처치 수</span><b>${r.kills.toLocaleString()}</b></div>
    <div><span>도달 레벨</span><b>${r.level}</b></div>
    <div><span>총 피해량</span><b>${r.damage.toLocaleString()}</b></div>`;
  const best = $('.end-best');
  if (isRecord) best.textContent = '새로운 최고 기록!';
  else renderBest(best);
  endScreen.hidden = false;
};

function startRun() {
  titleScreen.hidden = true;
  endScreen.hidden = true;
  pauseScreen.hidden = true;
  levelScreen.hidden = true;
  hud.hidden = false;
  lastHudKey = '';
  game.start();
}

function togglePause(force?: boolean) {
  if (!game.running || !levelScreen.hidden) return;
  const next = force ?? Boolean(pauseScreen.hidden);
  game.setPaused(next);
  pauseScreen.hidden = !next;
  if (next) {
    $('.pause-build').innerHTML = `
      <div class="slots">${weaponSlots.innerHTML}</div>
      <div class="slots">${passiveSlots.innerHTML}</div>`;
  }
}

$('.start-btn').addEventListener('click', startRun);
$('.restart-btn').addEventListener('click', startRun);
$('.pause-btn').addEventListener('click', () => togglePause(true));
$('.resume-btn').addEventListener('click', () => togglePause(false));
$('.quit-btn').addEventListener('click', () => {
  pauseScreen.hidden = true;
  game.running = false;
  hud.hidden = true;
  titleScreen.hidden = false;
  renderBest($('.title-screen .best'));
});

window.addEventListener('keydown', (e) => {
  if (!levelScreen.hidden && ['1', '2', '3'].includes(e.key)) {
    pick(Number(e.key) - 1);
    return;
  }
  if (e.key === 'Escape' || e.key === 'p') togglePause();
  if (e.key === 'Enter' || e.key === ' ') {
    if (!titleScreen.hidden || !endScreen.hidden) {
      e.preventDefault();
      startRun();
    }
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.running && !game.paused) togglePause(true);
});
