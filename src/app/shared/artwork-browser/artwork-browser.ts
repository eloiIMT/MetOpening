import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Artwork, DepartmentId } from '../../core/artworks/artwork';
import { BrowseCriteria, BrowserItem, SortId, browse, filterItems, summarizeDuplicates } from '../../core/artworks/browse';
import { DEPARTMENT_COLOR, rarityRows } from '../../core/artworks/charts';
import { RARITY_RANK, Rarity } from '../../core/game/game-rules';
import { I18n } from '../../core/i18n/i18n.service';
import { MessageKey } from '../../core/i18n/messages';
import { ArtworkCharts } from '../artwork-charts/artwork-charts';
import { CatalogCard } from '../catalog-card/catalog-card';
import { FavoritesService } from '../../core/collection/favorites.service';

const RARITIES = (Object.keys(RARITY_RANK) as Rarity[]).sort((a, b) => RARITY_RANK[a] - RARITY_RANK[b]);

const DEPARTMENT_IDS = Object.keys(DEPARTMENT_COLOR) as DepartmentId[];

const SORT_OPTIONS: readonly { id: SortId; label: MessageKey }[] = [
  { id: 'rarity-asc', label: 'artworks.sortRarityAsc' },
  { id: 'rarity-desc', label: 'artworks.sortRarityDesc' },
  { id: 'recent', label: 'artworks.sortRecent' },
  { id: 'title', label: 'artworks.sortTitle' },
];

const PAGE_SIZE = 24;
const PRELOAD_MARGIN = '600px 0px';
const NARROW_QUERY = '(max-width: 899.98px)';

@Component({
  selector: 'app-artwork-browser',
  imports: [ArtworkCharts, CatalogCard, RouterLink],
  templateUrl: './artwork-browser.html',
  styleUrl: './artwork-browser.scss',
})
export class ArtworkBrowser {
  readonly items = input.required<readonly BrowserItem[]>();
  readonly mode = input<'collection' | 'search'>('collection');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly note = input<string | null>(null);
  readonly sellDuplicates = output<readonly Artwork[]>();
  readonly queryChange = output<string>();

  private readonly i18n = inject(I18n);
  private readonly favoritesService = inject(FavoritesService);
  protected readonly t = this.i18n.t;

  private readonly saleDialog = viewChild<ElementRef<HTMLDialogElement>>('saleDialog');
  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  protected readonly query = signal('');
  protected readonly rarities = signal<ReadonlySet<Rarity>>(new Set());
  protected readonly department = signal<DepartmentId | null>(null);
  protected readonly favoritesOnly = signal(false);
  protected readonly sort = signal<SortId>('rarity-desc');
  protected readonly filtersOpen = signal(false);
  protected readonly chartsOpen = signal(!window.matchMedia(NARROW_QUERY).matches);

  protected readonly sortOptions = computed(() =>
    this.mode() === 'search' ? SORT_OPTIONS.filter((option) => option.id.startsWith('rarity')) : SORT_OPTIONS,
  );

  protected readonly searchLabel = computed(() =>
    this.t(this.mode() === 'search' ? 'artworks.searchAll' : 'artworks.searchCollection'),
  );

  protected readonly departmentOptions = computed(() =>
    DEPARTMENT_IDS.map((value) => ({ value, label: this.t(`departments.${value}`) })).sort((a, b) =>
      a.label.localeCompare(b.label, this.i18n.tag()),
    ),
  );

  private readonly criteria = computed<BrowseCriteria>(() => ({
    query: this.query(),
    rarities: this.rarities(),
    department: this.department(),
    favorites: this.favoritesOnly() ? this.favoritesService.favorites() : null,
    sort: this.sort(),
  }));

  private readonly filterCriteria = computed<BrowseCriteria>(() =>
    this.mode() === 'search' ? { ...this.criteria(), query: '' } : this.criteria(),
  );

  protected readonly visible = computed(() => browse(this.items(), this.filterCriteria()));

  protected readonly rarityPool = computed(() => filterItems(this.items(), this.filterCriteria(), true));

  protected readonly departmentPool = computed(() =>
    filterItems(this.items(), { ...this.filterCriteria(), department: null }),
  );

  private readonly limit = linkedSignal({
    source: this.criteria,
    computation: () => PAGE_SIZE,
  });

  protected readonly shownCards = computed(() =>
    this.visible()
      .slice(0, this.limit())
      .map((item) => ({ item, badge: this.badgeFor(item.copies), greyed: item.copies === 0 })),
  );

  protected readonly hasMore = computed(() => this.limit() < this.visible().length);

  protected readonly progressLabel = computed(() =>
    this.t('artworks.progress', { shown: this.shownCards().length, count: this.visible().length }),
  );

  protected readonly moreLabel = computed(() => {
    const next = Math.min(PAGE_SIZE, this.visible().length - this.limit());
    return this.t('artworks.more', { count: next });
  });

  protected readonly rarityOptions = computed(() => {
    const rows = rarityRows(this.rarityPool());
    return RARITIES.map((rarity) => ({
      rarity,
      label: this.t(`rarities.${rarity}`),
      color: `var(--rarity-${rarity})`,
      checked: this.rarities().has(rarity),
      count: this.i18n.number(rows.find((row) => row.key === rarity)?.value ?? 0),
    }));
  });

  protected readonly activeFilterCount = computed(
    () => this.rarities().size + (this.department() === null ? 0 : 1) + (this.favoritesOnly() ? 1 : 0) + (this.query().trim() === '' ? 0 : 1),
  );

  protected readonly hasFilters = computed(() => this.activeFilterCount() > 0);

  protected readonly filtersToggleLabel = computed(() =>
    this.activeFilterCount() > 0
      ? this.t('artworks.filtersCount', { count: this.activeFilterCount() })
      : this.t('artworks.filters'),
  );

  protected readonly resultLabel = computed(() => {
    const shown = this.t('common.artworks', { count: this.visible().length });
    return this.visible().length < this.items().length
      ? this.t('artworks.resultOf', { shown, total: this.i18n.number(this.items().length) })
      : shown;
  });

  protected readonly duplicates = computed(() => summarizeDuplicates(this.visible()));

  protected readonly saleLabel = computed(() => {
    const { copies, coins } = this.duplicates();
    return copies === 0
      ? this.t('artworks.saleNone')
      : this.t('artworks.saleLabel', { count: copies, coins: this.t('common.coins', { count: coins }) });
  });

  protected readonly saleQuestion = computed(() => {
    const { copies, coins } = this.duplicates();
    return this.t('artworks.saleQuestion', { count: copies, coins: this.t('common.coins', { count: coins }) });
  });

  constructor() {
    effect((onCleanup) => {
      this.limit();
      const element = this.sentinel()?.nativeElement;
      if (!element) {
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.loadMore();
          }
        },
        { rootMargin: PRELOAD_MARGIN },
      );
      observer.observe(element);
      onCleanup(() => observer.disconnect());
    });
  }

  protected typeQuery(event: Event): void {
    this.setQuery((event.target as HTMLInputElement).value);
  }

  private setQuery(query: string): void {
    this.query.set(query);
    this.queryChange.emit(query);
  }

  protected toggleRarity(rarity: Rarity): void {
    this.rarities.update((current) => {
      const next = new Set(current);
      if (next.has(rarity)) {
        next.delete(rarity);
      } else {
        next.add(rarity);
      }
      return next;
    });
  }

  protected pickDepartment(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.department.set(value === 'all' ? null : (value as DepartmentId));
  }

  protected pickSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as SortId);
  }

  protected toggleCharts(): void {
    this.chartsOpen.update((open) => !open);
  }

  protected toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  protected toggleFavoritesOnly(): void {
    this.favoritesOnly.update((on) => !on);
  }

  protected clearFilters(): void {
    this.setQuery('');
    this.rarities.set(new Set());
    this.department.set(null);
    this.favoritesOnly.set(false);
  }

  protected loadMore(): void {
    if (this.hasMore()) {
      this.limit.update((limit) => limit + PAGE_SIZE);
    }
  }

  protected askSale(): void {
    this.saleDialog()?.nativeElement.showModal();
  }

  protected confirmSale(): void {
    this.sellDuplicates.emit(this.visible().flatMap((item) => (item.artwork ? [item.artwork] : [])));
    this.closeSale();
  }

  protected closeSale(): void {
    this.saleDialog()?.nativeElement.close();
  }

  private badgeFor(copies: number): string | null {
    if (this.mode() === 'search') {
      return copies > 0 ? this.t('artworks.badgeOwned') : null;
    }
    return copies > 1 ? `×${copies}` : null;
  }
}
