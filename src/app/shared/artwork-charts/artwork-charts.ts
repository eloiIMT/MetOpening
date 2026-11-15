import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { DepartmentId } from '../../core/artworks/artwork';
import {
  Century,
  ChartItem,
  DEPARTMENT_COLOR,
  SERIES_COLOR,
  centuryRows,
  departmentRows,
  pieSlicePath,
  rarityRows,
} from '../../core/artworks/charts';
import { Rarity } from '../../core/game/game-rules';
import { I18n } from '../../core/i18n/i18n.service';
import { MessageKey } from '../../core/i18n/messages';

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

const DATA_OPTIONS: readonly { id: ChartData; label: MessageKey }[] = [
  { id: 'rarity', label: 'artworks.chartDataRarity' },
  { id: 'department', label: 'artworks.chartDataDepartment' },
  { id: 'century', label: 'artworks.chartDataCentury' },
];

const TYPE_LABEL: Readonly<Record<ChartType, MessageKey>> = {
  pie: 'artworks.chartTypePie',
  bar: 'artworks.chartTypeBar',
  column: 'artworks.chartTypeColumn',
};

const SUMMARY_LABEL: Readonly<Record<ChartData, MessageKey>> = {
  rarity: 'artworks.chartSummaryRarity',
  department: 'artworks.chartSummaryDepartment',
  century: 'artworks.chartSummaryCentury',
};

const AXIS_LABEL_COUNT = 5;

@Component({
  selector: 'app-artwork-charts',
  templateUrl: './artwork-charts.html',
  styleUrl: './artwork-charts.scss',
})
export class ArtworkCharts {
  readonly rarityPool = input.required<readonly ChartItem[]>();
  readonly departmentPool = input.required<readonly ChartItem[]>();
  readonly visible = input.required<readonly ChartItem[]>();
  readonly activeRarities = input.required<ReadonlySet<Rarity>>();
  readonly activeDepartment = input.required<DepartmentId | null>();

  readonly closed = output<void>();

  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;

  protected readonly dataOptions = DATA_OPTIONS;
  protected readonly data = signal<ChartData>('rarity');
  protected readonly readout = signal<string | null>(null);

  protected readonly type = linkedSignal<ChartData, ChartType>({
    source: this.data,
    computation: (data) => (data === 'century' ? 'column' : 'pie'),
  });

  protected readonly typeOptions = computed(() => {
    const types: ChartType[] = this.data() === 'century' ? ['column'] : ['pie', 'bar'];
    return types.map((id) => ({ id, label: this.t(TYPE_LABEL[id]) }));
  });

  private readonly rawEntries = computed<ChartEntry[]>(() => {
    switch (this.data()) {
      case 'rarity':
        return rarityRows(this.rarityPool()).map((row) => ({
          id: row.key,
          label: this.t(`rarities.${row.key}`),
          longLabel: this.t(`rarities.${row.key}`),
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
          label: this.centuryLabel(row.key, false),
          longLabel: this.centuryLabel(row.key, true),
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
      valueLabel: `(${entry.value}) ${this.percentLabel(entry.share)}`,
      readout: this.t('artworks.chartReadout', {
        label: entry.longLabel,
        artworks: this.t('common.artworks', { count: entry.value }),
        percent: this.percentLabel(entry.share),
      }),
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
    return this.t(SUMMARY_LABEL[this.data()], {
      details: this.entries()
        .map((entry) => entry.readout)
        .join(' ; '),
    });
  });

  protected readonly hint = computed(() =>
    this.t(this.data() === 'century' ? 'artworks.chartHintCentury' : 'artworks.chartHintDefault'),
  );

  protected pickData(event: Event): void {
    this.data.set((event.target as HTMLSelectElement).value as ChartData);
    this.readout.set(null);
  }

  protected pickType(event: Event): void {
    this.type.set((event.target as HTMLSelectElement).value as ChartType);
    this.readout.set(null);
  }

  private percentLabel(share: number): string {
    return this.t('artworks.chartPercent', { value: Math.round(share * 100) });
  }

  private ordinal(number: number): string {
    let key: MessageKey;
    if (this.i18n.locale() === 'fr') {
      key = number === 1 ? 'artworks.ordinalSt' : 'artworks.ordinalTh';
    } else if (number % 100 >= 11 && number % 100 <= 13) {
      key = 'artworks.ordinalTh';
    } else if (number % 10 === 1) {
      key = 'artworks.ordinalSt';
    } else if (number % 10 === 2) {
      key = 'artworks.ordinalNd';
    } else if (number % 10 === 3) {
      key = 'artworks.ordinalRd';
    } else {
      key = 'artworks.ordinalTh';
    }
    return this.t(key, { number });
  }

  private centuryLabel(century: Century, long: boolean): string {
    const ordinal = this.ordinal(century.number);
    const bce = century.beforeCommonEra;
    if (long) {
      return this.t(bce ? 'artworks.centuryLongBce' : 'artworks.centuryLong', { ordinal });
    }
    return this.t(bce ? 'artworks.centuryShortBce' : 'artworks.centuryShort', { ordinal });
  }

  private departmentEntries(): ChartEntry[] {
    return departmentRows(this.departmentPool()).map((row) => ({
      id: row.key,
      label: this.t(`departments.${row.key}`),
      longLabel: this.t(`departments.${row.key}`),
      value: row.value,
      share: row.share,
      color: DEPARTMENT_COLOR[row.key],
      active: this.activeDepartment() === row.key,
      pickable: true,
    }));
  }
}
