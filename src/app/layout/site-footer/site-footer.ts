import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  protected readonly creditsOpen = signal(false);

  protected toggleCredits(): void {
    this.creditsOpen.update((open) => !open);
  }
}