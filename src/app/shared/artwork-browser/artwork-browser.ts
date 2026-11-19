import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Artwork, DepartmentId } from '../../core/artworks/artwork';
import { BrowseCriteria, BrowserItem, SortDirection, SortKey, browse, filterItems, isIndexSort, summarizeDuplicates } from '../../core/artworks/browse';
import { DEPARTMENT_COLOR, rarityRows } from '../../core/artworks/charts';
import { FavoritesService } from '../../core/collection/favorites.service';
import { RARITIES, Rarity } from '../../core/game/game-rules';
import { I18n } from '../../core/i18n/i18n.service';
import { MessageKey } from '../../core/i18n/messages';
import { ArtworkCharts } from '../artwork-charts/artwork-charts';
import { CatalogCard } from '../catalog-card/catalog-card';

const DEPARTMENT_IDS = Object.keys(DEPARTMENT_COLOR) as DepartmentId[];

const SORT_OPTIONS: readonly { id: SortKey; label: MessageKey }[] = [
  { id: 'rarity', label: 'artworks.sortRarity' },
  { id: 'date', label: 'artworks.sortDate' },
  { id: 'obtained', label: 'artworks.sortObtained' },
  { id: 'title', label: 'artworks.sortTitle' },
  { id: 'artist', label: 'artworks.sortArtist' },
  { id: 'copies', label: 'artworks.sortCopies' },
];

const DIRECTION_OPTIONS: readonly { id: SortDirection; label: MessageKey }[] = [
  { id: 'asc', label: 'artworks.sortAsc' },
  { id: 'desc', label: 'artworks.sortDesc' },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
const DEFAULT_PAGE_SIZE = 50;
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
  private readonly resultsSection = viewChild<ElementRef<HTMLElement>>('resultsSection');

  protected readonly query = signal('');
  protected readonly rarities = signal<ReadonlySet<Rarity>>(new Set());
  protected readonly department = signal<DepartmentId | null>(null);
  protected readonly favoritesOnly = signal(false);
  protected readonly sort = signal<SortKey>('rarity');
  protected readonly direction = signal<SortDirection>('desc');
  protected readonly directionOptions = DIRECTION_OPTIONS;
  protected readonly filtersOpen = signal(false);
  protected readonly chartsOpen = signal(!window.matchMedia(NARROW_QUERY).matches);

  protected readonly sortOptions = computed(() =>
    this.mode() === 'search' ? SORT_OPTIONS.filter((option) => isIndexSort(option.id)) : SORT_OPTIONS,
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
    direction: this.direction(),
  }));

  private readonly filterCriteria = computed<BrowseCriteria>(() =>
    this.mode() === 'search' ? { ...this.criteria(), query: '' } : this.criteria(),
  );

  protected readonly visible = computed(() => browse(this.items(), this.filterCriteria()));

  protected readonly rarityPool = computed(() => filterItems(this.items(), this.filterCriteria(), true));

  protected readonly departmentPool = computed(() =>
    filterItems(this.items(), { ...this.filterCriteria(), department: null }),
  );

  protected readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  // Back to page 1 when the user changes a filter, not when the favorites set itself changes.
  private readonly requestedPage = linkedSignal({
    source: () => [
      this.query(),
      this.rarities(),
      this.department(),
      this.favoritesOnly(),
      this.sort(),
      this.direction(),
      this.pageSize(),
    ],
    computation: () => 0,
  });

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.visible().length / this.pageSize())));

  protected readonly page = computed(() => Math.min(Math.max(this.requestedPage(), 0), this.pageCount() - 1));

  private readonly pageStart = computed(() => this.page() * this.pageSize());

  protected readonly shownCards = computed(() =>
    this.visible()
      .slice(this.pageStart(), this.pageStart() + this.pageSize())
      .map((item) => ({ item, badge: this.badgeFor(item.copies), greyed: item.copies === 0 })),
  );

  protected readonly rangeLabel = computed(() =>
    this.t('artworks.pageRange', {
      from: this.pageStart() + 1,
      to: Math.min(this.pageStart() + this.pageSize(), this.visible().length),
      count: this.visible().length,
    }),
  );

  protected readonly pageLabel = computed(() =>
    this.t('artworks.pageOf', { page: this.page() + 1, pages: this.pageCount() }),
  );

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
    this.hasFilters()
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
    this.sort.set((event.target as HTMLSelectElement).value as SortKey);
  }

  protected pickDirection(event: Event): void {
    this.direction.set((event.target as HTMLSelectElement).value as SortDirection);
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

  protected goToPage(page: number): void {
    const before = this.page();
    this.requestedPage.set(page);
    if (this.page() !== before) {
      this.resultsSection()?.nativeElement.scrollIntoView({ block: 'start' });
    }
  }

  protected pickPageSize(event: Event): void {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
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
