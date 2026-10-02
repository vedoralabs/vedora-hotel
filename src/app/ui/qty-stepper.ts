import { Component, input, output } from '@angular/core';
import { MAX_QTY } from '../core/cart';

@Component({
  selector: 'app-qty-stepper',
  host: { class: 'inline-flex' },
  template: `
    <div
      class="inline-flex items-center rounded-full bg-ink text-cream"
      [class.text-sm]="size() === 'sm'"
      role="group"
      [attr.aria-label]="'Quantity for ' + label()"
    >
      <button
        type="button"
        class="grid place-items-center rounded-full hover:bg-night-3"
        [class.size-9]="size() === 'sm'"
        [class.size-11]="size() === 'md'"
        [attr.aria-label]="'Remove one ' + label()"
        (click)="dec.emit()"
      >
        <svg viewBox="0 0 20 20" class="size-4" aria-hidden="true"><path d="M5 10h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
      </button>
      <span class="min-w-6 text-center font-semibold tabular-nums" aria-live="polite">{{ qty() }}</span>
      <button
        type="button"
        class="grid place-items-center rounded-full hover:bg-night-3 disabled:opacity-40"
        [class.size-9]="size() === 'sm'"
        [class.size-11]="size() === 'md'"
        [disabled]="qty() >= max"
        [attr.aria-label]="'Add one more ' + label()"
        (click)="inc.emit()"
      >
        <svg viewBox="0 0 20 20" class="size-4" aria-hidden="true"><path d="M5 10h10M10 5v10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg>
      </button>
    </div>
  `,
})
export class QtyStepper {
  readonly qty = input.required<number>();
  readonly label = input('item');
  readonly size = input<'sm' | 'md'>('sm');
  readonly inc = output<void>();
  readonly dec = output<void>();
  protected readonly max = MAX_QTY;
}
