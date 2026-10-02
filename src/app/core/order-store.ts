import { DestroyRef, Service, computed, inject, signal } from '@angular/core';
import { Order, OrderEvent, OrderLine, OrderMode, OrderStatus, PaymentInfo, Totals } from './models';
import { MENU_BY_ID } from '../data/menu';
import { readJson, writeJson } from './storage';

/*
 * The "restaurant backend" for this demo. Orders live in localStorage and every open tab
 * (customer phone, billing counter, kitchen screen) stays in sync through BroadcastChannel.
 * Writes go through the Web Locks API so two tabs never clobber each other's updates.
 *
 * Pipeline: customer pays → billing machine receives & issues the invoice → KOT goes to the
 * kitchen → kitchen prepares → ready → served / collected.
 */

const ORDERS_KEY = 'vh.orders.v1';
const SETTINGS_KEY = 'vh.settings.v1';
const MINE_KEY = 'vh.mine.v1';
const CHANNEL = 'vh.sync';
const LOCK = 'vh.orders.lock';
const KEEP = 200;

export const BILLING_DELAY_MS = 1800;
export const KOT_DELAY_MS = 1600;
const AUTO_ACCEPT_MS = 5000;
const AUTO_SERVE_MS = 15000;

export const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: 'Payment received',
  billed: 'Invoice generated',
  queued: 'In kitchen queue',
  preparing: 'Being prepared',
  ready: 'Ready',
  completed: 'Served',
  refunded: 'Refunded',
};

export const FLOW: readonly OrderStatus[] = ['paid', 'billed', 'queued', 'preparing', 'ready', 'completed'];

export interface OrderDraft {
  mode: OrderMode;
  table: string;
  customer: { name: string; phone: string };
  instructions: string;
  lines: OrderLine[];
  totals: Totals;
  payment: PaymentInfo;
}

interface Settings {
  autopilot: boolean;
}

@Service()
export class OrderStore {
  private readonly channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL);
  private readonly state = signal<Order[]>(loadOrders());
  private readonly mine = signal<string[]>(readJson('local', MINE_KEY, []));
  private readonly settings = signal<Settings>(readJson('local', SETTINGS_KEY, { autopilot: true }));
  private ticking = false;

  readonly orders = this.state.asReadonly();
  readonly autopilot = computed(() => this.settings().autopilot);
  readonly myOrders = computed(() => {
    const ids = new Set(this.mine());
    return this.state()
      .filter((o) => ids.has(o.id))
      .sort((a, b) => b.createdAt - a.createdAt);
  });
  readonly today = computed(() => {
    const start = startOfDay(Date.now());
    return this.state()
      .filter((o) => o.createdAt >= start)
      .sort((a, b) => b.createdAt - a.createdAt);
  });

  constructor() {
    const reload = () => {
      this.state.set(loadOrders());
      this.settings.set(readJson('local', SETTINGS_KEY, { autopilot: true }));
    };
    this.channel?.addEventListener('message', reload);
    const onStorage = (e: StorageEvent) => {
      if (e.key === ORDERS_KEY || e.key === SETTINGS_KEY) reload();
    };
    window.addEventListener('storage', onStorage);
    const timer = setInterval(() => void this.tick(), 1000);

    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      window.removeEventListener('storage', onStorage);
      this.channel?.close();
    });
  }

  find(id: string): Order | undefined {
    return this.state().find((o) => o.id === id);
  }

  async place(draft: OrderDraft): Promise<Order> {
    let placed: Order | undefined;
    await this.mutate((orders) => {
      const now = Date.now();
      const todays = orders.filter((o) => o.createdAt >= startOfDay(now));
      const token = todays.reduce((max, o) => Math.max(max, o.token), 100) + 1;
      const seq = orders.reduce((max, o) => Math.max(max, Number(o.invoiceNo.split('/').pop())), 1000) + 1;
      const ahead = orders.filter((o) => o.status === 'queued' || o.status === 'preparing').length;
      placed = {
        ...draft,
        id: `vh_${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        token,
        invoiceNo: `VH/${fiscalYear(now)}/${seq}`,
        createdAt: now,
        status: 'paid',
        events: [{ status: 'paid', at: now, by: 'customer' }],
        etaMins: Math.max(...draft.lines.map((l) => prepMinsFor(l))) + Math.min(ahead, 6) * 2 + 2,
      };
      return [...orders, placed];
    });
    if (!placed) throw new Error('Order could not be saved');
    this.mine.update((ids) => [placed!.id, ...ids].slice(0, 30));
    writeJson('local', MINE_KEY, this.mine());
    return placed;
  }

  advance(id: string, to: OrderStatus, by: OrderEvent['by']): Promise<void> {
    return this.mutate((orders) =>
      orders.map((o) => {
        if (o.id !== id || !canMove(o.status, to)) return o;
        return { ...o, status: to, events: [...o.events, { status: to, at: Date.now(), by }] };
      }),
    );
  }

  setAutopilot(on: boolean): void {
    this.settings.set({ autopilot: on });
    writeJson('local', SETTINGS_KEY, this.settings());
    this.channel?.postMessage('settings');
  }

  reset(): Promise<void> {
    return this.mutate(() => []);
  }

  /** Simulates the billing machine (always) and, when autopilot is on, a busy kitchen crew. */
  private async tick(): Promise<void> {
    if (this.ticking) return;
    const now = Date.now();
    const due = (o: Order) => nextAutoStep(o, now, this.autopilot());
    if (!this.state().some((o) => due(o))) return;

    this.ticking = true;
    try {
      await this.mutate((orders) =>
        orders.map((o) => {
          const step = due(o);
          return step ? { ...o, status: step.to, events: [...o.events, { status: step.to, at: now, by: step.by }] } : o;
        }),
      );
    } finally {
      this.ticking = false;
    }
  }

  private async mutate(fn: (orders: Order[]) => Order[]): Promise<void> {
    const run = () => {
      const next = fn(loadOrders()).slice(-KEEP);
      writeJson('local', ORDERS_KEY, next);
      this.state.set(next);
    };
    if (typeof navigator !== 'undefined' && navigator.locks) {
      await navigator.locks.request(LOCK, run);
    } else {
      run();
    }
    this.channel?.postMessage('orders');
  }
}

function nextAutoStep(
  o: Order,
  now: number,
  autopilot: boolean,
): { to: OrderStatus; by: OrderEvent['by'] } | null {
  const since = now - o.events[o.events.length - 1].at;
  switch (o.status) {
    case 'paid':
      return since >= BILLING_DELAY_MS ? { to: 'billed', by: 'billing' } : null;
    case 'billed':
      return since >= KOT_DELAY_MS ? { to: 'queued', by: 'billing' } : null;
    case 'queued':
      return autopilot && since >= AUTO_ACCEPT_MS ? { to: 'preparing', by: 'kitchen' } : null;
    case 'preparing':
      return autopilot && since >= demoCookMs(o) ? { to: 'ready', by: 'kitchen' } : null;
    case 'ready':
      return autopilot && since >= AUTO_SERVE_MS ? { to: 'completed', by: 'counter' } : null;
    default:
      return null;
  }
}

/** Real prep time is minutes; the demo compresses it to ~10–20s so visitors see the order finish. */
function demoCookMs(o: Order): number {
  return Math.min(20000, 7000 + o.etaMins * 700);
}

function canMove(from: OrderStatus, to: OrderStatus): boolean {
  if (to === 'refunded') return from === 'paid' || from === 'billed' || from === 'queued';
  return FLOW.indexOf(to) === FLOW.indexOf(from) + 1;
}

function prepMinsFor(line: OrderLine): number {
  return MENU_BY_ID.get(line.itemId)?.prepMins ?? 8;
}

function loadOrders(): Order[] {
  return readJson<Order[]>('local', ORDERS_KEY, []);
}

function startOfDay(at: number): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function fiscalYear(at: number): string {
  const d = new Date(at);
  const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}
