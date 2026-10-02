import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Clock, elapsed } from '../../core/clock';
import { Order, OrderStatus } from '../../core/models';
import { InrPipe, formatInr } from '../../core/money';
import { OrderStore } from '../../core/order-store';
import { UiState } from '../../core/ui-state';
import { Icon } from '../../ui/icon';
import { Kot } from '../../ui/kot';
import { Receipt } from '../../ui/receipt';
import { StaffBar } from '../../ui/staff-bar';
import { StatusChip } from '../../ui/status-chip';

type Filter = 'active' | 'ready' | 'done' | 'all';

const FILTERS: { id: Filter; label: string; match: (s: OrderStatus) => boolean }[] = [
  { id: 'active', label: 'In progress', match: (s) => ['paid', 'billed', 'queued', 'preparing'].includes(s) },
  { id: 'ready', label: 'Ready', match: (s) => s === 'ready' },
  { id: 'done', label: 'Completed', match: (s) => s === 'completed' || s === 'refunded' },
  { id: 'all', label: 'All', match: () => true },
];

interface PrintJob {
  key: string;
  kind: 'Invoice' | 'KOT → Kitchen';
  token: number;
  at: number;
}

@Component({
  selector: 'app-counter-page',
  imports: [StaffBar, StatusChip, Receipt, Kot, Icon, InrPipe, DatePipe, RouterLink],
  templateUrl: './counter-page.html',
  styles: `
    .paper {
      animation: feed 1.2s cubic-bezier(0.3, 0.7, 0.3, 1) both;
    }
    @keyframes feed {
      from {
        transform: translateY(-100%);
      }
    }
    .flash {
      animation: flash 1.6s ease-out;
    }
    @keyframes flash {
      0%,
      40% {
        background: rgb(245 183 48 / 0.35);
      }
    }
  `,
})
export class CounterPage {
  protected readonly store = inject(OrderStore);
  private readonly clock = inject(Clock);
  private readonly ui = inject(UiState);

  protected readonly filters = FILTERS;
  protected readonly filter = signal<Filter>('active');
  protected readonly selectedId = signal<string | null>(null);
  protected readonly view = signal<'invoice' | 'kot'>('invoice');
  protected readonly confirmRefund = signal(false);
  protected readonly confirmReset = signal(false);
  protected readonly fresh = signal<ReadonlySet<string>>(new Set());

  protected readonly list = computed(() => {
    const f = FILTERS.find((x) => x.id === this.filter())!;
    return this.store.today().filter((o) => f.match(o.status));
  });

  protected readonly counts = computed(() =>
    Object.fromEntries(FILTERS.map((f) => [f.id, this.store.today().filter((o) => f.match(o.status)).length])) as Record<Filter, number>,
  );

  protected readonly selected = computed(() => {
    const id = this.selectedId();
    return (id && this.store.orders().find((o) => o.id === id)) || this.list()[0] || null;
  });

  protected readonly kpis = computed(() => {
    const today = this.store.today();
    const paid = today.filter((o) => o.status !== 'refunded');
    const revenue = paid.reduce((n, o) => n + o.totals.total, 0);
    return [
      { label: 'Orders today', value: String(paid.length) },
      { label: 'Collected', value: formatInr(revenue) },
      { label: 'Avg. ticket', value: paid.length ? formatInr(Math.round(revenue / paid.length)) : '—' },
      { label: 'In kitchen', value: String(today.filter((o) => o.status === 'queued' || o.status === 'preparing').length) },
      { label: 'Awaiting handover', value: String(today.filter((o) => o.status === 'ready').length) },
    ];
  });

  /** The billing printer's recent output, derived from order events. */
  protected readonly printJobs = computed<PrintJob[]>(() =>
    this.store
      .today()
      .flatMap((o) =>
        o.events
          .filter((e) => e.status === 'billed' || e.status === 'queued')
          .map((e) => ({
            key: `${o.id}-${e.status}`,
            kind: e.status === 'billed' ? ('Invoice' as const) : ('KOT → Kitchen' as const),
            token: o.token,
            at: e.at,
          })),
      )
      .sort((a, b) => b.at - a.at)
      .slice(0, 6),
  );

  constructor() {
    let known: Set<string> | null = null;
    effect(() => {
      const ids = new Set(this.store.today().map((o) => o.id));
      if (known) {
        const added = [...ids].filter((id) => !known!.has(id));
        if (added.length) {
          this.fresh.set(new Set(added));
          const o = this.store.find(added[0]);
          if (o) this.ui.toast(`New paid order · Token ${o.token} · ${formatInr(o.totals.total)}`);
          setTimeout(() => this.fresh.set(new Set()), 1700);
        }
      }
      known = ids;
    });
    effect(() => {
      this.selectedId();
      this.confirmRefund.set(false);
    });
  }

  protected age(o: Order): string {
    return elapsed(o.createdAt, this.clock.now());
  }

  protected handOver(o: Order): void {
    void this.store.advance(o.id, 'completed', 'counter');
    this.ui.toast(`Token ${o.token} ${o.mode === 'takeaway' ? 'collected' : 'served'}`);
  }

  protected refund(o: Order): void {
    void this.store.advance(o.id, 'refunded', 'counter');
    this.confirmRefund.set(false);
    this.ui.toast(`Refunded ${formatInr(o.totals.total)} for token ${o.token}`);
  }

  protected canRefund(o: Order): boolean {
    return o.status === 'paid' || o.status === 'billed' || o.status === 'queued';
  }

  protected async resetDemo(): Promise<void> {
    await this.store.reset();
    this.confirmReset.set(false);
    this.selectedId.set(null);
    this.ui.toast('Demo data cleared');
  }

  protected print(): void {
    window.print();
  }
}
