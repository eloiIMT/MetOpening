import { Artwork, DepartmentId } from './artwork';
import { RARITY_RANK, Rarity } from './game-rules';

export interface ChartRow<K> {
  readonly key: K;
  readonly value: number;
  readonly share: number;
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

export function rarityRows(artworks: readonly Artwork[]): ChartRow<Rarity>[] {
  return withShares(
    RARITIES.map((rarity) => ({ key: rarity, value: artworks.filter((artwork) => artwork.rarity === rarity).length })),
  );
}

export function departmentRows(artworks: readonly Artwork[]): ChartRow<DepartmentId>[] {
  const counts = new Map<DepartmentId, number>();
  for (const artwork of artworks) {
    counts.set(artwork.department, (counts.get(artwork.department) ?? 0) + 1);
  }
  return withShares([...counts].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value));
}

export function centuryRows(artworks: readonly Artwork[]): ChartRow<Century>[] {
  const counts = new Map<number, { key: Century; value: number }>();
  for (const artwork of artworks) {
    if (artwork.year === null) {
      continue;
    }
    const century = centuryOf(artwork.year);
    const entry = counts.get(century.order) ?? { key: century, value: 0 };
    counts.set(century.order, { ...entry, value: entry.value + 1 });
  }
  return withShares([...counts.values()].sort((a, b) => a.key.order - b.key.order));
}

function withShares<K>(rows: readonly { key: K; value: number }[]): ChartRow<K>[] {
  const nonEmpty = rows.filter((row) => row.value > 0);
  const total = nonEmpty.reduce((sum, row) => sum + row.value, 0);
  return nonEmpty.map((row) => ({ ...row, share: total === 0 ? 0 : row.value / total }));
}
