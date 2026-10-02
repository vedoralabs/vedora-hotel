import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Order, OrderLine, Station } from '../core/models';
import { STATION_LABEL } from '../data/menu';

/** Kitchen Order Ticket — what the billing machine prints for the kitchen. No prices. */
@Component({
  selector: 'app-kot',
  imports: [DatePipe],
  host: { class: 'block' },
  template: `
    <article class="mx-auto max-w-sm bg-paper px-6 py-6 font-mono text-[13px] leading-relaxed text-ink" [attr.aria-label]="'Kitchen order ticket ' + order().token">
      <header class="text-center">
        <p class="font-bold tracking-[0.25em]">KITCHEN ORDER TICKET</p>
        <p class="mt-2 text-4xl font-bold">#{{ order().token }}</p>
        <p class="mt-1 text-base font-bold">{{ order().mode === 'takeaway' ? '** TAKEAWAY — PACK **' : 'DINE-IN · TABLE ' + order().table }}</p>
        <p class="text-ink-2">{{ order().createdAt | date: 'dd/MM/yy h:mm:ss a' }} · {{ order().invoiceNo }}</p>
      </header>
      <hr class="my-3 border-dashed border-ink-3" />
      @for (g of groups(); track g.station) {
        <section class="mb-3">
          <p class="text-[11px] font-bold tracking-widest text-ink-2 uppercase">— {{ g.label }} —</p>
          <ul>
            @for (l of g.lines; track $index) {
              <li class="mt-1">
                <span class="font-bold">{{ l.qty }} × {{ l.name }}</span>
                @for (c of l.choices; track c.id) {
                  <span class="block pl-6 text-ink-2">› {{ c.label }}</span>
                }
                @if (l.note) {
                  <span class="block pl-6 font-bold">!! {{ l.note }}</span>
                }
              </li>
            }
          </ul>
        </section>
      }
      @if (order().instructions) {
        <hr class="my-3 border-dashed border-ink-3" />
        <p class="font-bold">NOTE: {{ order().instructions }}</p>
      }
      <hr class="my-3 border-dashed border-ink-3" />
      <p class="text-center text-ink-2">Guest: {{ order().customer.name }} · PAID</p>
    </article>
  `,
})
export class Kot {
  readonly order = input.required<Order>();

  protected readonly groups = computed(() => {
    const by = new Map<Station, OrderLine[]>();
    for (const l of this.order().lines) by.set(l.station, [...(by.get(l.station) ?? []), l]);
    return [...by].map(([station, lines]) => ({ station, label: STATION_LABEL[station], lines }));
  });
}
