import type { HeroPalette } from './sprites';

export type WeaponId = 'wand' | 'aura' | 'orbit' | 'lightning' | 'whip' | 'fire';
export type PassiveId = 'might' | 'haste' | 'speed' | 'vitality' | 'armor' | 'magnet' | 'regen' | 'area';

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
};

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
  if (c.kind === 'weapon') {
    const def = WEAPONS[c.id];
    let hint: string | undefined;
    if (c.nextLevel === def.maxLevel) {
      hint = passives.has(def.evo.passive)
        ? `진화 준비 완료 · 보물 상자에서 「${def.evo.name}」`
        : `진화 조건: ${PASSIVES[def.evo.passive].name}`;
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
  return {
    name: def.name,
    icon: c.id,
    color: def.color,
    desc: def.desc,
    tag: c.nextLevel === 1 ? 'NEW' : `LV ${c.nextLevel}`,
    level: c.nextLevel,
    max: def.maxLevel,
    hint: evoFor && c.nextLevel === 1 ? `「${WEAPONS[evoFor].name}」 진화 재료` : undefined,
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

export function rollChoices(weapons: Map<WeaponId, number>, passives: Map<PassiveId, number>, count = 3): Choice[] {
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
  const seen = new Set<string>();
  for (const c of shuffle(pool)) {
    const key = c.kind === 'weapon' || c.kind === 'passive' ? `${c.kind}:${c.id}` : c.kind;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(c);
    if (picked.length >= count) break;
  }
  if (picked.length === 0) picked.push({ kind: 'heal' }, { kind: 'gold' });
  return picked;
}
