import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Cart } from '../core/cart';
import { DiningSessionStore } from '../core/dining-session';
import { OrderStore } from '../core/order-store';
import { UiState } from '../core/ui-state';
import { Icon } from './icon';
import { Logo } from './logo';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, Logo, Icon],
  host: { class: 'no-print sticky top-0 z-40 block border-b border-line/80 bg-cream/85 backdrop-blur-md' },
  template: `
    <a href="#main" class="sr-only-focusable absolute top-2 left-2 z-50 rounded-full bg-ink px-4 py-2 text-sm text-cream">Skip to content</a>
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
      <a routerLink="/" aria-label="Vedora Hotel home" class="rounded-xl"><app-logo /></a>

      <nav aria-label="Main" class="hidden items-center gap-1 md:flex">
        @for (link of links; track link.path) {
          <a
            [routerLink]="link.path"
            routerLinkActive="bg-ink text-cream!"
            #rla="routerLinkActive"
            [attr.aria-current]="rla.isActive ? 'page' : null"
            class="rounded-full px-4 py-2 text-sm font-medium text-ink-2 transition hover:text-ink"
            >{{ link.label }}
            @if (link.path === '/orders' && store.myOrders().length) {
              <span class="ml-1 rounded-full bg-saffron px-1.5 text-[11px] font-bold text-ink">{{ store.myOrders().length }}</span>
            }
          </a>
        }
      </nav>

      <div class="flex items-center gap-2">
        <a
          routerLink="/"
          fragment="start"
          class="hidden items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink-2 hover:border-ink-3 sm:inline-flex"
          [attr.aria-label]="'Ordering for: ' + session.label() + '. Change'"
        >
          <app-icon [name]="session.mode() === 'takeaway' ? 'bag' : 'table'" class="size-4" />
          {{ session.label() }}
        </a>
        <a routerLink="/orders" class="grid size-11 place-items-center rounded-full text-ink-2 hover:bg-cream-2 md:hidden" aria-label="My orders">
          <app-icon name="receipt" class="size-5" />
        </a>
        <button
          type="button"
          class="relative inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-cream hover:bg-night-3"
          (click)="ui.cartOpen.set(true)"
          [attr.aria-label]="'Open cart, ' + cart.count() + ' items'"
          aria-haspopup="dialog"
        >
          <app-icon name="cart" class="size-5" />
          <span class="hidden sm:inline">Cart</span>
          @if (cart.count()) {
            <span class="grid min-w-5 place-items-center rounded-full bg-saffron px-1 text-xs font-bold text-ink tabular-nums">{{ cart.count() }}</span>
          }
        </button>
      </div>
    </div>
  `,
})
export class SiteHeader {
  protected readonly cart = inject(Cart);
  protected readonly session = inject(DiningSessionStore);
  protected readonly store = inject(OrderStore);
  protected readonly ui = inject(UiState);

  protected readonly links = [
    { path: '/menu', label: 'Menu' },
    { path: '/orders', label: 'My orders' },
    { path: '/showcase', label: 'Behind the scenes' },
  ] as const;
}
