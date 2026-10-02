import { Component, ElementRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { Cart, MAX_QTY } from '../../core/cart';
import { InrPipe } from '../../core/money';
import { MenuItem, OptionChoice, OptionGroup } from '../../core/models';
import { unitPrice } from '../../core/pricing';
import { UiState } from '../../core/ui-state';
import { DishArt } from '../../ui/dish-art';
import { Icon } from '../../ui/icon';
import { QtyStepper } from '../../ui/qty-stepper';
import { VegMark } from '../../ui/veg-mark';

/** Dish detail + customisation sheet. Bottom sheet on phones, centred dialog on larger screens. */
@Component({
  selector: 'app-item-sheet',
  imports: [DishArt, VegMark, QtyStepper, Icon, InrPipe],
  template: `
    <dialog
      #dlg
      class="sheet m-0 mt-auto w-full max-w-none rounded-t-[28px] bg-cream p-0 text-ink shadow-pop backdrop:bg-night/50 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-lg sm:rounded-[28px]"
      aria-labelledby="sheet-title"
      (close)="closed.emit()"
      (click)="onBackdrop($event)"
    >
      @if (item(); as it) {
        <form class="flex max-h-[92dvh] flex-col" (submit)="add($event)">
          <div class="relative overflow-y-auto">
            <div class="relative grid h-56 place-items-center bg-cream-2">
              <app-dish-art class="size-48" [look]="it.look" [seed]="it.id" />
              <button
                type="button"
                class="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-paper/90 shadow-card hover:bg-paper"
                aria-label="Close"
                (click)="dlg.close()"
              >
                <app-icon name="close" class="size-5" />
              </button>
            </div>

            <div class="px-6 pt-5 pb-2">
              <div class="flex items-center gap-2">
                <app-veg-mark [veg]="it.veg" />
                @if (it.spice) {
                  <span class="text-xs font-medium text-chili" [attr.aria-label]="'Spice level ' + it.spice + ' of 3'">{{ '🌶'.repeat(it.spice) }}</span>
                }
                <span class="inline-flex items-center gap-1 text-xs text-ink-2"><app-icon name="clock" class="size-3.5" />~{{ it.prepMins }} min</span>
              </div>
              <h2 id="sheet-title" class="mt-2 font-display text-2xl font-bold">{{ it.name }}</h2>
              @if (it.localName) {
                <p class="text-sm text-ink-2" lang="kn">{{ it.localName }}</p>
              }
              <p class="mt-2 text-ink-2">{{ it.description }}</p>

              @for (g of it.options ?? []; track g.id) {
                <fieldset class="mt-6">
                  <legend class="mb-2 flex w-full items-center justify-between text-sm font-semibold">
                    {{ g.label }}
                    <span class="text-xs font-normal text-ink-2">{{ g.type === 'single' ? 'Choose 1' : 'Optional' }}</span>
                  </legend>
                  <div class="space-y-2">
                    @for (c of g.choices; track c.id) {
                      <label
                        class="flex cursor-pointer items-center gap-3 rounded-2xl border bg-paper px-4 py-3 transition has-[:checked]:border-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-saffron-deep"
                        [class.border-line]="!isPicked(g, c)"
                      >
                        <input
                          class="size-4 accent-ink"
                          [type]="g.type === 'single' ? 'radio' : 'checkbox'"
                          [name]="g.id"
                          [checked]="isPicked(g, c)"
                          (change)="toggle(g, c)"
                        />
                        <span class="flex-1">{{ c.label }}</span>
                        @if (c.price) {
                          <span class="text-sm text-ink-2">+{{ c.price | inr }}</span>
                        }
                      </label>
                    }
                  </div>
                </fieldset>
              }

              <label class="mt-6 block">
                <span class="field-label">Note for the kitchen <span class="font-normal text-ink-2">(optional)</span></span>
                <input
                  class="field-input"
                  maxlength="80"
                  placeholder="e.g. less oil, no onion"
                  [value]="note()"
                  (input)="note.set($any($event.target).value)"
                />
              </label>
            </div>
          </div>

          <div class="flex items-center gap-3 border-t border-line bg-paper px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <app-qty-stepper size="md" [qty]="qty()" [label]="it.name" (inc)="qty.set(min(qty() + 1))" (dec)="qty.set(max1(qty() - 1))" />
            <button type="submit" class="btn-saffron flex-1 py-3.5 text-base">
              Add to order · {{ total() | inr }}
            </button>
          </div>
        </form>
      }
    </dialog>
  `,
  styles: `
    .sheet[open] {
      animation: sheet-up 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    @keyframes sheet-up {
      from {
        transform: translateY(40%);
        opacity: 0;
      }
    }
  `,
})
export class ItemSheet {
  readonly item = input<MenuItem | null>(null);
  readonly closed = output<void>();

  private readonly cart = inject(Cart);
  private readonly ui = inject(UiState);
  private readonly dlgRef = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  protected readonly qty = signal(1);
  protected readonly note = signal('');
  protected readonly picked = signal<Record<string, OptionChoice[]>>({});

  protected readonly choices = computed(() => Object.values(this.picked()).flat());
  protected readonly total = computed(() => {
    const it = this.item();
    return it ? unitPrice(it.price, this.choices()) * this.qty() : 0;
  });

  constructor() {
    effect(() => {
      const it = this.item();
      const el = this.dlgRef().nativeElement;
      if (it) {
        this.qty.set(1);
        this.note.set('');
        this.picked.set(
          Object.fromEntries(
            (it.options ?? []).filter((g) => g.type === 'single').map((g) => [g.id, [scoped(g, g.choices[0])]]),
          ),
        );
        if (!el.open) el.showModal();
      } else if (el.open) {
        el.close();
      }
    });
  }

  protected isPicked(g: OptionGroup, c: OptionChoice): boolean {
    return (this.picked()[g.id] ?? []).some((p) => p.id === scoped(g, c).id);
  }

  protected toggle(g: OptionGroup, c: OptionChoice): void {
    const choice = scoped(g, c);
    this.picked.update((p) => {
      const cur = p[g.id] ?? [];
      if (g.type === 'single') return { ...p, [g.id]: [choice] };
      const has = cur.some((x) => x.id === choice.id);
      return { ...p, [g.id]: has ? cur.filter((x) => x.id !== choice.id) : [...cur, choice] };
    });
  }

  protected add(e: Event): void {
    e.preventDefault();
    const it = this.item();
    if (!it) return;
    // Defaults like "Regular" / "Normal sugar" are noise on a KOT — only keep choices that change something.
    const meaningful = this.choices().filter((c) => c.price > 0 || !isDefault(it, c));
    this.cart.add(it, meaningful, this.qty(), this.note());
    this.ui.toast(`${this.qty()} × ${it.name} added`);
    this.dlgRef().nativeElement.close();
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === this.dlgRef().nativeElement) this.dlgRef().nativeElement.close();
  }

  protected min(n: number): number {
    return Math.min(MAX_QTY, n);
  }
  protected max1(n: number): number {
    return Math.max(1, n);
  }
}

function scoped(g: OptionGroup, c: OptionChoice): OptionChoice {
  return { ...c, id: `${g.id}.${c.id}` };
}

function isDefault(item: MenuItem, c: OptionChoice): boolean {
  return (item.options ?? []).some((g) => g.type === 'single' && `${g.id}.${g.choices[0].id}` === c.id);
}
