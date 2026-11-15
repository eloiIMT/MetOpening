import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Artwork } from '../../core/artwork';
import { ArtworkService } from '../../core/artwork.service';
import { CardIndexService } from '../../core/card-index.service';
import { CollectionService } from '../../core/collection.service';
import { RESALE_VALUE } from '../../core/game-rules';
import { DEPARTMENT_LABEL, RARITY_LABEL, formatCoins, formatCount } from '../../core/labels';
import { MetApiService } from '../../core/met-api.service';

type SaleKind = 'one' | 'duplicates';

@Component({
  selector: 'app-artwork-dialog',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './artwork-dialog.html',
  styleUrl: './artwork-dialog.scss',
})
export class ArtworkDialog {
  readonly artworkId = input.required<string>();
  readonly closed = output<void>();

  private readonly artworkService = inject(ArtworkService);
  private readonly collection = inject(CollectionService);
  private readonly cardIndex = inject(CardIndexService);
  private readonly met = inject(MetApiService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly saleDialog = viewChild.required<ElementRef<HTMLDialogElement>>('saleDialog');

  private readonly lookup = resource({
    params: () => Number(this.artworkId()),
    loader: ({ params: id }) => this.findArtwork(id),
  });

  protected readonly loading = this.lookup.isLoading;
  protected readonly failed = computed(() => this.lookup.status() === 'error');
  protected readonly saleMessage = signal('');

  protected readonly artwork = computed(() => (this.lookup.hasValue() ? this.lookup.value() : null));

  protected readonly tierLabel = computed(() => {
    const artwork = this.artwork();
    return artwork ? RARITY_LABEL[artwork.rarity] : '';
  });

  protected readonly departmentLabel = computed(() => {
    const artwork = this.artwork();
    return artwork ? DEPARTMENT_LABEL[artwork.department] : '';
  });

  protected readonly altText = computed(() => {
    const artwork = this.artwork();
    return artwork ? `${artwork.title}, ${artwork.artist ?? 'artiste non identifié'}` : '';
  });

  protected readonly record = computed(() => {
    const artwork = this.artwork();
    if (!artwork) {
      return [];
    }
    return [
      { label: 'Département', value: DEPARTMENT_LABEL[artwork.department] },
      { label: 'Date', value: artwork.date ?? 'Inconnue' },
      { label: 'Revente', value: formatCoins(RESALE_VALUE[artwork.rarity]) },
      { label: 'N° au Met', value: String(artwork.id) },
    ];
  });

  protected readonly copies = computed(() => {
    const artwork = this.artwork();
    return artwork ? this.collection.countOf(artwork.id) : 0;
  });

  protected readonly copiesLabel = computed(
    () => `Vous en possédez ${formatCount(this.copies(), 'exemplaire', 'exemplaires')}`,
  );

  private readonly unitPrice = computed(() => {
    const artwork = this.artwork();
    return artwork ? RESALE_VALUE[artwork.rarity] : 0;
  });

  protected readonly pendingSale = signal<SaleKind>('one');

  protected readonly sellOneLabel = computed(() => `Vendre 1 exemplaire · ${formatCoins(this.unitPrice())}`);

  protected readonly sellDuplicatesLabel = computed(
    () =>
      `Vendre ${formatCount(this.copies() - 1, 'double', 'doubles')} · ${formatCoins((this.copies() - 1) * this.unitPrice())}`,
  );

  protected readonly saleTitle = computed(() =>
    this.pendingSale() === 'one' ? 'Vendre un exemplaire ?' : 'Vendre les doubles ?',
  );

  protected readonly saleQuestion = computed(() => {
    if (this.pendingSale() === 'duplicates') {
      const extra = this.copies() - 1;
      return `Vous allez vendre ${formatCount(extra, 'exemplaire en double', 'exemplaires en double')} pour ${formatCoins(extra * this.unitPrice())}. Vous garderez un exemplaire.`;
    }
    const last = this.copies() === 1;
    return `Vous allez vendre 1 exemplaire pour ${formatCoins(this.unitPrice())}.${last ? ' C’est votre dernier : l’œuvre quittera votre collection.' : ''}`;
  });

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
    effect(() => {
      this.artwork();
      this.saleMessage.set('');
    });
  }

  private async findArtwork(id: number): Promise<Artwork | null> {
    const known = this.collection.owned()[id]?.artwork ?? this.artworkService.find(id);
    if (known) {
      return known;
    }
    const entry = Number.isInteger(id) ? await this.cardIndex.entry(id) : null;
    return entry ? this.met.getArtwork(entry, true) : null;
  }

  protected requestClose(): void {
    this.closed.emit();
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.requestClose();
  }

  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.requestClose();
    }
  }

  protected askSale(kind: SaleKind): void {
    this.pendingSale.set(kind);
    this.saleDialog().nativeElement.showModal();
  }

  protected confirmSale(): void {
    const artwork = this.artwork();
    if (artwork) {
      const result =
        this.pendingSale() === 'one'
          ? this.collection.sellCopy(artwork)
          : this.collection.sellDuplicates([artwork]);
      this.saleMessage.set(
        `${formatCount(result.sold, 'exemplaire vendu', 'exemplaires vendus')} pour ${formatCoins(result.coins)}.`,
      );
    }
    this.closeSale();
  }

  protected closeSale(): void {
    this.saleDialog().nativeElement.close();
  }
}
