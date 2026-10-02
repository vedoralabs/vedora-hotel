import { Service, computed, inject, signal } from '@angular/core';
import { MENU_BY_ID } from '../data/menu';
import { DiningSessionStore } from './dining-session';
import { CartLine, MenuItem, OptionChoice } from './models';
import { computeTotals, unitPrice } from './pricing';
import { readJson, writeJson } from './storage';

const KEY = 'vh.cart.v1';
export const MAX_QTY = 20;

export interface CartRow extends CartLine {
  item: MenuItem;
  unitPrice: number;
  lineTotal: number;
}

@Service()
export class Cart {
  private readonly session = inject(DiningSessionStore);
  private readonly state = signal<CartLine[]>(
    readJson<CartLine[]>('session', KEY, []).filter((l) => MENU_BY_ID.get(l.itemId)?.available),
  );

  readonly lines = this.state.asReadonly();

  readonly rows = computed<CartRow[]>(() =>
    this.state().flatMap((line) => {
      const item = MENU_BY_ID.get(line.itemId);
      if (!item) return [];
      const price = unitPrice(item.price, line.choices);
      return [{ ...line, item, unitPrice: price, lineTotal: price * line.qty }];
    }),
  );

  readonly count = computed(() => this.state().reduce((n, l) => n + l.qty, 0));
  readonly subtotal = computed(() => this.rows().reduce((n, r) => n + r.lineTotal, 0));
  readonly totals = computed(() => computeTotals(this.subtotal(), this.session.mode() ?? 'dine-in'));
  readonly isEmpty = computed(() => this.state().length === 0);

  qtyOf(itemId: string): number {
    return this.state()
      .filter((l) => l.itemId === itemId)
      .reduce((n, l) => n + l.qty, 0);
  }

  add(item: MenuItem, choices: OptionChoice[] = [], qty = 1, note = ''): void {
    const key = lineKey(item.id, choices, note);
    this.commit((lines) => {
      const existing = lines.find((l) => l.key === key);
      if (existing) {
        return lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      }
      return [...lines, { key, itemId: item.id, qty: Math.min(MAX_QTY, qty), choices, note: note.trim() }];
    });
  }

  setQty(key: string, qty: number): void {
    this.commit((lines) =>
      qty <= 0
        ? lines.filter((l) => l.key !== key)
        : lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)),
    );
  }

  /** Decrements the most recently added line for an item — used by the +/- stepper on menu cards. */
  decrementItem(itemId: string): void {
    const last = [...this.state()].reverse().find((l) => l.itemId === itemId);
    if (last) this.setQty(last.key, last.qty - 1);
  }

  clear(): void {
    this.commit(() => []);
  }

  private commit(fn: (lines: CartLine[]) => CartLine[]): void {
    this.state.update(fn);
    writeJson('session', KEY, this.state());
  }
}

function lineKey(itemId: string, choices: OptionChoice[], note: string): string {
  const ids = choices
    .map((c) => c.id)
    .sort()
    .join(',');
  return `${itemId}|${ids}|${note.trim().toLowerCase()}`;
}
