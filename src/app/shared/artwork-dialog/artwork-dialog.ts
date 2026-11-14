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

  private readonly duplicateCoins = computed(() => {
    const artwork = this.artwork();
    return artwork ? (this.copies() - 1) * RESALE_VALUE[artwork.rarity] : 0;
  });

  protected readonly saleLabel = computed(
    () => `Vendre ${formatCount(this.copies() - 1, 'double', 'doubles')} · ${formatCoins(this.duplicateCoins())}`,
  );

  protected readonly saleQuestion = computed(
    () =>
      `Vous allez vendre ${formatCount(this.copies() - 1, 'exemplaire en double', 'exemplaires en double')} pour ${formatCoins(this.duplicateCoins())}. Vous garderez un exemplaire.`,
  );

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

  protected askSale(): void {
    this.saleDialog().nativeElement.showModal();
  }

  protected confirmSale(): void {
    const artwork = this.artwork();
    if (artwork) {
      const result = this.collection.sellDuplicates([artwork]);
      this.saleMessage.set(`${formatCount(result.sold, 'double vendu', 'doubles vendus')} pour ${formatCoins(result.coins)}.`);
    }
    this.closeSale();
  }

  protected closeSale(): void {
    this.saleDialog().nativeElement.close();
  }
}
