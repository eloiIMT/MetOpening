import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { sortByRarity } from '../../core/collection-rules';
import { RARITY_RANK, Rarity } from '../../core/game-rules';
import { RARITY_LABEL } from '../../core/labels';
import { OpeningService } from '../../core/opening.service';

const FIRST_CARD_DELAY_MS = 1500;
const REVEAL_WINDOW_MS = 2400;
const MIN_STAGGER_MS = 70;
const MAX_STAGGER_MS = 160;
const FLIP_AFTER_ARRIVAL_MS = 320;
const TOP_SUSPENSE_MS = 280;
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
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private counter: ReturnType<typeof setInterval> | undefined;

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly cardItems = viewChildren<ElementRef<HTMLElement>>('cardItem');

  protected readonly result = inject(OpeningService).current;
  protected readonly revealed = signal(0);
  protected readonly done = signal(false);

  private readonly caseCount = computed(() => this.result()?.cases.length ?? 0);
  private readonly allDrawn = computed(() => sortByRarity(this.result()?.cases.flat() ?? []));

  protected readonly total = computed(() => this.allDrawn().length);
  protected readonly progress = computed(() => (this.total() === 0 ? 0 : this.revealed() / this.total()));

  private readonly stagger = computed(() =>
    Math.min(MAX_STAGGER_MS, Math.max(MIN_STAGGER_MS, REVEAL_WINDOW_MS / Math.max(this.total(), 1))),
  );

  protected readonly bestRarity = computed(() =>
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
        label: RARITY_LABEL[item.artwork.rarity],
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
      return 'Ouverture en cours';
    }
    if (this.legendaryCount() > 0) {
      return this.legendaryCount() > 1 ? `${this.legendaryCount()} Légendaires !` : 'Une Légendaire !';
    }
    return this.caseCount() > 1 ? 'Caisses ouvertes' : 'Caisse ouverte';
  });

  protected readonly meta = computed(() => {
    const cases = this.caseCount() > 1 ? `${this.caseCount()} caisses` : '1 caisse';
    return `${cases} · ${this.total()} œuvres`;
  });

  protected readonly status = computed(() => {
    const cases = this.caseCount() > 1 ? `${this.caseCount()} caisses` : '1 caisse';
    return this.done() ? `${cases} ouvertes : ${this.total()} œuvres.` : `Ouverture de ${cases} en cours.`;
  });

  constructor() {
    effect(() => this.followLatestCard());

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
    this.destroyRef.onDestroy(() => {
      clearTimeout(start);
      clearInterval(this.counter);
    });
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
