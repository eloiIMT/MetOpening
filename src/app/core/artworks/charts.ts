import { DepartmentId } from './artwork';
import { RARITY_RANK, Rarity } from '../game/game-rules';

export interface ChartRow<K> {
  readonly key: K;
  readonly value: number;
  readonly share: number;
}

export interface ChartItem {
  readonly rarity: Rarity;
  readonly department: DepartmentId;
  readonly century: number | null;
}

export interface Century {
  readonly order: number;
  readonly number: number;
  readonly beforeCommonEra: boolean;
}

const RARITIES = (Object.keys(RARITY_RANK) as Rarity[]).sort((a, b) => RARITY_RANK[a] - RARITY_RANK[b]);

export const DEPARTMENT_COLOR: Readonly<Record<DepartmentId, string>> = {
  'european-paintings': '#2A78D6',
  'drawings-prints': '#EB6834',
  'american-wing': '#1BAF7A',
  'european-sculpture': '#EDA100',
  'asian-art': '#E87BA4',
  photographs: '#008300',
  'musical-instruments': '#6250D6',
  'greek-roman': '#E34948',
  'islamic-art': '#184F95',
  'egyptian-art': '#A35A1F',
  'arms-armor': '#5F6167',
  'ancient-west-asian': '#8C6D2C',
  'africa-oceania-americas': '#C2410C',
  cloisters: '#4D7C0F',
  'costume-institute': '#BE185D',
  libraries: '#64748B',
  'medieval-art': '#7C2D12',
  'modern-contemporary': '#0E7490',
  'robert-lehman': '#9D174D',
};

export const SERIES_COLOR = '#2A78D6';

export function pieSlicePath(start: number, end: number, center = 100, radius = 96): string {
  const round = (value: number) => Math.round(value * 100) / 100;
  if (end - start >= 0.9999) {
    return `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius} Z`;
  }
  const point = (fraction: number) => {
    const angle = fraction * 2 * Math.PI - Math.PI / 2;
    return `${round(center + radius * Math.cos(angle))} ${round(center + radius * Math.sin(angle))}`;
  };
  const largeArc = end - start > 0.5 ? 1 : 0;
  return `M ${center} ${center} L ${point(start)} A ${radius} ${radius} 0 ${largeArc} 1 ${point(end)} Z`;
}

export function centuryOf(year: number): Century {
  if (year < 0) {
    const number = Math.ceil(-year / 100);
    return { order: -number, number, beforeCommonEra: true };
  }
  const number = Math.floor(year / 100) + 1;
  return { order: number, number, beforeCommonEra: false };
}

export function centuryFromOrder(order: number): Century {
  return { order, number: Math.abs(order), beforeCommonEra: order < 0 };
}

export function rarityRows(items: readonly ChartItem[]): ChartRow<Rarity>[] {
  const counts = new Map<Rarity, number>();
  for (const item of items) {
    counts.set(item.rarity, (counts.get(item.rarity) ?? 0) + 1);
  }
  return withShares(RARITIES.map((rarity) => ({ key: rarity, value: counts.get(rarity) ?? 0 })));
}

export function departmentRows(items: readonly ChartItem[]): ChartRow<DepartmentId>[] {
  const counts = new Map<DepartmentId, number>();
  for (const item of items) {
    counts.set(item.department, (counts.get(item.department) ?? 0) + 1);
  }
  return withShares([...counts].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value));
}

export function centuryRows(items: readonly ChartItem[]): ChartRow<Century>[] {
  const counts = new Map<number, number>();
  for (const item of items) {
    if (item.century !== null) {
      counts.set(item.century, (counts.get(item.century) ?? 0) + 1);
    }
  }
  return withShares(
    [...counts]
      .sort(([a], [b]) => a - b)
      .map(([order, value]) => ({ key: centuryFromOrder(order), value })),
  );
}

function withShares<K>(rows: readonly { key: K; value: number }[]): ChartRow<K>[] {
  const nonEmpty = rows.filter((row) => row.value > 0);
  const total = nonEmpty.reduce((sum, row) => sum + row.value, 0);
  return nonEmpty.map((row) => ({ ...row, share: total === 0 ? 0 : row.value / total }));
}
