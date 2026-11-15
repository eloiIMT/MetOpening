import { Component, inject, signal } from '@angular/core';
import { I18n } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  protected readonly t = inject(I18n).t;
  protected readonly creditsOpen = signal(false);

  protected toggleCredits(): void {
    this.creditsOpen.update((open) => !open);
  }
}