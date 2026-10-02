import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Cart } from '../core/cart';
import { DiningSessionStore } from '../core/dining-session';
import { InrPipe } from '../core/money';
import { UiState } from '../core/ui-state';
import { DishArt } from './dish-art';
import { Icon } from './icon';
import { QtyStepper } from './qty-stepper';
import { VegMark } from './veg-mark';

@Component({
  selector: 'app-cart-drawer',
  imports: [DishArt, Icon, QtyStepper, VegMark, InrPipe, RouterLink],
  template: `
    <dialog
      #dlg
      class="drawer m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-cream p-0 text-ink shadow-pop backdrop:bg-night/50 backdrop:backdrop-blur-sm"
      aria-labelledby="cart-title"
      (close)="ui.cartOpen.set(false)"
      (click)="onBackdrop($event)"
    >
      <div class="flex h-full flex-col">
        <header class="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 id="cart-title" class="font-display text-2xl font-bold">Your order</h2>
            <p class="text-sm text-ink-2">{{ session.label() }}</p>
          </div>
          <button type="button" class="grid size-11 place-items-center rounded-full hover:bg-cream-2" aria-label="Close cart" (click)="close()">
            <app-icon name="close" class="size-5" />
          </button>
        </header>

        @if (cart.isEmpty()) {
          <div class="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div class="mb-4 size-28 opacity-80">
              <app-dish-art [look]="{ shape: 'bowl', base: '#e8dccb', accent: '#f4ebdc', garnish: '#d4c4ad' }" seed="empty" />
            </div>
            <p class="font-display text-xl font-semibold">Your plate is empty</p>
            <p class="mt-1 text-sm text-ink-2">Add a few dishes from the menu — we’ll take it from there.</p>
            <a routerLink="/menu" class="btn-primary mt-6" (click)="close()">Browse the menu</a>
          </div>
        } @else {
          <ul class="flex-1 divide-y divide-line overflow-y-auto px-5" aria-label="Items in cart">
            @for (row of cart.rows(); track row.key) {
              <li class="flex gap-3 py-4">
                <app-dish-art class="size-16 shrink-0" [look]="row.item.look" [seed]="row.item.id" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-start gap-2">
                    <app-veg-mark class="mt-0.5" [veg]="row.item.veg" />
                    <p class="font-semibold leading-snug">{{ row.item.name }}</p>
                  </div>
                  @if (row.choices.length) {
                    <p class="mt-0.5 text-xs text-ink-2">{{ choiceText(row.choices) }}</p>
                  }
                  @if (row.note) {
                    <p class="mt-0.5 text-xs text-ink-2 italic">“{{ row.note }}”</p>
                  }
                  <div class="mt-2 flex items-center justify-between">
                    <app-qty-stepper
                      [qty]="row.qty"
                      [label]="row.item.name"
                      (inc)="cart.setQty(row.key, row.qty + 1)"
                      (dec)="cart.setQty(row.key, row.qty - 1)"
                    />
                    <span class="font-semibold tabular-nums">{{ row.lineTotal | inr }}</span>
                  </div>
                </div>
              </li>
            }
          </ul>

          <footer class="border-t border-line bg-paper px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <dl class="space-y-1 text-sm">
              <div class="flex justify-between"><dt class="text-ink-2">Item total</dt><dd class="tabular-nums">{{ cart.totals().subtotal | inr }}</dd></div>
              @if (cart.totals().packaging) {
                <div class="flex justify-between"><dt class="text-ink-2">Takeaway packaging</dt><dd class="tabular-nums">{{ cart.totals().packaging | inr }}</dd></div>
              }
              <div class="flex justify-between"><dt class="text-ink-2">GST (5%)</dt><dd class="tabular-nums">{{ cart.totals().cgst + cart.totals().sgst | inr }}</dd></div>
              <div class="flex justify-between pt-1 text-base font-bold"><dt>To pay</dt><dd class="tabular-nums">{{ cart.totals().total | inr }}</dd></div>
            </dl>
            <button type="button" class="btn-saffron mt-4 w-full py-4 text-base" (click)="checkout()">
              Proceed to pay {{ cart.totals().total | inr }}
              <app-icon name="arrow" class="size-5" />
            </button>
            <p class="mt-2 text-center text-xs text-ink-2">Pay first — your order goes straight to the kitchen.</p>
          </footer>
        }
      </div>
    </dialog>
  `,
  styles: `
    .drawer[open] {
      animation: slide-in 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    @keyframes slide-in {
      from {
        transform: translateX(100%);
      }
    }
  `,
})
export class CartDrawer {
  protected readonly cart = inject(Cart);
  protected readonly session = inject(DiningSessionStore);
  protected readonly ui = inject(UiState);
  private readonly router = inject(Router);
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  constructor() {
    effect(() => {
      const el = this.dlg().nativeElement;
      if (this.ui.cartOpen() && !el.open) el.showModal();
      if (!this.ui.cartOpen() && el.open) el.close();
    });
  }

  protected close(): void {
    this.ui.cartOpen.set(false);
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.close();
  }

  protected checkout(): void {
    this.close();
    void this.router.navigateByUrl('/checkout');
  }

  protected choiceText(choices: { label: string }[]): string {
    return choices.map((c) => c.label).join(' · ');
  }
}
