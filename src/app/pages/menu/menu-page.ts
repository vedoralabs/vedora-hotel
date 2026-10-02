import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { Cart } from '../../core/cart';
import { DiningSessionStore } from '../../core/dining-session';
import { CategoryId, MenuItem } from '../../core/models';
import { InrPipe } from '../../core/money';
import { UiState } from '../../core/ui-state';
import { CATEGORIES, MENU } from '../../data/menu';
import { Icon } from '../../ui/icon';
import { ModePicker } from '../../ui/mode-picker';
import { ItemSheet } from './item-sheet';
import { MenuCard } from './menu-card';

@Component({
  selector: 'app-menu-page',
  imports: [MenuCard, ItemSheet, Icon, ModePicker, InrPipe],
  template: `
    <section class="mx-auto max-w-6xl px-4 pt-8 pb-4">
      <p class="eyebrow">Today’s menu</p>
      <div class="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 class="font-display text-4xl font-bold sm:text-5xl">What are we eating?</h1>
        <div class="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <label class="relative flex-1 sm:w-72 sm:flex-none">
            <span class="sr-only">Search the menu</span>
            <app-icon name="search" class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-3" />
            <input
              type="search"
              class="field-input rounded-full pl-11"
              placeholder="Search dosa, biryani, coffee…"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
          </label>
          <label class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-paper px-4 py-3 text-sm font-medium has-[:checked]:border-leaf has-[:checked]:text-leaf has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-saffron-deep">
            <input type="checkbox" class="size-4 accent-leaf" [checked]="vegOnly()" (change)="vegOnly.set(!vegOnly())" />
            Veg only
          </label>
        </div>
      </div>

      @if (!session.mode() || (session.mode() === 'dine-in' && !session.table())) {
        <div class="mt-6 rounded-3xl border border-saffron/60 bg-saffron/10 p-5">
          <p class="mb-3 font-semibold">First, where are you eating?</p>
          <app-mode-picker />
        </div>
      }
    </section>

    <nav
      aria-label="Menu categories"
      class="sticky top-16 z-30 border-y border-line/80 bg-cream/90 backdrop-blur-md"
    >
      <ul class="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
        @for (c of visibleCategories(); track c.id) {
          <li>
            <a
              [href]="'#cat-' + c.id"
              (click)="jump($event, c.id)"
              class="block rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition"
              [class.bg-ink]="active() === c.id"
              [class.text-cream]="active() === c.id"
              [class.bg-paper]="active() !== c.id"
              [class.text-ink-2]="active() !== c.id"
              [attr.aria-current]="active() === c.id ? 'true' : null"
              >{{ c.label }} <span class="ml-0.5 opacity-60">{{ c.count }}</span></a
            >
          </li>
        }
      </ul>
    </nav>

    <div class="mx-auto max-w-6xl px-4 pb-36">
      @for (c of visibleCategories(); track c.id) {
        <section [id]="'cat-' + c.id" class="scroll-mt-36 pt-10" [attr.aria-labelledby]="'h-' + c.id">
          <div class="mb-4 flex items-baseline justify-between gap-4">
            <h2 [id]="'h-' + c.id" class="font-display text-2xl font-bold">{{ c.label }}</h2>
            <p class="hidden text-sm text-ink-2 sm:block">{{ c.blurb }}</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            @for (item of c.items; track item.id) {
              <app-menu-card [item]="item" (open)="selected.set(item)" />
            }
          </div>
        </section>
      } @empty {
        <div class="py-24 text-center">
          <p class="font-display text-2xl font-semibold">Nothing matches “{{ query() }}”</p>
          <p class="mt-2 text-ink-2">Try “dosa”, “coffee” or clear the veg filter.</p>
          <button type="button" class="btn-ghost mt-6" (click)="query.set(''); vegOnly.set(false)">Clear filters</button>
        </div>
      }
    </div>

    @if (cart.count()) {
      <div class="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          class="mx-auto flex w-full max-w-xl animate-rise items-center justify-between rounded-2xl bg-ink px-5 py-4 text-cream shadow-pop hover:bg-night-2"
          (click)="ui.cartOpen.set(true)"
          aria-haspopup="dialog"
        >
          <span class="text-left">
            <span class="block text-xs text-cream/70">{{ cart.count() }} item{{ cart.count() > 1 ? 's' : '' }} · {{ session.label() }}</span>
            <span class="block font-bold tabular-nums">{{ cart.totals().total | inr }} <span class="text-xs font-normal text-cream/70">incl. GST</span></span>
          </span>
          <span class="inline-flex items-center gap-2 font-semibold text-saffron">View cart <app-icon name="arrow" class="size-5" /></span>
        </button>
      </div>
    }

    <app-item-sheet [item]="selected()" (closed)="selected.set(null)" />
  `,
})
export class MenuPage {
  protected readonly cart = inject(Cart);
  protected readonly session = inject(DiningSessionStore);
  protected readonly ui = inject(UiState);

  protected readonly query = signal('');
  protected readonly vegOnly = signal(false);
  protected readonly selected = signal<MenuItem | null>(null);
  protected readonly active = signal<CategoryId>('tiffin');
  private readonly destroy = inject(DestroyRef);

  protected readonly visibleCategories = computed(() => {
    const q = this.query().trim().toLowerCase();
    return CATEGORIES.map((c) => {
      const items = MENU.filter(
        (m) =>
          m.category === c.id &&
          (!this.vegOnly() || m.veg) &&
          (!q || `${m.name} ${m.description} ${m.localName ?? ''}`.toLowerCase().includes(q)),
      ).sort((a, b) => Number(b.available) - Number(a.available));
      return { ...c, items, count: items.length };
    }).filter((c) => c.items.length);
  });

  constructor() {
    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
          if (top) this.active.set(top.target.id.replace('cat-', '') as CategoryId);
        },
        { rootMargin: '-140px 0px -55% 0px' },
      );
      const observe = () => document.querySelectorAll('section[id^="cat-"]').forEach((el) => observer.observe(el));
      observe();
      const mo = new MutationObserver(observe);
      mo.observe(document.querySelector('app-menu-page') ?? document.body, { childList: true, subtree: true });
      this.destroy.onDestroy(() => {
        observer.disconnect();
        mo.disconnect();
      });
    });
  }

  protected jump(e: Event, id: CategoryId): void {
    e.preventDefault();
    this.active.set(id);
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
