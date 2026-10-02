import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clock, elapsed } from '../../core/clock';
import { Order, OrderStatus, Station } from '../../core/models';
import { OrderStore } from '../../core/order-store';
import { STATION_LABEL } from '../../data/menu';
import { Icon } from '../../ui/icon';
import { StaffBar } from '../../ui/staff-bar';

interface Column {
  status: OrderStatus;
  title: string;
  action: string;
  next: OrderStatus;
  tone: string;
}

const COLUMNS: Column[] = [
  { status: 'queued', title: 'New', action: 'Start cooking', next: 'preparing', tone: 'bg-sky' },
  { status: 'preparing', title: 'Cooking', action: 'Mark ready', next: 'ready', tone: 'bg-saffron' },
  { status: 'ready', title: 'Ready at pass', action: 'Handed over', next: 'completed', tone: 'bg-[#4ade80]' },
];

@Component({
  selector: 'app-kitchen-page',
  imports: [StaffBar, Icon, RouterLink],
  templateUrl: './kitchen-page.html',
  host: { class: 'block min-h-dvh bg-[#120d0b] text-cream' },
  styles: `
    .ticket {
      animation: drop-in 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
    }
    @keyframes drop-in {
      from {
        opacity: 0;
        transform: translateY(-14px) scale(0.97);
      }
    }
    .printing {
      background: repeating-linear-gradient(-45deg, rgb(255 255 255 / 0.04) 0 10px, transparent 10px 20px);
    }
  `,
})
export class KitchenPage {
  protected readonly store = inject(OrderStore);
  private readonly clock = inject(Clock);

  protected readonly columns = COLUMNS;
  protected readonly stations = Object.entries(STATION_LABEL) as [Station, string][];
  protected readonly station = signal<Station | 'all'>('all');
  protected readonly mobileCol = signal<OrderStatus>('queued');

  protected readonly incoming = computed(() =>
    this.store.orders().filter((o) => o.status === 'paid' || o.status === 'billed'),
  );

  protected readonly byColumn = computed(() => {
    const st = this.station();
    const map = new Map<OrderStatus, Order[]>();
    for (const c of COLUMNS) {
      map.set(
        c.status,
        this.store
          .orders()
          .filter((o) => o.status === c.status && (st === 'all' || o.lines.some((l) => l.station === st)))
          .sort((a, b) => a.createdAt - b.createdAt),
      );
    }
    return map;
  });

  protected since(o: Order): string {
    return elapsed(o.events.at(-1)!.at, this.clock.now());
  }

  protected totalAge(o: Order): string {
    return elapsed(o.createdAt, this.clock.now());
  }

  protected isLate(o: Order): boolean {
    return this.clock.now() - o.createdAt > o.etaMins * 60_000;
  }

  protected dim(station: Station): boolean {
    return this.station() !== 'all' && this.station() !== station;
  }

  protected advance(o: Order, c: Column): void {
    void this.store.advance(o.id, c.next, c.next === 'completed' ? 'counter' : 'kitchen');
  }

  protected itemCount(o: Order): number {
    return o.lines.reduce((n, l) => n + l.qty, 0);
  }
}
