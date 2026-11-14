import { Component, booleanAttribute, computed, input } from '@angular/core';

@Component({
  selector: 'app-case-crate',
  templateUrl: './case-crate.html',
  styleUrl: './case-crate.scss',
})
export class CaseCrate {
  readonly stencil = input.required<string>();
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly stencilText = computed(() => this.stencil().trim().toUpperCase() || 'CAISSE');

  protected readonly fontSize = computed(() => {
    const length = Math.max(Array.from(this.stencilText()).length, 1);
    const units = Math.max(11, Math.min(40, Math.floor(232 / (length * 0.64))));
    return `${(units / 3.6).toFixed(2)}cqw`;
  });

  protected readonly label = computed(() => `Caisse en bois marquée ${this.stencilText()}`);
}