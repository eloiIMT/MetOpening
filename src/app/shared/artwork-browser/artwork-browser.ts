import { Component, ElementRef, booleanAttribute, computed, input, output, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Artwork, DepartmentId } from '../../core/artwork';
import { BrowseCriteria, BrowserItem, SortId, browse, filterItems, summarizeDuplicates } from '../../core/browse';
import { RARITY_RANK, Rarity } from '../../core/game-rules';
import { DEPARTMENT_LABEL, RARITY_LABEL, formatCoins, formatCount } from '../../core/labels';
import { ArtworkCard } from '../artwork-card/artwork-card';

const RARITIES = (Object.keys(RARITY_RANK) as Rarity[]).sort((a, b) => RARITY_RANK[a] - RARITY_RANK[b]);

const SORT_OPTIONS: readonly { id: SortId; label: string }[] = [
  { id: 'rarity-asc', label: 'Rareté : moins rares d’abord' },
  { id: 'rarity-desc', label: 'Rareté : plus rares d’abord' },
  { id: 'recent', label: 'Date d’obtention : récentes d’abord' },
  { id: 'title', label: 'Titre (A → Z)' },
];

@Component({
  selector: 'app-artwork-browser',
  imports: [ArtworkCard, RouterLink],
  templateUrl: './artwork-browser.html',
  styleUrl: './artwork-browser.scss',
})
export class ArtworkBrowser {
  readonly items = input.required<readonly BrowserItem[]>();
  readonly mode = input<'collection' | 'search'>('collection');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly sellDuplicates = output<readonly Artwork[]>();

  private readonly saleDialog = viewChild<ElementRef<HTMLDialogElement>>('saleDialog');

  protected readonly query = signal('');
  protected readonly rarities = signal<ReadonlySet<Rarity>>(new Set());
  protected readonly department = signal<DepartmentId | null>(null);
  protected readonly sort = signal<SortId>('rarity-asc');
  protected readonly filtersOpen = signal(false);

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly departmentOptions = (Object.keys(DEPARTMENT_LABEL) as DepartmentId[])
    .map((value) => ({ value, label: DEPARTMENT_LABEL[value] }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'));

  private readonly criteria = computed<BrowseCriteria>(() => ({
    query: this.query(),
    rarities: this.rarities(),
    department: this.department(),
    sort: this.sort(),
  }));

  private readonly visible = computed(() => browse(this.items(), this.criteria()));

  protected readonly cards = computed(() =>
    this.visible().map((item) => ({
      artwork: item.artwork,
      badge: item.copies > 1 ? `×${item.copies}` : null,
      greyed: item.copies === 0,
    })),
  );

  protected readonly rarityOptions = computed(() => {
    const pool = filterItems(this.items(), this.criteria(), true);
    return RARITIES.map((rarity) => ({
      rarity,
      label: RARITY_LABEL[rarity],
      color: `var(--rarity-${rarity})`,
      checked: this.rarities().has(rarity),
      count: pool.filter((item) => item.artwork.rarity === rarity).length,
    }));
  });

  protected readonly activeFilterCount = computed(
    () => this.rarities().size + (this.department() === null ? 0 : 1) + (this.query().trim() === '' ? 0 : 1),
  );

  protected readonly hasFilters = computed(() => this.activeFilterCount() > 0);

  protected readonly filtersToggleLabel = computed(() =>
    this.activeFilterCount() > 0 ? `Filtres (${this.activeFilterCount()})` : 'Filtres',
  );

  protected readonly resultLabel = computed(() => {
    const shown = formatCount(this.visible().length, 'œuvre', 'œuvres');
    return this.hasFilters() ? `${shown} sur ${this.items().length}` : shown;
  });

  protected readonly duplicates = computed(() => summarizeDuplicates(this.visible()));

  protected readonly saleLabel = computed(() => {
    const { copies, coins } = this.duplicates();
    return copies === 0
      ? 'Aucun double à vendre'
      : `Vendre ${formatCount(copies, 'double', 'doubles')} · ${formatCoins(coins)}`;
  });

  protected readonly saleQuestion = computed(() => {
    const { copies, coins } = this.duplicates();
    return `Vous allez vendre ${formatCount(copies, 'exemplaire en double', 'exemplaires en double')} pour ${formatCoins(coins)}. Un exemplaire de chaque œuvre reste dans votre collection.`;
  });

  protected typeQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
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

  protected clearFilters(): void {
    this.query.set('');
    this.rarities.set(new Set());
    this.department.set(null);
  }

  protected toggleFilters(): void {
    this.filtersOpen.update((open) => !open);
  }

  protected askSale(): void {
    this.saleDialog()?.nativeElement.showModal();
  }

  protected confirmSale(): void {
    this.sellDuplicates.emit(this.visible().map((item) => item.artwork));
    this.closeSale();
  }

  protected closeSale(): void {
    this.saleDialog()?.nativeElement.close();
  }
}
