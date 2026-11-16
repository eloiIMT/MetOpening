import { Component, booleanAttribute, computed, inject, input } from '@angular/core';
import { ShopCaseId } from '../../core/economy/shop';
import { I18n } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-case-crate',
  templateUrl: './case-crate.html',
  styleUrl: './case-crate.scss',
})
export class CaseCrate {
  readonly caseId = input.required<ShopCaseId>();
  readonly decorative = input(false, { transform: booleanAttribute });

  private readonly i18n = inject(I18n);

  protected readonly stencilText = computed(() => this.i18n.t(`stencils.${this.caseId()}`));

  protected readonly fontSize = computed(() => {
    const length = Math.max(Array.from(this.stencilText()).length, 1);
    const units = Math.max(11, Math.min(40, Math.floor(232 / (length * 0.64))));
    return `${(units / 3.6).toFixed(2)}cqw`;
  });

  protected readonly label = computed(() => this.i18n.t('crate.label', { stencil: this.stencilText() }));
}
