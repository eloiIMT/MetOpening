import { Injectable, computed, effect, signal } from '@angular/core';
import { LOCALES, LOCALE_TAG, Locale, Params, formatMessage } from './i18n';
import { MessageKey, lookup } from './messages';

export const LOCALE_STORAGE_KEY = 'met-opening.locale';

@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly current = signal<Locale>(readStoredLocale());

  readonly locale = this.current.asReadonly();
  readonly tag = computed(() => LOCALE_TAG[this.current()]);
  readonly otherLocale = computed<Locale>(() => (this.current() === 'fr' ? 'en' : 'fr'));

  constructor() {
    effect(() => {
      document.documentElement.lang = this.current();
    });
  }

  readonly t = (key: MessageKey, params: Params = {}): string =>
    formatMessage(lookup(this.current(), key), params, this.current());

  readonly number = (value: number): string => value.toLocaleString(this.tag());

  setLocale(locale: Locale): void {
    this.current.set(locale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      return;
    }
  }

  toggle(): void {
    this.setLocale(this.otherLocale());
  }
}

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored !== null && (LOCALES as readonly string[]).includes(stored)) {
      return stored as Locale;
    }
  } catch {
    return 'fr';
  }
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}
