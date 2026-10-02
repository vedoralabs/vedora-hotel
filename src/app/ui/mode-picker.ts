import { Component, inject, output } from '@angular/core';
import { DiningSessionStore } from '../core/dining-session';
import { OrderMode } from '../core/models';
import { RESTAURANT } from '../core/restaurant';
import { Icon } from './icon';

@Component({
  selector: 'app-mode-picker',
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <fieldset>
      <legend class="sr-only">How would you like to eat?</legend>
      <div class="grid gap-3 sm:grid-cols-2">
        @for (opt of options; track opt.mode) {
          <label
            class="group relative flex cursor-pointer gap-4 rounded-3xl border-2 bg-paper p-5 transition has-[:checked]:border-ink has-[:checked]:shadow-card has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-saffron-deep"
            [class.border-line]="session.mode() !== opt.mode"
          >
            <input type="radio" name="mode" class="sr-only" [checked]="session.mode() === opt.mode" (change)="pick(opt.mode)" />
            <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream-2 text-ink group-has-[:checked]:bg-saffron">
              <app-icon [name]="opt.icon" class="size-6" />
            </span>
            <span class="flex-1">
              <span class="block font-semibold">{{ opt.title }}</span>
              <span class="mt-0.5 block text-sm text-ink-2">{{ opt.sub }}</span>
            </span>
            <span
              class="mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 border-line group-has-[:checked]:border-ink group-has-[:checked]:bg-ink"
              aria-hidden="true"
            >
              <span class="size-2 rounded-full bg-cream opacity-0 group-has-[:checked]:opacity-100"></span>
            </span>
          </label>
        }
      </div>
    </fieldset>

    @if (session.mode() === 'dine-in') {
      <div class="mt-4 animate-rise">
        <label for="table-no" class="field-label">Your table number</label>
        <div class="flex flex-wrap items-center gap-3">
          <select
            id="table-no"
            class="field-input w-40"
            (change)="session.set('dine-in', $any($event.target).value)"
            aria-describedby="table-hint"
          >
            <option value="" [selected]="!session.table()">Select table</option>
            @for (t of tables; track t) {
              <option [value]="t" [selected]="session.table() === t">Table {{ t }}</option>
            }
          </select>
          <p id="table-hint" class="text-sm text-ink-2">It’s on the stand at your table — or scan its QR code.</p>
        </div>
      </div>
    }
  `,
})
export class ModePicker {
  protected readonly session = inject(DiningSessionStore);
  readonly picked = output<OrderMode>();

  protected readonly tables = Array.from({ length: RESTAURANT.tables }, (_, i) => String(i + 1));
  protected readonly options = [
    { mode: 'dine-in', icon: 'table', title: 'Dine-in', sub: 'Order & pay from your table. We bring it over.' },
    { mode: 'takeaway', icon: 'bag', title: 'Takeaway', sub: 'Pay now, collect at the counter when your token is called.' },
  ] as const;

  protected pick(mode: OrderMode): void {
    this.session.set(mode, mode === 'dine-in' ? this.session.table() : '');
    this.picked.emit(mode);
  }
}
