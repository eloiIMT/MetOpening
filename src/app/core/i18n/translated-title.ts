import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18n } from './i18n.service';
import { MessageKey } from './messages';

@Injectable({ providedIn: 'root' })
export class TranslatedTitle extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18n);
  private readonly key = signal<MessageKey | null>(null);

  constructor() {
    super();
    effect(() => {
      const key = this.key();
      this.title.setTitle(key ? this.i18n.t(key) : 'Met Opening');
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.key.set((this.buildTitle(snapshot) as MessageKey | undefined) ?? null);
  }
}
