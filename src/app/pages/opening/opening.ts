import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild, viewChildren } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { sortByRarity } from '../../core/collection/collection-rules';
import { RARITY_RANK, Rarity } from '../../core/game/game-rules';
import { I18n } from '../../core/i18n/i18n.service';
import { OpeningService } from '../../core/game/opening.service';

const FIRST_CARD_DELAY_MS = 1500;
const REVEAL_WINDOW_MS = 2400;
const MIN_STAGGER_MS = 70;
const MAX_STAGGER_MS = 160;
const FLIP_AFTER_ARRIVAL_MS = 320;
const TOP_SUSPENSE_MS = 280;
const FLIP_DURATION_MS = 560;
const END_PAUSE_MS = 700;
const TRACK_PADDING_PX = 24;
const PLAIN_LIGHT = '#FFF1C9';

@Component({
  selector: 'app-opening',
  imports: [RouterLink],
  templateUrl: './opening.html',
  styleUrl: './opening.scss',
})
export class Opening {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly startedAt = performance.now();
  private counter: ReturnType<typeof setInterval> | undefined;
  private leave: ReturnType<typeof setTimeout> | undefined;

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly cardItems = viewChildren<ElementRef<HTMLElement>>('cardItem');

  protected readonly t = inject(I18n).t;
  protected readonly result = inject(OpeningService).current;
  protected readonly stencilText = computed(() => {
    const result = this.result();
    return result ? this.t(`stencils.${result.caseId}`) : '';
  });
  protected readonly revealed = signal(0);
  protected readonly done = signal(false);

  private readonly caseCount = computed(() => this.result()?.cases.length ?? 0);
  private readonly allDrawn = computed(() => sortByRarity(this.result()?.cases.flat() ?? []));

  protected readonly total = computed(() => this.allDrawn().length);
  protected readonly progress = computed(() => (this.total() === 0 ? 0 : this.revealed() / this.total()));

  private readonly stagger = computed(() =>
    Math.min(MAX_STAGGER_MS, Math.max(MIN_STAGGER_MS, REVEAL_WINDOW_MS / Math.max(this.total(), 1))),
  );

  private readonly bestRarity = computed(() =>
    this.allDrawn().reduce<Rarity>(
      (best, item) => (RARITY_RANK[item.artwork.rarity] > RARITY_RANK[best] ? item.artwork.rarity : best),
      'common',
    ),
  );

  protected readonly glowColor = computed(() =>
    RARITY_RANK[this.bestRarity()] >= RARITY_RANK.rare ? `var(--rarity-${this.bestRarity()})` : PLAIN_LIGHT,
  );

  protected readonly revealCards = computed(() =>
    this.allDrawn().map((item, index) => {
      const top = RARITY_RANK[item.artwork.rarity] >= RARITY_RANK.rare;
      const delay = FIRST_CARD_DELAY_MS + index * this.stagger();
      return {
        top,
        rarity: item.artwork.rarity,
        label: this.t(`rarities.${item.artwork.rarity}`),
        image: item.artwork.imageSmall,
        title: item.artwork.title,
        delay,
        flipDelay: delay + FLIP_AFTER_ARRIVAL_MS + (top ? TOP_SUSPENSE_MS : 0),
      };
    }),
  );

  private readonly legendaryCount = computed(
    () => this.allDrawn().filter((item) => item.artwork.rarity === 'legendary').length,
  );

  protected readonly destination = computed(() =>
    this.legendaryCount() > 0 ? '/case-opening/legendary' : '/case-opening/summary',
  );

  protected readonly heading = computed(() => {
    if (!this.done()) {
      return this.t('openings.openingInProgress');
    }
    if (this.legendaryCount() > 0) {
      return this.legendaryCount() > 1
        ? this.t('openings.openingLegendaryMany', { count: this.legendaryCount() })
        : this.t('openings.openingLegendaryOne');
    }
    return this.caseCount() > 1 ? this.t('openings.openingCasesOpenedMany') : this.t('openings.openingCasesOpenedOne');
  });

  private readonly casesLabel = computed(() => this.t('openings.openingCases', { count: Math.max(this.caseCount(), 1) }));

  private readonly artworksLabel = computed(() => this.t('common.artworks', { count: this.total() }));

  protected readonly meta = computed(() =>
    this.t('openings.openingMeta', { cases: this.casesLabel(), artworks: this.artworksLabel() }),
  );

  protected readonly status = computed(() =>
    this.done()
      ? this.t('openings.openingStatusDone', { cases: this.casesLabel(), artworks: this.artworksLabel() })
      : this.t('openings.openingStatusProgress', { cases: this.casesLabel() }),
  );

  constructor() {
    effect(() => this.followLatestCard());

    this.destroyRef.onDestroy(() => {
      clearInterval(this.counter);
      clearTimeout(this.leave);
    });
    if (this.result() === null) {
      return;
    }
    if (this.reduceMotion) {
      this.finish();
      return;
    }
    const start = setTimeout(() => {
      this.revealNext();
      this.counter = setInterval(() => this.revealNext(), this.stagger());
    }, FIRST_CARD_DELAY_MS);
    this.destroyRef.onDestroy(() => clearTimeout(start));
  }

  private revealNext(): void {
    this.revealed.update((count) => Math.min(count + 1, this.total()));
    if (this.revealed() >= this.total()) {
      this.finish();
    }
  }

  private finish(): void {
    clearInterval(this.counter);
    this.done.set(true);
    this.revealed.set(this.total());
    this.scheduleLeave();
  }

  private scheduleLeave(): void {
    const lastCard = this.revealCards().at(-1);
    const lastFlipEnd = (lastCard?.flipDelay ?? 0) + FLIP_DURATION_MS + END_PAUSE_MS;
    const remaining = this.reduceMotion ? 0 : Math.max(0, lastFlipEnd - (performance.now() - this.startedAt));
    this.leave = setTimeout(() => this.router.navigateByUrl(this.destination(), { replaceUrl: true }), remaining);
  }

  private followLatestCard(): void {
    const track = this.track()?.nativeElement;
    const card = this.cardItems()[this.revealed() - 1]?.nativeElement;
    if (!track || !card || this.reduceMotion) {
      return;
    }
    const isLast = this.revealed() >= this.total();
    const target = isLast
      ? track.scrollWidth - track.clientWidth
      : card.offsetLeft + card.offsetWidth + TRACK_PADDING_PX - track.clientWidth;
    if (target > track.scrollLeft) {
      track.scrollTo({ left: target, behavior: 'smooth' });
    }
  }
}
