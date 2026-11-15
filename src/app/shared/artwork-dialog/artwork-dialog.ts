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
import { Artwork } from '../../core/artworks/artwork';
import { CardIndexService } from '../../core/artworks/card-index.service';
import { CollectionService } from '../../core/collection/collection.service';
import { RESALE_VALUE } from '../../core/game/game-rules';
import { I18n } from '../../core/i18n/i18n.service';
import { MetApiService } from '../../core/met/met-api.service';

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

  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;

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
    return artwork ? this.t(`rarities.${artwork.rarity}`) : '';
  });

  protected readonly departmentLabel = computed(() => {
    const artwork = this.artwork();
    return artwork ? this.t(`departments.${artwork.department}`) : '';
  });

  protected readonly altText = computed(() => {
    const artwork = this.artwork();
    return artwork
      ? this.t('artworks.dialogAlt', {
          title: artwork.title,
          artist: artwork.artist ?? this.t('artworks.dialogAltUnknownArtist'),
        })
      : '';
  });

  protected readonly record = computed(() => {
    const artwork = this.artwork();
    if (!artwork) {
      return [];
    }
    return [
      { label: this.t('artworks.recordDepartment'), value: this.t(`departments.${artwork.department}`) },
      { label: this.t('artworks.recordDate'), value: artwork.date ?? this.t('artworks.recordDateUnknown') },
      { label: this.t('artworks.recordResale'), value: this.coins(RESALE_VALUE[artwork.rarity]) },
      { label: this.t('artworks.recordMetNumber'), value: String(artwork.id) },
    ];
  });

  protected readonly copies = computed(() => {
    const artwork = this.artwork();
    return artwork ? this.collection.countOf(artwork.id) : 0;
  });

  protected readonly copiesLabel = computed(() => this.t('artworks.copiesOwned', { count: this.copies() }));

  private readonly unitPrice = computed(() => {
    const artwork = this.artwork();
    return artwork ? RESALE_VALUE[artwork.rarity] : 0;
  });

  protected readonly pendingSale = signal<SaleKind>('one');

  protected readonly sellOneLabel = computed(() =>
    this.t('artworks.sellOne', { coins: this.coins(this.unitPrice()) }),
  );

  protected readonly sellDuplicatesLabel = computed(() =>
    this.t('artworks.sellDuplicates', {
      count: this.copies() - 1,
      coins: this.coins((this.copies() - 1) * this.unitPrice()),
    }),
  );

  protected readonly saleTitle = computed(() =>
    this.t(this.pendingSale() === 'one' ? 'artworks.saleTitleOne' : 'artworks.saleTitleDuplicates'),
  );

  protected readonly saleQuestion = computed(() => {
    if (this.pendingSale() === 'duplicates') {
      const extra = this.copies() - 1;
      return this.t('artworks.dialogSaleDuplicates', {
        count: extra,
        coins: this.coins(extra * this.unitPrice()),
      });
    }
    return this.t(this.copies() === 1 ? 'artworks.dialogSaleOneLast' : 'artworks.dialogSaleOne', {
      coins: this.coins(this.unitPrice()),
    });
  });

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
    effect(() => {
      this.artwork();
      this.saleMessage.set('');
    });
  }

  private coins(count: number): string {
    return this.t('common.coins', { count });
  }

  private async findArtwork(id: number): Promise<Artwork | null> {
    const known = this.collection.owned()[id]?.artwork;
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
        this.t('artworks.dialogSold', { count: result.sold, coins: this.coins(result.coins) }),
      );
    }
    this.closeSale();
  }

  protected closeSale(): void {
    this.saleDialog().nativeElement.close();
  }
}
