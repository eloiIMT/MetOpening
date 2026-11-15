import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArtworkService } from '../../core/artwork.service';
import { CollectionService } from '../../core/collection.service';
import { RESALE_VALUE } from '../../core/game-rules';
import { DEPARTMENT_LABEL, RARITY_LABEL, formatCoins, formatCount } from '../../core/labels';

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
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly saleDialog = viewChild.required<ElementRef<HTMLDialogElement>>('saleDialog');

  protected readonly loading = this.artworkService.isLoading;
  protected readonly saleMessage = signal('');

  protected readonly artwork = computed(() => this.artworkService.find(Number(this.artworkId())) ?? null);

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
