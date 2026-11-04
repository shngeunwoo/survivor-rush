export type WeaponId = 'wand' | 'aura' | 'orbit' | 'lightning' | 'whip' | 'fire';
export type PassiveId = 'might' | 'haste' | 'speed' | 'vitality' | 'magnet' | 'regen' | 'area';

export interface UpgradeDef {
  name: string;
  icon: string;
  color: string;
  maxLevel: number;
  levels: string[];
}

export const MAX_WEAPONS = 6;
export const MAX_PASSIVES = 6;

export const WEAPONS: Record<WeaponId, UpgradeDef> = {
  wand: {
    name: '마법 지팡이',
    icon: '✦',
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
  },
  aura: {
    name: '성수 결계',
    icon: '◎',
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
  },
  orbit: {
    name: '수호 단검',
    icon: '✣',
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
  },
  lightning: {
    name: '천둥 반지',
    icon: 'ϟ',
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
  },
  whip: {
    name: '가죽 채찍',
    icon: '≋',
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
  },
  fire: {
    name: '화염병',
    icon: '♨',
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
  },
};

export const PASSIVES: Record<PassiveId, UpgradeDef> = {
  might: { name: '분노의 심장', icon: '공', color: '#ff5d6c', maxLevel: 5, levels: Array(5).fill('모든 피해량 +10%') },
  haste: { name: '빈 시계', icon: '속', color: '#6be4ff', maxLevel: 5, levels: Array(5).fill('무기 재사용 대기시간 -8%') },
  speed: { name: '날개 장화', icon: '이', color: '#b6ff6b', maxLevel: 5, levels: Array(5).fill('이동 속도 +10%') },
  vitality: { name: '거인의 갑옷', icon: '체', color: '#ffb36b', maxLevel: 5, levels: Array(5).fill('최대 체력 +20') },
  magnet: { name: '끌어당김 부적', icon: '자', color: '#6b9dff', maxLevel: 5, levels: Array(5).fill('경험치 획득 범위 +30%') },
  regen: { name: '피의 성배', icon: '회', color: '#ff6bb5', maxLevel: 5, levels: Array(5).fill('초당 체력 회복 +0.4') },
  area: { name: '확장의 서', icon: '범', color: '#e0c3ff', maxLevel: 5, levels: Array(5).fill('공격 범위 +10%') },
};

export type Choice =
  | { kind: 'weapon'; id: WeaponId; nextLevel: number }
  | { kind: 'passive'; id: PassiveId; nextLevel: number }
  | { kind: 'heal' };

export function describeChoice(c: Choice): { name: string; icon: string; color: string; desc: string; tag: string } {
  if (c.kind === 'heal') {
    return { name: '구운 닭다리', icon: '♥', color: '#ff7a7a', desc: '체력을 40 회복합니다.', tag: '회복' };
  }
  const def = c.kind === 'weapon' ? WEAPONS[c.id] : PASSIVES[c.id];
  return {
    name: def.name,
    icon: def.icon,
    color: def.color,
    desc: def.levels[c.nextLevel - 1],
    tag: c.nextLevel === 1 ? 'NEW' : `LV ${c.nextLevel}`,
  };
}

export function xpForLevel(level: number): number {
  if (level < 20) return 5 + (level - 1) * 9;
  return 176 + (level - 20) * 14;
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
    const key = c.kind === 'heal' ? 'heal' : `${c.kind}:${c.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(c);
    if (picked.length >= count) break;
  }
  if (picked.length === 0) picked.push({ kind: 'heal' });
  return picked;
}
