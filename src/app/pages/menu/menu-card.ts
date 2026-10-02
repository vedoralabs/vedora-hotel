import { Component, computed, inject, input, output } from '@angular/core';
import { Cart } from '../../core/cart';
import { InrPipe } from '../../core/money';
import { MenuItem } from '../../core/models';
import { UiState } from '../../core/ui-state';
import { DishArt } from '../../ui/dish-art';
import { QtyStepper } from '../../ui/qty-stepper';
import { VegMark } from '../../ui/veg-mark';

const TAG_LABEL = { bestseller: 'Bestseller', chef: 'Chef’s special', new: 'New' } as const;

@Component({
  selector: 'app-menu-card',
  imports: [DishArt, VegMark, QtyStepper, InrPipe],
  host: { class: 'block' },
  template: `
    <article
      class="group flex h-full gap-4 rounded-3xl border border-line bg-paper p-4 transition hover:-translate-y-0.5 hover:shadow-card"
      [class.opacity-70]="!item().available"
      [attr.aria-labelledby]="item().id + '-name'"
    >
      <div class="flex min-w-0 flex-1 flex-col">
        <div class="flex flex-wrap items-center gap-2">
          <app-veg-mark [veg]="item().veg" />
          @for (t of item().tags; track t) {
            <span
              class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              [class.bg-saffron]="t === 'bestseller'"
              [class.bg-ink]="t === 'chef'"
              [class.text-cream]="t === 'chef'"
              [class.bg-leaf]="t === 'new'"
              [class.text-paper]="t === 'new'"
              >{{ tagLabel[t] }}</span
            >
          }
        </div>
        <h3 [id]="item().id + '-name'" class="mt-2 text-[17px] leading-snug font-semibold">
          <button type="button" class="text-left after:absolute after:inset-0 focus-visible:outline-none" [disabled]="!item().available" (click)="open.emit()">
            {{ item().name }}
          </button>
        </h3>
        <p class="mt-0.5 font-semibold tabular-nums">{{ item().price | inr }}</p>
        <p class="mt-1.5 line-clamp-2 text-sm text-ink-2">{{ item().description }}</p>
        @if (item().spice >= 2) {
          <p class="mt-auto pt-2 text-xs font-medium text-chili">{{ item().spice === 3 ? 'Very spicy' : 'Spicy' }}</p>
        }
      </div>

      <div class="relative flex w-28 shrink-0 flex-col items-center">
        <div class="size-28 rounded-2xl bg-cream-2 p-1.5 transition group-hover:rotate-3">
          <app-dish-art [look]="item().look" [seed]="item().id" [muted]="!item().available" />
        </div>
        <div class="relative z-10 -mt-5">
          @if (!item().available) {
            <span class="inline-block rounded-full border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink-2">Sold out</span>
          } @else if (qty() && !customisable()) {
            <app-qty-stepper [qty]="qty()" [label]="item().name" (inc)="addQuick()" (dec)="cart.decrementItem(item().id)" />
          } @else {
            <button
              type="button"
              class="rounded-full border border-ink bg-paper px-5 py-2 text-sm font-bold text-ink shadow-card transition hover:bg-ink hover:text-cream"
              [attr.aria-label]="'Add ' + item().name + (customisable() ? ', customisable' : '')"
              (click)="customisable() ? open.emit() : addQuick()"
            >
              ADD{{ qty() ? ' · ' + qty() : '' }}
            </button>
          }
        </div>
        @if (customisable() && item().available) {
          <span class="mt-1 text-[11px] text-ink-2">customisable</span>
        }
      </div>
    </article>
  `,
  styles: `
    article {
      position: relative;
    }
    article:has(h3 button:focus-visible) {
      outline: 3px solid var(--color-saffron-deep);
      outline-offset: 2px;
    }
  `,
})
export class MenuCard {
  readonly item = input.required<MenuItem>();
  readonly open = output<void>();

  protected readonly cart = inject(Cart);
  private readonly ui = inject(UiState);
  protected readonly tagLabel = TAG_LABEL;
  protected readonly qty = computed(() => this.cart.qtyOf(this.item().id));
  protected readonly customisable = computed(() => !!this.item().options?.length);

  protected addQuick(): void {
    this.cart.add(this.item());
    if (this.qty() === 1) this.ui.toast(`${this.item().name} added`);
  }
}
