export interface Sprite {
  frames: HTMLCanvasElement[];
  white: HTMLCanvasElement[];
  w: number;
  h: number;
}

type Palette = Record<string, string>;

const OUTLINE = '#0c0910';

function paint(rows: string[], pal: Palette, scale: number, mode: 'color' | 'white'): HTMLCanvasElement {
  const gw = rows[0].length;
  const gh = rows.length;
  const c = document.createElement('canvas');
  c.width = (gw + 2) * scale;
  c.height = (gh + 2) * scale;
  const ctx = c.getContext('2d')!;
  const filled = (x: number, y: number) => y >= 0 && y < gh && x >= 0 && x < gw && pal[rows[y][x]] !== undefined;

  ctx.fillStyle = mode === 'white' ? '#ffffff' : OUTLINE;
  for (let y = -1; y <= gh; y++) {
    for (let x = -1; x <= gw; x++) {
      if (filled(x, y)) continue;
      if (filled(x + 1, y) || filled(x - 1, y) || filled(x, y + 1) || filled(x, y - 1)) {
        ctx.fillRect((x + 1) * scale, (y + 1) * scale, scale, scale);
      }
    }
  }
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const col = pal[rows[y][x]];
      if (!col) continue;
      ctx.fillStyle = mode === 'white' ? '#ffffff' : col;
      ctx.fillRect((x + 1) * scale, (y + 1) * scale, scale, scale);
    }
  }
  return c;
}

function sprite(frames: string[][], pal: Palette, scale: number): Sprite {
  const f = frames.map((r) => paint(r, pal, scale, 'color'));
  const w = frames.map((r) => paint(r, pal, scale, 'white'));
  return { frames: f, white: w, w: f[0].width, h: f[0].height };
}

// ---------- characters ----------
const HERO_TOP = [
  '....HHHHH....',
  '...HHhhhHH...',
  '...HSSSSSH...',
  '...SSESSES...',
  '...SSSSSSS...',
  '....SSSSS....',
  '..rRRBBBRRr..',
  '.rRRBBYBBRRr.',
  '.rRBBBBBBBRr.',
  '.rR.BBBBB.Rr.',
  '.r..bBBBb..r.',
  '....bbbbb....',
];
const HERO_A = [...HERO_TOP, '....DD.DD....', '....DD.DD....', '...DDD.DDD...'];
const HERO_B = [...HERO_TOP, '....DDDD.....', '....DD.DD....', '...DD...DD...'];

export interface HeroPalette {
  H: string;
  h: string;
  R: string;
  r: string;
  B: string;
  b: string;
}

export function heroSprite(p: HeroPalette): Sprite {
  return sprite([HERO_A, HERO_B], { ...p, S: '#f2c79b', E: '#1a1020', Y: '#ffd36b', D: '#3a2a20' }, 3);
}

// ---------- enemies ----------
const BAT: Palette = { P: '#3f2360', p: '#7a4fb0', R: '#ff4040' };
const ZOMBIE: Palette = { G: '#6e9a55', g: '#4c7038', Y: '#f0e060', T: '#7a5a3a', t: '#5a3f28', N: '#3a4a6a', k: '#1a1a1a' };
const SKELETON: Palette = { W: '#e8e2d0', w: '#a8a090', k: '#141018', R: '#ff5040' };
const GHOST: Palette = { C: '#cdeef8', c: '#86c4dc', k: '#20304a' };
const GOLEM: Palette = { S: '#8a7a6a', s: '#5e5248', L: '#b0a090', O: '#ffb030', m: '#5a7a3a' };
const REAPER: Palette = { k: '#1a0c16', K: '#3a2036', R: '#ff2a3d' };
const WITCH: Palette = { P: '#4a2a7a', p: '#2e1850', g: '#7cc068', Y: '#ffe040', H: '#6a4a2a', O: '#ff5ad0' };

let cache: ReturnType<typeof buildAll> | null = null;

function buildAll() {
  return {
    bat: sprite(
      [
        [
          'P............P',
          'PP..........PP',
          'PpP..pppp..PpP',
          '.PpPpppppppPp.',
          '..PPpRppRpPP..',
          '....pppppp....',
          '.....p..p.....',
          '..............',
        ],
        [
          '..............',
          '......pp......',
          '....pRppRp....',
          '..PPppppppPP..',
          '.PpPppppppPpP.',
          'PpP..pppp..PpP',
          'PP...p..p...PP',
          'P............P',
        ],
      ],
      BAT,
      3,
    ),
    zombie: sprite(
      [
        [
          '....GGGG....',
          '...GGGGGg...',
          '...GGYGGY...',
          '...GGGGGg...',
          '...GGGkkg...',
          '....GGGg....',
          '...TTTTTTGGG',
          '...TtTTTT...',
          '...TtTTTTGGG',
          '...TtTTTT...',
          '...NNNNNN...',
          '...NN..NN...',
          '...NN..NN...',
          '..ggg..ggg..',
        ],
        [
          '....GGGG....',
          '...GGGGGg...',
          '...GGYGGY...',
          '...GGGGGg...',
          '...GGGkkg...',
          '....GGGg....',
          '...TTTTTTGGG',
          '...TtTTTT...',
          '...TtTTTTGGG',
          '...TtTTTT...',
          '...NNNNNN...',
          '...NN.NN....',
          '..NN...NN...',
          '.ggg...ggg..',
        ],
      ],
      ZOMBIE,
      3,
    ),
    skeleton: sprite(
      [
        [
          '....WWWW....',
          '...WWWWWW...',
          '...WkkWkkW..',
          '...WRkWRkW..',
          '...WWWWWW...',
          '....WkWkW...',
          '.....ww.....',
          '...wWWWWw...',
          '..w.WkWk.w..',
          '..w.WWWW.w..',
          '....wkkw....',
          '....w..w....',
          '....w..w....',
          '...ww..ww...',
        ],
        [
          '....WWWW....',
          '...WWWWWW...',
          '...WkkWkkW..',
          '...WRkWRkW..',
          '...WWWWWW...',
          '....WkWkW...',
          '.....ww.....',
          '...wWWWWw...',
          '..w.WkWk.w..',
          '..w.WWWW.w..',
          '....wkkw....',
          '....w.w.....',
          '...w...w....',
          '..ww...ww...',
        ],
      ],
      SKELETON,
      3,
    ),
    ghost: sprite(
      [
        [
          '....CCCC....',
          '..CCCCCCCC..',
          '.CCCCCCCCCc.',
          '.CCkkCCkkCc.',
          '.CCkkCCkkCc.',
          '.CCCCCCCCCc.',
          '.CCCCkkCCCc.',
          '.CCCCCCCCCc.',
          '.CCCCCCCCCc.',
          '.cCCCCCCCCc.',
          '.cC.cCC.cCc.',
          '.c...c...c..',
        ],
        [
          '....CCCC....',
          '..CCCCCCCC..',
          '.CCCCCCCCCc.',
          '.CCkkCCkkCc.',
          '.CCkkCCkkCc.',
          '.CCCCCCCCCc.',
          '.CCCCkkCCCc.',
          '.CCCCCCCCCc.',
          '.CCCCCCCCCc.',
          '.cCCCCCCCCc.',
          '..cC.cCC.cC.',
          '...c...c...c',
        ],
      ],
      GHOST,
      3,
    ),
    golem: sprite(
      [
        [
          '......SSSS......',
          '.....SLLSSs.....',
          '.....SOSSOs.....',
          '.....SSSSSs.....',
          '..mSSSSSSSSSSm..',
          '.SLLSSSSSSSSSSs.',
          '.SLSSSmSSSSSSSs.',
          '.SSS.SSSSSSS.Ss.',
          '.sSS.SSSSSSs.ss.',
          '.ss..SSSSSSs..s.',
          '.....SSSSSSs....',
          '.....SSs.SSs....',
          '....SSSs.SSSs...',
          '....sss..ssss...',
        ],
      ],
      GOLEM,
      4,
    ),
    reaper: sprite(
      [
        [
          '.....kkkk.....',
          '....kKKKKk....',
          '...kKkkkkKk...',
          '...kKkRkRkKk..',
          '...kKkkkkKk...',
          '...kKKkkKKk...',
          '..kKKKKKKKKk..',
          '..kKKKKKKKKk..',
          '.kKKKKKKKKKKk.',
          '.kKKKKKKKKKKk.',
          '.kKKKKKKKKKKk.',
          'kKKKKKKKKKKKKk',
          'kKKKKKKKKKKKKk',
          'kKKkKKKkKKKkKk',
          'k.k.k.kk.k.k.k',
        ],
      ],
      REAPER,
      5,
    ),
    witch: sprite(
      [
        [
          '.....PP.....',
          '....PPP.....',
          '...PPPPP....',
          '..PPPPPPP...',
          'PPPPPPPPPPP.',
          '...gggg.....',
          '...gYgY.....',
          '...gggg.....',
          '..pPPPPp..O.',
          '.pPPPPPPp.H.',
          '.pPPPPPPp.H.',
          '..PPPPPP..H.',
          '..PPPPPP..H.',
          '..pp..pp..H.',
        ],
        [
          '.....PP.....',
          '....PPP.....',
          '...PPPPP....',
          '..PPPPPPP...',
          'PPPPPPPPPPP.',
          '...gggg.....',
          '...gYgY.....',
          '...gggg...O.',
          '..pPPPPp..H.',
          '.pPPPPPPp.H.',
          '.pPPPPPPp.H.',
          '..PPPPPP..H.',
          '..PPPPPP....',
          '..p.pp.p....',
        ],
      ],
      WITCH,
      3,
    ),

    // ---------- pickups / props ----------
    gemBlue: gem('#bfe6ff', '#4aa8ff', '#2860c0'),
    gemGreen: gem('#d8ffd0', '#4adf6a', '#1f8a3a'),
    gemRed: gem('#ffd0d8', '#ff4a6a', '#a01a3a'),
    coin: sprite([['.YYYY.', 'YYyyYY', 'YyYYYY', 'YyYYYY', 'YYyyYY', '.YYYY.']], { Y: '#ffd04a', y: '#c88a1a' }, 2),
    chicken: sprite(
      [['...BBBB..', '..BBBBBB.', '.BBbBBBBB', 'WWBBBBBBB', 'WW.BBBBB.', '....BBB..']],
      { B: '#c9783a', b: '#f0b070', W: '#f1e6d2' },
      3,
    ),
    chest: sprite(
      [
        [
          '.BBBBBBBBBB.',
          'BbbbbbbbbbbB',
          'BbYYYYYYYYbB',
          'BYYYYYYYYYYB',
          'BBBBBYYBBBBB',
          'BbbbbYkbbbbB',
          'BbbbbYYbbbbB',
          'BbbbbbbbbbbB',
          'BYYYYYYYYYYB',
          'BBBBBBBBBBBB',
        ],
      ],
      { B: '#7a4a1f', b: '#a8682c', Y: '#ffcf4a', k: '#2a1a0a' },
      3,
    ),
    magnet: sprite([MAGNET], { R: '#ff4d5e', W: '#e8e8f0' }, 3),
    tomb: sprite(
      [['..SSSS..', '.SLLLLs.', 'SLLkkLLs', 'SLkkkkLs', 'SLLkkLLs', 'SLLkkLLs', 'SLLLLLLs', 'SLLLLLLs', 'ssssssss', 'gggggggg']],
      { S: '#6a6e78', L: '#8a8e98', k: '#4a4e58', s: '#4a4e58', g: '#2e4a2a' },
      4,
    ),
    tree: sprite(
      [
        [
          '..t.....t..',
          '..t..t..t..',
          '...t.t.t...',
          't...ttt...t',
          '.t...t...t.',
          '..t..t..t..',
          '...t.t.t...',
          '....ttt....',
          '.....t.....',
          '.....t.....',
          '.....T.....',
          '....TTT....',
          '....TTT....',
          '...TTTTT...',
        ],
      ],
      { t: '#3a2a22', T: '#4a3428' },
      5,
    ),
    rock: sprite([['..SSSS...', '.SLLLSSs.', 'SLLSSSSss', 'SSSSSSsss', '.sssssss.']], { S: '#4a5058', L: '#6a7078', s: '#363a42' }, 4),
    candle: sprite(
      [['...Y...', '..YOY..', '..YOY..', '...W...', '..WWW..', '..WWW..', '..WWW..', '.kkkkk.']],
      { Y: '#ffe070', O: '#ff9030', W: '#e8e0d0', k: '#5a4a3a' },
      3,
    ),
  };
}

const MAGNET = ['.RRRRRRR.', 'RRRRRRRRR', 'RRR...RRR', 'RRR...RRR', 'RRR...RRR', 'RRR...RRR', 'WWW...WWW', 'WWW...WWW'];

function gem(hi: string, base: string, dark: string): Sprite {
  return sprite([['..A..', '.ABa.', 'ABBBa', 'ABBBa', 'ABBBa', '.aBa.', '..a..']], { A: hi, B: base, a: dark }, 2);
}

export function sprites() {
  if (!cache) cache = buildAll();
  return cache;
}

// ---------- icons (for DOM) ----------
const ICONS: Record<string, { rows: string[]; pal: Palette }> = {
  wand: {
    rows: ['......BBB.', '.....BWBB.', '.....BBBB.', '....HBBB..', '...HH.....', '..HH......', '.HH.......', 'HH........', 'H.........'],
    pal: { B: '#4aa8ff', W: '#e8f6ff', H: '#a8743a' },
  },
  aura: {
    rows: ['...GGGG...', '..G....G..', '.G.gggg.G.', 'G.g....g.G', 'G.g.WW.g.G', 'G.g.WW.g.G', 'G.g....g.G', '.G.gggg.G.', '..G....G..', '...GGGG...'],
    pal: { G: '#7dff9a', g: '#3fbf6a', W: '#e8fff0' },
  },
  orbit: {
    rows: ['.........W', '........WW', '.......WL.', '......WL..', '.....WL...', '..Y.WL....', '...YW.....', '..HYY.....', '.HH..Y....', 'HH........'],
    pal: { W: '#f4f4ff', L: '#b0b4c8', Y: '#ffd36b', H: '#7a4a2a' },
  },
  lightning: {
    rows: ['....YYYY..', '...YYYY...', '..YYYY....', '.YYYYYYY..', '....YYY...', '...YYY....', '..YYY.....', '.YY.......', 'Y.........'],
    pal: { Y: '#e0c8ff' },
  },
  whip: {
    rows: ['HH........', 'HH.R......', '.H..R.....', '..H..R....', '...H..R...', '....HH.R..', '......H.R.', '.......H.R', '........HR', '.........R'],
    pal: { H: '#6a3a1a', R: '#ff8a7a' },
  },
  fire: {
    rows: ['....WW....', '....kk....', '...GGGG...', '..GOOOOG..', '.GOYYYOOG.', '.GOYRYOOG.', '.GOORROOG.', '.GOOOOOOG.', '..GGGGGG..'],
    pal: { W: '#e8e0d0', k: '#6a4a2a', G: '#9ad0e0', O: '#ff9f43', Y: '#ffe070', R: '#ff4a3a' },
  },
  might: {
    rows: ['....RR....', '...RRRR...', '..RRYYRR..', '.RRYYYYRR.', '.RYYWWYYR.', '.RYYWWYYR.', '.RRYYYYRR.', '..RRRRRR..', '...RRRR...'],
    pal: { R: '#ff4a5a', Y: '#ffb04a', W: '#fff0c0' },
  },
  haste: {
    rows: ['..kkkkkk..', '.kWWWWWWk.', 'kWWWkWWWWk', 'kWWWkWWWWk', 'kWWWkkkWWk', 'kWWWWWWWWk', 'kWWWWWWWWk', '.kWWWWWWk.', '..kkkkkk..'],
    pal: { k: '#3aa8c8', W: '#e8faff' },
  },
  speed: {
    rows: ['...BBBB...', '...BBBB.W.', '...BBBBWW.', '...BBBB.W.', '...BBBBB..', '..BBBBBBB.', '.BBBBBBBBB', '.kkkkkkkkk'],
    pal: { B: '#9a6a3a', W: '#e8f0ff', k: '#4a3020' },
  },
  vitality: {
    rows: ['.RR...RR..', 'RRRR.RRRR.', 'RWRRRRRRR.', 'RRRRRRRRR.', '.RRRRRRR..', '..RRRRR...', '...RRR....', '....R.....'],
    pal: { R: '#ff4a6a', W: '#ffd0d8' },
  },
  armor: {
    rows: ['SSSSSSSSSS', 'SLLLLLLLLS', 'SLLLYYLLLS', 'SLLYYYYLLS', 'SLLLYYLLLS', '.SLLLLLLS.', '.SLLLLLLS.', '..SLLLLS..', '...SLLS...', '....SS....'],
    pal: { S: '#7a8498', L: '#b8c2d4', Y: '#ffd36b' },
  },
  magnet: { rows: MAGNET, pal: { R: '#ff4d5e', W: '#e8e8f0' } },
  regen: {
    rows: ['RRRRRRRRRR', 'YRRRRRRRRY', 'YYRRRRRRYY', '.YYYYYYYY.', '..YYYYYY..', '....YY....', '....YY....', '...YYYY...', '..YYYYYY..'],
    pal: { R: '#c8183a', Y: '#ffcf4a' },
  },
  area: {
    rows: ['PPPPPPPPP.', 'PYPPPPPPPW', 'PYPPYYPPPW', 'PYPYYYYPPW', 'PYPPYYPPPW', 'PYPPPPPPPW', 'PPPPPPPPPW', '.WWWWWWWWW'],
    pal: { P: '#7a4ac8', Y: '#ffd36b', W: '#e8e0f0' },
  },
  heal: {
    rows: ['...BBBB..', '..BBBBBB.', '.BBbBBBBB', 'WWBBBBBBB', 'WW.BBBBB.', '....BBB..'],
    pal: { B: '#c9783a', b: '#f0b070', W: '#f1e6d2' },
  },
  gold: {
    rows: ['.YYYY.', 'YYyyYY', 'YyYYYY', 'YyYYYY', 'YYyyYY', '.YYYY.'],
    pal: { Y: '#ffd04a', y: '#c88a1a' },
  },
  growth: {
    rows: ['..A..', '.ABa.', 'ABBBa', 'ABBBa', 'ABBBa', '.aBa.', '..a..'],
    pal: { A: '#bfe6ff', B: '#4aa8ff', a: '#2860c0' },
  },
  revive: {
    rows: ['...YY...', '...YY...', 'YYYYYYYY', 'YYYYYYYY', '...YY...', '...YY...', '...YY...', '...YY...'],
    pal: { Y: '#ffe9a0' },
  },
  reroll: {
    rows: ['..GGGG..', '.G....G.', 'G......G', 'G...GGGG', 'G....GG.', '.G....G.', '..GGGG..'],
    pal: { G: '#9fd8ff' },
  },
  axe: {
    rows: ['..SSSS....', '.SWWSSS...', '.SSSSSSH..', '..SSSSHH..', '....HH....', '...HH.....', '..HH......', '.HH.......', 'HH........'],
    pal: { S: '#c8ccd8', W: '#ffffff', H: '#8a5a2a' },
  },
  cross: {
    rows: ['...WW...', '...WW...', 'WWWWWWWW', 'WWWYYWWW', '...WW...', '...WW...', '...WW...', '...WW...'],
    pal: { W: '#e8f0ff', Y: '#ffd36b' },
  },
  luck: {
    rows: ['.GG..GG.', 'GGGGGGGG', 'GGGGGGGG', '.GGGGGG.', 'GGGGGGGG', 'GGGGGGGG', '.GG.kGG.', '....k...', '...k....'],
    pal: { G: '#5adf5a', k: '#2a7a2a' },
  },
  amount: {
    rows: ['.YYYYYY.', 'YBBBBBBY', 'YBWBBBBY', 'YBBWBBBY', 'YBBBBBBY', 'YBBBBBBY', '.YYYYYY.', '...YY...', '..YYYY..'],
    pal: { Y: '#c8a0ff', B: '#5a4a9a', W: '#e8e0ff' },
  },
  limit: {
    rows: ['....Y....', '...YYY...', 'YYYYWYYYY', '.YYYYYYY.', '..YYYYY..', '.YYY.YYY.', 'YY.....YY'],
    pal: { Y: '#ffd36b', W: '#fff8d0' },
  },
  synergy: {
    rows: ['.PP..CC.', 'P..PC..C', 'P..CP..C', 'P..CP..C', 'P..PC..C', '.PP..CC.'],
    pal: { P: '#ff8a7a', C: '#7cc8ff' },
  },
  'relic-berserk': relic('#ffb0b8', '#ff3a50', '#8a1020'),
  'relic-hourglass': relic('#d0f8ff', '#3ac8f0', '#16608a'),
  'relic-phoenix': relic('#ffe0b0', '#ff8a2a', '#9a3a10'),
  'relic-gale': relic('#ffffff', '#b8c2d4', '#5a6478'),
  'relic-compass': relic('#e8d8ff', '#9a6aff', '#4a2a9a'),
};

function relic(hi: string, base: string, dark: string) {
  return {
    rows: ['..YYYY..', '.YAAAAY.', 'YAWBBBaY', 'YABBBBaY', 'YABBBBaY', 'YaBBBaaY', '.YaaaaY.', '..YYYY..'],
    pal: { Y: '#ffd36b', A: hi, W: '#ffffff', B: base, a: dark },
  };
}

const iconCache = new Map<string, string>();
export function iconUrl(id: string): string {
  let url = iconCache.get(id);
  if (url) return url;
  const def = ICONS[id];
  if (!def) return '';
  const w = Math.max(...def.rows.map((r) => r.length));
  const rows = def.rows.map((r) => r.padEnd(w, '.'));
  url = paint(rows, def.pal, 4, 'color').toDataURL();
  iconCache.set(id, url);
  return url;
}

export function heroPortrait(p: HeroPalette): string {
  return heroSprite(p).frames[0].toDataURL();
}
