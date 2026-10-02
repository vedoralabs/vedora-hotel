import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InrPipe } from '../../core/money';
import { OrderStore } from '../../core/order-store';
import { Icon } from '../../ui/icon';
import { StatusChip } from '../../ui/status-chip';

@Component({
  selector: 'app-orders-page',
  imports: [RouterLink, InrPipe, DatePipe, Icon, StatusChip],
  template: `
    <section class="mx-auto max-w-3xl px-4 pt-8 pb-20">
      <p class="eyebrow">On this device</p>
      <h1 class="mt-2 font-display text-4xl font-bold">My orders</h1>

      @if (store.myOrders().length) {
        <ul class="mt-8 space-y-3">
          @for (o of store.myOrders(); track o.id) {
            <li>
              <a
                [routerLink]="['/order', o.id]"
                class="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-pop"
              >
                <span class="grid size-14 shrink-0 place-items-center rounded-2xl bg-night font-mono text-lg font-bold text-saffron">
                  {{ o.token }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex flex-wrap items-center gap-2">
                    <span class="font-semibold">{{ o.mode === 'takeaway' ? 'Takeaway' : 'Table ' + o.table }}</span>
                    <app-status-chip [status]="o.status" />
                  </span>
                  <span class="mt-1 block truncate text-sm text-ink-2">{{ summary(o.lines) }}</span>
                  <span class="mt-0.5 block text-xs text-ink-3">{{ o.createdAt | date: 'd MMM, h:mm a' }} · {{ o.invoiceNo }}</span>
                </span>
                <span class="text-right">
                  <span class="block font-semibold tabular-nums">{{ o.totals.total | inr }}</span>
                  <app-icon name="arrow" class="ml-auto size-5 text-ink-3" />
                </span>
              </a>
            </li>
          }
        </ul>
      } @else {
        <div class="mt-10 rounded-3xl border border-dashed border-line p-10 text-center">
          <p class="font-display text-2xl font-semibold">No orders yet</p>
          <p class="mt-2 text-ink-2">Once you pay, your order and e-bill will live here.</p>
          <a routerLink="/menu" class="btn-primary mt-6">Start an order</a>
        </div>
      }
    </section>
  `,
})
export class OrdersPage {
  protected readonly store = inject(OrderStore);

  protected summary(lines: { name: string; qty: number }[]): string {
    return lines.map((l) => `${l.qty}× ${l.name}`).join(', ');
  }
}
