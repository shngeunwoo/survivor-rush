import type { HeroPalette } from './sprites';

export type WeaponId = 'wand' | 'aura' | 'orbit' | 'lightning' | 'whip' | 'fire' | 'axe' | 'cross';
export type PassiveId = 'might' | 'haste' | 'speed' | 'vitality' | 'armor' | 'magnet' | 'regen' | 'area' | 'luck' | 'amount';
export type RelicId = 'berserk' | 'hourglass' | 'phoenix' | 'gale' | 'compass';

export interface WeaponDef {
  name: string;
  color: string;
  maxLevel: number;
  levels: string[];
  evo: { passive: PassiveId; name: string; desc: string };
}

export interface PassiveDef {
  name: string;
  color: string;
  maxLevel: number;
  desc: string;
}

export const MAX_WEAPONS = 6;
export const MAX_PASSIVES = 6;

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  wand: {
    name: '마법 지팡이',
    color: '#7cc8ff',
    maxLevel: 8,
    levels: [
      '가장 가까운 적에게 마법탄을 발사합니다.',
      '피해량 +5, 재사용 대기시간 감소',
      '마법탄 +1',
      '피해량 +5, 재사용 대기시간 감소',
      '관통 +1',
      '마법탄 +1',
      '피해량 +5, 재사용 대기시간 감소',
      '관통 +1, 마법탄 크기 증가',
    ],
    evo: { passive: 'haste', name: '천벌의 홀', desc: '쉴 새 없이 관통 마법탄을 난사합니다.' },
  },
  aura: {
    name: '성수 결계',
    color: '#9dffb0',
    maxLevel: 8,
    levels: [
      '주변의 적에게 지속 피해를 주고 밀어냅니다.',
      '범위 +10, 피해량 +3',
      '범위 +10, 피해량 +3',
      '범위 +10, 피해량 +3',
      '범위 +10, 피해량 +3',
      '범위 +10, 피해량 +3',
      '범위 +10, 피해량 +3',
      '범위 +10, 피해량 +3',
    ],
    evo: { passive: 'vitality', name: '영혼 흡수', desc: '결계가 크게 넓어지고, 적을 태울 때마다 체력을 흡수합니다.' },
  },
  orbit: {
    name: '수호 단검',
    color: '#ffd36b',
    maxLevel: 8,
    levels: [
      '플레이어 주위를 도는 단검을 소환합니다.',
      '단검 +1',
      '피해량 +4, 회전 속도 증가',
      '단검 +1',
      '피해량 +4, 회전 반경 증가',
      '단검 +1',
      '피해량 +4, 회전 속도 증가',
      '단검 +1',
    ],
    evo: { passive: 'area', name: '천상의 칼날', desc: '단검 8자루가 거대한 원을 그리며 모든 것을 베어냅니다.' },
  },
  lightning: {
    name: '천둥 반지',
    color: '#c9a6ff',
    maxLevel: 8,
    levels: [
      '화면 안의 무작위 적에게 번개를 내리칩니다.',
      '피해량 +10, 재사용 대기시간 감소',
      '번개 +1',
      '피해량 +10, 재사용 대기시간 감소',
      '번개 +1',
      '피해량 +10, 폭발 범위 증가',
      '번개 +1',
      '피해량 +10, 번개 +1',
    ],
    evo: { passive: 'might', name: '뇌신의 분노', desc: '하늘이 갈라지며 번개가 폭풍처럼 쏟아집니다.' },
  },
  whip: {
    name: '가죽 채찍',
    color: '#ff8a7a',
    maxLevel: 8,
    levels: [
      '바라보는 방향으로 채찍을 휘두릅니다.',
      '피해량 +6, 사거리 증가',
      '피해량 +6, 재사용 대기시간 감소',
      '반대 방향으로도 휘두릅니다.',
      '피해량 +6, 사거리 증가',
      '피해량 +6, 재사용 대기시간 감소',
      '피해량 +6, 사거리 증가',
      '피해량 +6, 폭 증가',
    ],
    evo: { passive: 'regen', name: '피의 채찍', desc: '피해량이 크게 늘고, 적중할 때마다 체력을 회복합니다.' },
  },
  fire: {
    name: '화염병',
    color: '#ff9f43',
    maxLevel: 8,
    levels: [
      '적 근처에 불타는 장판을 만듭니다.',
      '피해량 증가, 지속시간 증가',
      '범위 증가',
      '화염병 +1',
      '피해량 증가, 지속시간 증가',
      '범위 증가',
      '피해량 증가, 재사용 대기시간 감소',
      '화염병 +1',
    ],
    evo: { passive: 'armor', name: '지옥불', desc: '거대한 지옥불이 대지를 뒤덮습니다.' },
  },
  axe: {
    name: '전투 도끼',
    color: '#e8a060',
    maxLevel: 8,
    levels: [
      '도끼 두 자루를 높이 던져 포물선을 그리며 떨어뜨립니다.',
      '피해량 +6',
      '피해량 +10',
      '관통 +2',
      '도끼 +1',
      '피해량 +10',
      '관통 +2',
      '피해량 +10, 크기 증가',
    ],
    evo: { passive: 'luck', name: '죽음의 나선', desc: '도끼가 나선을 그리며 사방으로 끝없이 퍼져나갑니다.' },
  },
  cross: {
    name: '은빛 십자가',
    color: '#e0e8ff',
    maxLevel: 8,
    levels: [
      '가까운 적에게 십자가를 던지면 다시 되돌아옵니다.',
      '피해량 +10',
      '십자가 +1',
      '사거리 증가, 속도 증가',
      '피해량 +10',
      '십자가 +1',
      '피해량 +10',
      '크기 증가',
    ],
    evo: { passive: 'amount', name: '천상의 십자가', desc: '거대한 십자가들이 사방으로 날아갔다 되돌아옵니다.' },
  },
};

export const PASSIVES: Record<PassiveId, PassiveDef> = {
  might: { name: '분노의 심장', color: '#ff5d6c', maxLevel: 5, desc: '모든 피해량 +10%' },
  haste: { name: '빈 시계', color: '#6be4ff', maxLevel: 5, desc: '무기 재사용 대기시간 -8%' },
  speed: { name: '날개 장화', color: '#d0a070', maxLevel: 5, desc: '이동 속도 +10%' },
  vitality: { name: '거인의 심장', color: '#ff6b8a', maxLevel: 5, desc: '최대 체력 +20' },
  armor: { name: '강철 방패', color: '#b8c2d4', maxLevel: 5, desc: '받는 피해 -1' },
  magnet: { name: '끌어당김 부적', color: '#ff6b6b', maxLevel: 5, desc: '아이템 획득 범위 +30%' },
  regen: { name: '피의 성배', color: '#ffcf4a', maxLevel: 5, desc: '초당 체력 회복 +0.4' },
  area: { name: '확장의 서', color: '#b89aff', maxLevel: 5, desc: '공격 범위 +10%' },
  luck: { name: '행운의 클로버', color: '#7dff7a', maxLevel: 5, desc: '치명타 확률 +4%' },
  amount: { name: '복제의 거울', color: '#d0b0ff', maxLevel: 2, desc: '모든 발사체 수 +1' },
};

export interface SynergyDef {
  id: string;
  a: WeaponId;
  b: WeaponId;
  name: string;
  desc: string;
}

// 두 무기가 모두 최대 레벨이면 자동으로 발동
export const SYNERGIES: SynergyDef[] = [
  { id: 'storm', a: 'wand', b: 'lightning', name: '뇌전 마탄', desc: '마법탄이 적중한 적에게 낙뢰가 떨어집니다.' },
  { id: 'purgatory', a: 'aura', b: 'fire', name: '연옥', desc: '결계 피해량 +50%, 결계 범위 +20%' },
  { id: 'bladestorm', a: 'orbit', b: 'whip', name: '칼날 폭풍', desc: '단검 +4, 채찍 피해량 +30%' },
  { id: 'crusade', a: 'axe', b: 'cross', name: '성전', desc: '도끼·십자가 피해량 +40%, 크기 +25%' },
];

export interface RelicDef {
  a: PassiveId;
  b: PassiveId;
  name: string;
  desc: string;
  color: string;
}

// 두 패시브가 모두 최대 레벨이면 합성 가능
export const RELICS: Record<RelicId, RelicDef> = {
  berserk: { a: 'might', b: 'luck', name: '광전사의 인장', desc: '치명타 확률 +10%, 치명타 피해 3배', color: '#ff5d6c' },
  hourglass: { a: 'haste', b: 'amount', name: '시간술사의 모래시계', desc: '재사용 대기시간 -15%, 발사체 +1', color: '#6be4ff' },
  phoenix: { a: 'vitality', b: 'regen', name: '불사조의 심장', desc: '초당 체력 회복 +2, 부활 +1회', color: '#ff9a4a' },
  gale: { a: 'armor', b: 'speed', name: '질풍의 갑옷', desc: '방어 +2, 이동 속도 +15%', color: '#b8c2d4' },
  compass: { a: 'magnet', b: 'area', name: '별의 나침반', desc: '공격 범위 +20%, 획득 범위 2배', color: '#b89aff' },
};

export function fusableRelics(passives: Map<PassiveId, number>, relics: Set<RelicId>): RelicId[] {
  return (Object.keys(RELICS) as RelicId[]).filter((id) => {
    const r = RELICS[id];
    return !relics.has(id) && passives.get(r.a) === PASSIVES[r.a].maxLevel && passives.get(r.b) === PASSIVES[r.b].maxLevel;
  });
}

export const LIMIT_MAX = 5;
export const LIMIT_BONUS = 0.06;
export const LIMIT_DESC = `피해량 +${Math.round(LIMIT_BONUS * 100)}% (최대 ${LIMIT_MAX}회)`;

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  desc: string;
  weapon: WeaponId;
  palette: HeroPalette;
  maxHp: number;
  might: number;
  cd: number;
  speed: number;
  armor: number;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'knight',
    name: '레온',
    title: '방랑 기사',
    desc: '튼튼한 몸으로 버티는 근접형. 최대 체력 +30, 방어 +1',
    weapon: 'whip',
    palette: { H: '#9aa4b8', h: '#d0d8e4', R: '#c32a40', r: '#7c1428', B: '#3550a0', b: '#24366e' },
    maxHp: 30,
    might: 1,
    cd: 1,
    speed: 1,
    armor: 1,
  },
  {
    id: 'mage',
    name: '아리아',
    title: '견습 마법사',
    desc: '빠른 시전의 원거리형. 재사용 대기시간 -10%, 피해량 +10%',
    weapon: 'wand',
    palette: { H: '#5b3a9a', h: '#8a62d0', R: '#3a2a6a', r: '#24184a', B: '#7a4ac8', b: '#4e2c8a' },
    maxHp: -10,
    might: 1.1,
    cd: 0.9,
    speed: 1,
    armor: 0,
  },
  {
    id: 'hunter',
    name: '카이',
    title: '그림자 사냥꾼',
    desc: '날렵하게 치고 빠지는 유격형. 이동 속도 +15%',
    weapon: 'orbit',
    palette: { H: '#2f6b3a', h: '#4f9a5a', R: '#2a4a2a', r: '#183018', B: '#6b4a2a', b: '#4a321a' },
    maxHp: 0,
    might: 1,
    cd: 1,
    speed: 1.15,
    armor: 0,
  },
  {
    id: 'berserker',
    name: '브론',
    title: '북방 전사',
    desc: '묵직한 한 방의 투척형. 피해량 +15%, 최대 체력 +10, 이동 속도 -5%',
    weapon: 'axe',
    palette: { H: '#c84a2a', h: '#e87a4a', R: '#5a3a2a', r: '#3a2418', B: '#8a2a2a', b: '#5a1a1a' },
    maxHp: 10,
    might: 1.15,
    cd: 1,
    speed: 0.95,
    armor: 0,
  },
];

export type MetaId = 'might' | 'hp' | 'speed' | 'magnet' | 'growth' | 'gold' | 'revive' | 'reroll';

export interface MetaDef {
  name: string;
  icon: string;
  desc: string;
  max: number;
  base: number;
}

export const META: Record<MetaId, MetaDef> = {
  might: { name: '힘', icon: 'might', desc: '피해량 +5%', max: 5, base: 120 },
  hp: { name: '체력', icon: 'vitality', desc: '최대 체력 +10', max: 5, base: 100 },
  speed: { name: '민첩', icon: 'speed', desc: '이동 속도 +4%', max: 3, base: 150 },
  magnet: { name: '자력', icon: 'magnet', desc: '획득 범위 +15%', max: 3, base: 100 },
  growth: { name: '성장', icon: 'growth', desc: '경험치 획득 +8%', max: 5, base: 140 },
  gold: { name: '탐욕', icon: 'gold', desc: '골드 획득 +15%', max: 4, base: 110 },
  reroll: { name: '변덕', icon: 'reroll', desc: '선택지 새로고침 +1회', max: 3, base: 200 },
  revive: { name: '부활', icon: 'revive', desc: '쓰러지면 한 번 되살아납니다', max: 1, base: 900 },
};

export function metaCost(id: MetaId, level: number) {
  return Math.round(META[id].base * (1 + level * 0.8));
}

export type Choice =
  | { kind: 'weapon'; id: WeaponId; nextLevel: number }
  | { kind: 'passive'; id: PassiveId; nextLevel: number }
  | { kind: 'fuse'; id: RelicId }
  | { kind: 'limit'; id: WeaponId; nextLevel: number }
  | { kind: 'heal' }
  | { kind: 'gold' };

export interface ChoiceView {
  name: string;
  icon: string;
  color: string;
  desc: string;
  tag: string;
  level: number;
  max: number;
  hint?: string;
}

export function describeChoice(c: Choice, weapons: Map<WeaponId, number>, passives: Map<PassiveId, number>): ChoiceView {
  if (c.kind === 'heal') {
    return { name: '구운 닭다리', icon: 'heal', color: '#ff9a6a', desc: '체력을 40 회복합니다.', tag: '회복', level: 0, max: 0 };
  }
  if (c.kind === 'gold') {
    return { name: '금화 주머니', icon: 'gold', color: '#ffd04a', desc: '골드 25를 얻습니다.', tag: '골드', level: 0, max: 0 };
  }
  if (c.kind === 'fuse') {
    const r = RELICS[c.id];
    return {
      name: r.name,
      icon: `relic-${c.id}`,
      color: r.color,
      desc: r.desc,
      tag: '유물 합성',
      level: 0,
      max: 0,
      hint: `${PASSIVES[r.a].name} + ${PASSIVES[r.b].name}`,
    };
  }
  if (c.kind === 'limit') {
    return {
      name: `${WEAPONS[c.id].name} 초월`,
      icon: c.id,
      color: '#ffd36b',
      desc: LIMIT_DESC,
      tag: `★${c.nextLevel}`,
      level: 0,
      max: 0,
    };
  }
  if (c.kind === 'weapon') {
    const def = WEAPONS[c.id];
    let hint: string | undefined;
    if (c.nextLevel === def.maxLevel) {
      hint = passives.has(def.evo.passive)
        ? `진화 준비 완료 · 보물 상자에서 「${def.evo.name}」`
        : `진화 조건: ${PASSIVES[def.evo.passive].name}`;
      const syn = SYNERGIES.find((s) => (s.a === c.id && weapons.get(s.b) === WEAPONS[s.b].maxLevel) || (s.b === c.id && weapons.get(s.a) === WEAPONS[s.a].maxLevel));
      if (syn) hint += ` · 공명 「${syn.name}」 발동`;
    }
    return {
      name: def.name,
      icon: c.id,
      color: def.color,
      desc: def.levels[c.nextLevel - 1],
      tag: c.nextLevel === 1 ? 'NEW' : `LV ${c.nextLevel}`,
      level: c.nextLevel,
      max: def.maxLevel,
      hint,
    };
  }
  const def = PASSIVES[c.id];
  const evoFor = (Object.keys(WEAPONS) as WeaponId[]).find((w) => WEAPONS[w].evo.passive === c.id && weapons.has(w));
  const relic = (Object.values(RELICS) as RelicDef[]).find((r) => r.a === c.id || r.b === c.id);
  let hint = evoFor && c.nextLevel === 1 ? `「${WEAPONS[evoFor].name}」 진화 재료` : undefined;
  if (!hint && relic && c.nextLevel === def.maxLevel) hint = `유물 「${relic.name}」 합성 재료`;
  return {
    name: def.name,
    icon: c.id,
    color: def.color,
    desc: def.desc,
    tag: c.nextLevel === 1 ? 'NEW' : `LV ${c.nextLevel}`,
    level: c.nextLevel,
    max: def.maxLevel,
    hint,
  };
}

export function xpForLevel(level: number): number {
  if (level < 20) return 5 + (level - 1) * 5;
  if (level < 40) return 100 + (level - 20) * 11;
  return 320 + (level - 40) * 15;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function rollChoices(
  weapons: Map<WeaponId, number>,
  passives: Map<PassiveId, number>,
  relics: Set<RelicId> = new Set(),
  limits: Map<WeaponId, number> = new Map(),
  count = 3,
): Choice[] {
  const pool: Choice[] = [];
  for (const id of Object.keys(WEAPONS) as WeaponId[]) {
    const lv = weapons.get(id) ?? 0;
    if (lv >= WEAPONS[id].maxLevel) continue;
    if (lv === 0 && weapons.size >= MAX_WEAPONS) continue;
    pool.push({ kind: 'weapon', id, nextLevel: lv + 1 });
    // owned weapons appear more often so builds can actually grow
    if (lv > 0) pool.push({ kind: 'weapon', id, nextLevel: lv + 1 });
  }
  for (const id of Object.keys(PASSIVES) as PassiveId[]) {
    const lv = passives.get(id) ?? 0;
    if (lv >= PASSIVES[id].maxLevel) continue;
    if (lv === 0 && passives.size >= MAX_PASSIVES) continue;
    pool.push({ kind: 'passive', id, nextLevel: lv + 1 });
  }

  const picked: Choice[] = [];
  const fusable = fusableRelics(passives, relics);
  if (fusable.length) picked.push({ kind: 'fuse', id: fusable[Math.floor(Math.random() * fusable.length)] });
  const seen = new Set<string>();
  for (const c of shuffle(pool)) {
    const key = c.kind === 'weapon' || c.kind === 'passive' ? `${c.kind}:${c.id}` : c.kind;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(c);
    if (picked.length >= count) break;
  }
  const maxed = shuffle([...weapons.entries()].filter(([id, lv]) => lv >= WEAPONS[id].maxLevel));
  for (const [id] of maxed) {
    if (picked.length >= count) break;
    if ((limits.get(id) ?? 0) >= LIMIT_MAX) continue;
    picked.push({ kind: 'limit', id, nextLevel: (limits.get(id) ?? 0) + 1 });
  }
  if (picked.length === 0) picked.push({ kind: 'heal' }, { kind: 'gold' });
  return picked;
}
