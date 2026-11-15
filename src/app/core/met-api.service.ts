import { Injectable, computed, signal } from '@angular/core';
import { Artwork } from './artwork';
import { readCachedArtwork, writeCachedArtwork } from './artwork-cache';
import { IndexEntry } from './card-index';
import { MetObject, MetSearchResult, toArtwork } from './met-object';
import { delayBeforeNext, recentRequests } from './rate-limit';

const MET_API = 'https://collectionapi.metmuseum.org/public/collection/';
const REQUESTS_PER_WINDOW = 50;
const WINDOW_MS = 60_000;
const MAX_PARALLEL = 6;
const PAUSE_MS = 60_000;
const MAX_ATTEMPTS = 3;
const MIN_GAP_MS = 200;
const LIMITER_STORAGE_KEY = 'met-opening.met-limiter';

interface LimiterState {
  readonly history: readonly number[];
  readonly pausedUntil: number;
}

interface Task {
  readonly path: string;
  readonly urgent: boolean;
  attempts: number;
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
}

interface PendingArtwork {
  readonly promise: Promise<Artwork | null>;
  readonly controller: AbortController;
  waiters: number;
}

export interface SearchMatches {
  readonly total: number;
  readonly ids: readonly number[];
}

export function abortError(): Error {
  return new DOMException('The request was cancelled', 'AbortError');
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

@Injectable({ providedIn: 'root' })
export class MetApiService {
  private readonly queue: Task[] = [];
  private readonly resolved = new Map<number, Artwork | null>();
  private readonly inflight = new Map<number, PendingArtwork>();
  private readonly searches = new Map<string, Promise<SearchMatches>>();
  private active = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  private readonly waitingCount = signal(0);
  private readonly pausedState = signal(false);

  readonly busy = computed(() => this.waitingCount() > 0);
  readonly paused = this.pausedState.asReadonly();

  constructor() {
    const remaining = readLimiter().pausedUntil - Date.now();
    if (remaining > 0) {
      this.showPause(remaining);
    }
  }

  getArtwork(entry: IndexEntry, urgent = false, signal?: AbortSignal): Promise<Artwork | null> {
    if (this.resolved.has(entry.id)) {
      return Promise.resolve(this.resolved.get(entry.id) ?? null);
    }
    let pending = this.inflight.get(entry.id);
    if (!pending || pending.controller.signal.aborted) {
      pending = this.startLoading(entry, urgent);
    }
    pending.waiters++;
    if (!signal) {
      return pending.promise;
    }
    const shared = pending;
    return new Promise<Artwork | null>((resolve, reject) => {
      const leave = () => {
        reject(abortError());
        shared.waiters--;
        if (shared.waiters === 0) {
          shared.controller.abort();
        }
      };
      if (signal.aborted) {
        leave();
        return;
      }
      signal.addEventListener('abort', leave, { once: true });
      shared.promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', leave));
    });
  }

  searchIds(params: Readonly<Record<string, string>>): Promise<SearchMatches> {
    const query = new URLSearchParams({ hasImages: 'true', limit: '500', offset: '0', ...params }).toString();
    let pending = this.searches.get(query);
    if (!pending) {
      pending = this.request<MetSearchResult>(`v1.1/search?${query}`, true).then((result) => ({
        total: result?.total ?? 0,
        ids: result?.objectIDs ?? [],
      }));
      this.searches.set(query, pending);
      pending.catch(() => this.searches.delete(query));
    }
    return pending;
  }

  private startLoading(entry: IndexEntry, urgent: boolean): PendingArtwork {
    const controller = new AbortController();
    const pending: PendingArtwork = { controller, waiters: 0, promise: this.loadArtwork(entry, urgent, controller.signal) };
    this.inflight.set(entry.id, pending);
    pending.promise
      .then((artwork) => this.resolved.set(entry.id, artwork))
      .catch(() => undefined)
      .finally(() => {
        if (this.inflight.get(entry.id) === pending) {
          this.inflight.delete(entry.id);
        }
      });
    return pending;
  }

  private async loadArtwork(entry: IndexEntry, urgent: boolean, signal: AbortSignal): Promise<Artwork | null> {
    const cached = await readCachedArtwork(entry.id);
    if (cached) {
      return cached.artwork;
    }
    const object = await this.request<MetObject>(`v1/objects/${entry.id}`, urgent, signal);
    const artwork = object ? toArtwork(object, entry) : null;
    await writeCachedArtwork(entry.id, { artwork, fetchedAt: Date.now() });
    return artwork;
  }

  private request<T>(path: string, urgent: boolean, signal?: AbortSignal): Promise<T | null> {
    return new Promise<T | null>((resolve, reject) => {
      if (signal?.aborted) {
        reject(abortError());
        return;
      }
      const task: Task = { path, urgent, attempts: 0, resolve: resolve as (value: unknown) => void, reject };
      const firstNormal = this.queue.findIndex((queued) => !queued.urgent);
      if (urgent && firstNormal !== -1) {
        this.queue.splice(firstNormal, 0, task);
      } else {
        this.queue.push(task);
      }
      signal?.addEventListener(
        'abort',
        () => {
          const position = this.queue.indexOf(task);
          if (position !== -1) {
            this.queue.splice(position, 1);
            this.updateWaiting();
            reject(abortError());
          }
        },
        { once: true },
      );
      this.updateWaiting();
      this.pump();
    });
  }

  private pump(): void {
    clearTimeout(this.timer);
    while (this.queue.length > 0 && this.active < MAX_PARALLEL) {
      const now = Date.now();
      const { history, pausedUntil } = readLimiter();
      const wait = Math.max(
        pausedUntil - now,
        (history.at(-1) ?? 0) + MIN_GAP_MS - now,
        delayBeforeNext(history, now, REQUESTS_PER_WINDOW, WINDOW_MS),
      );
      if (wait > 0) {
        this.timer = setTimeout(() => this.pump(), wait);
        return;
      }
      const task = this.queue.shift() as Task;
      saveLimiter({ history: [...recentRequests(history, now, WINDOW_MS), now], pausedUntil });
      this.active++;
      void this.run(task);
    }
  }

  private async run(task: Task): Promise<void> {
    try {
      const response = await fetch(MET_API + task.path);
      if (response.status === 404) {
        task.resolve(null);
      } else if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      } else {
        task.resolve(await response.json());
      }
    } catch (error) {
      task.attempts++;
      if (task.attempts >= MAX_ATTEMPTS) {
        task.reject(error instanceof Error ? error : new Error(String(error)));
      } else {
        this.queue.unshift(task);
        this.pause();
      }
    } finally {
      this.active--;
      this.updateWaiting();
      this.pump();
    }
  }

  private pause(): void {
    const limiter = readLimiter();
    if (limiter.pausedUntil > Date.now()) {
      return;
    }
    saveLimiter({ ...limiter, pausedUntil: Date.now() + PAUSE_MS });
    this.showPause(PAUSE_MS);
  }

  private showPause(duration: number): void {
    this.pausedState.set(true);
    setTimeout(() => {
      this.pausedState.set(false);
      this.pump();
    }, duration);
  }

  private updateWaiting(): void {
    this.waitingCount.set(this.queue.length + this.active);
  }
}

function readLimiter(): LimiterState {
  try {
    const parsed = JSON.parse(localStorage.getItem(LIMITER_STORAGE_KEY) ?? 'null') as Partial<LimiterState> | null;
    const history = Array.isArray(parsed?.history) ? parsed.history.filter((time) => typeof time === 'number') : [];
    const pausedUntil = typeof parsed?.pausedUntil === 'number' ? parsed.pausedUntil : 0;
    return { history, pausedUntil };
  } catch {
    return { history: [], pausedUntil: 0 };
  }
}

function saveLimiter(state: LimiterState): void {
  try {
    localStorage.setItem(LIMITER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}
