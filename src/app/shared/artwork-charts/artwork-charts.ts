import { Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { Artwork, DepartmentId } from '../../core/artwork';
import {
  Century,
  DEPARTMENT_COLOR,
  SERIES_COLOR,
  centuryRows,
  departmentRows,
  pieSlicePath,
  rarityRows,
} from '../../core/charts';
import { Rarity } from '../../core/game-rules';
import { DEPARTMENT_LABEL, RARITY_LABEL, formatCount } from '../../core/labels';

type ChartData = 'rarity' | 'department' | 'century';
type ChartType = 'pie' | 'bar' | 'column';

interface ChartEntry {
  readonly id: string;
  readonly label: string;
  readonly longLabel: string;
  readonly value: number;
  readonly share: number;
  readonly color: string;
  readonly active: boolean;
  readonly pickable: boolean;
}

const DATA_OPTIONS: readonly { id: ChartData; label: string }[] = [
  { id: 'rarity', label: 'Rareté' },
  { id: 'department', label: 'Département' },
  { id: 'century', label: 'Siècle' },
];

const TYPE_LABEL: Readonly<Record<ChartType, string>> = {
  pie: 'Camembert',
  bar: 'Barres',
  column: 'Colonnes',
};

const AXIS_LABEL_COUNT = 5;

function percentLabel(share: number): string {
  return `${Math.round(share * 100)} %`;
}

function centuryLabel(century: Century, long: boolean): string {
  const ordinal = century.number === 1 ? '1er' : `${century.number}e`;
  if (long) {
    return `${ordinal} siècle${century.beforeCommonEra ? ' av. J.-C.' : ''}`;
  }
  return `${ordinal}${century.beforeCommonEra ? ' av.' : ''}`;
}

@Component({
  selector: 'app-artwork-charts',
  templateUrl: './artwork-charts.html',
  styleUrl: './artwork-charts.scss',
})
export class ArtworkCharts {
  readonly rarityPool = input.required<readonly Artwork[]>();
  readonly departmentPool = input.required<readonly Artwork[]>();
  readonly visible = input.required<readonly Artwork[]>();
  readonly activeRarities = input.required<ReadonlySet<Rarity>>();
  readonly activeDepartment = input.required<DepartmentId | null>();

  readonly closed = output<void>();

  protected readonly dataOptions = DATA_OPTIONS;
  protected readonly data = signal<ChartData>('rarity');
  protected readonly readout = signal<string | null>(null);

  protected readonly type = linkedSignal<ChartData, ChartType>({
    source: this.data,
    computation: (data) => (data === 'century' ? 'column' : 'pie'),
  });

  protected readonly typeOptions = computed(() => {
    const types: ChartType[] = this.data() === 'century' ? ['column'] : ['pie', 'bar'];
    return types.map((id) => ({ id, label: TYPE_LABEL[id] }));
  });

  private readonly rawEntries = computed<ChartEntry[]>(() => {
    switch (this.data()) {
      case 'rarity':
        return rarityRows(this.rarityPool()).map((row) => ({
          id: row.key,
          label: RARITY_LABEL[row.key],
          longLabel: RARITY_LABEL[row.key],
          value: row.value,
          share: row.share,
          color: `var(--rarity-${row.key})`,
          active: this.activeRarities().has(row.key),
          pickable: true,
        }));
      case 'department':
        return this.departmentEntries();
      case 'century':
        return centuryRows(this.visible()).map((row) => ({
          id: String(row.key.order),
          label: centuryLabel(row.key, false),
          longLabel: centuryLabel(row.key, true),
          value: row.value,
          share: row.share,
          color: SERIES_COLOR,
          active: false,
          pickable: false,
        }));
    }
  });

  protected readonly entries = computed(() => {
    const entries = this.rawEntries();
    const max = Math.max(1, ...entries.map((entry) => entry.value));
    const step = Math.max(1, Math.ceil(entries.length / AXIS_LABEL_COUNT));
    return entries.map((entry, index) => ({
      ...entry,
      width: (entry.value / max) * 100,
      height: (entry.value / max) * 100,
      showLabel: index % step === 0 || index === entries.length - 1,
      valueLabel: `(${entry.value}) ${percentLabel(entry.share)}`,
      readout: `${entry.longLabel} : ${formatCount(entry.value, 'œuvre', 'œuvres')} (${percentLabel(entry.share)})`,
    }));
  });

  protected readonly pieSlices = computed(() => {
    let cursor = 0;
    return this.entries().map((entry) => {
      const start = cursor;
      cursor += entry.share;
      return { id: entry.id, color: entry.color, readout: entry.readout, path: pieSlicePath(start, cursor) };
    });
  });

  protected readonly summary = computed(() => {
    const title = DATA_OPTIONS.find((option) => option.id === this.data())?.label ?? '';
    return `Répartition par ${title.toLowerCase()} : ${this.entries()
      .map((entry) => entry.readout)
      .join(' ; ')}`;
  });

  protected readonly hint = computed(() =>
    this.data() === 'century'
      ? 'Survolez le graphique pour voir le détail.'
      : 'Répartition des œuvres affichées.',
  );

  protected pickData(event: Event): void {
    this.data.set((event.target as HTMLSelectElement).value as ChartData);
    this.readout.set(null);
  }

  protected pickType(event: Event): void {
    this.type.set((event.target as HTMLSelectElement).value as ChartType);
    this.readout.set(null);
  }

  private departmentEntries(): ChartEntry[] {
    return departmentRows(this.departmentPool()).map((row) => ({
      id: row.key,
      label: DEPARTMENT_LABEL[row.key],
      longLabel: DEPARTMENT_LABEL[row.key],
      value: row.value,
      share: row.share,
      color: DEPARTMENT_COLOR[row.key],
      active: this.activeDepartment() === row.key,
      pickable: true,
    }));
  }
}
