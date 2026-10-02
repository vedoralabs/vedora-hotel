import { Service, computed, signal } from '@angular/core';
import { DiningSession, OrderMode } from './models';
import { RESTAURANT } from './restaurant';
import { readJson, writeJson } from './storage';

const KEY = 'vh.session.v1';

@Service()
export class DiningSessionStore {
  private readonly state = signal<DiningSession | null>(readJson('session', KEY, null));

  readonly session = this.state.asReadonly();
  readonly mode = computed(() => this.state()?.mode ?? null);
  readonly table = computed(() => this.state()?.table ?? '');
  readonly label = computed(() => {
    const s = this.state();
    if (!s) return 'Choose dine-in or takeaway';
    return s.mode === 'takeaway' ? 'Takeaway' : s.table ? `Table ${s.table}` : 'Dine-in';
  });

  set(mode: OrderMode, table = ''): void {
    const next: DiningSession = { mode, table: mode === 'dine-in' ? normaliseTable(table) : '' };
    this.state.set(next);
    writeJson('session', KEY, next);
  }
}

export function normaliseTable(raw: string): string {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 && n <= RESTAURANT.tables ? String(n) : '';
}
