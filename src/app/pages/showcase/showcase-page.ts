import { Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Icon, IconName } from '../../ui/icon';

interface Screen {
  id: 'guest' | 'counter' | 'kitchen';
  title: string;
  sub: string;
  path: string;
  url: SafeResourceUrl;
}

interface Feature {
  icon: IconName;
  title: string;
  text: string;
}

@Component({
  selector: 'app-showcase-page',
  imports: [RouterLink, Icon],
  template: `
    <section class="mx-auto max-w-[1500px] px-4 pt-10 pb-6">
      <p class="eyebrow">Live product demo</p>
      <div class="mt-2 flex flex-wrap items-end justify-between gap-6">
        <div class="max-w-3xl">
          <h1 class="font-display text-4xl font-bold sm:text-5xl">One order. Three screens. Zero waiting.</h1>
          <p class="mt-3 text-lg text-ink-2">
            Place an order on the phone. It’s paid, invoiced at the billing counter, and fired to the kitchen as a ticket, all in real time.
            Every screen below is the real app, running live in your browser.
          </p>
        </div>
        <ol class="flex flex-wrap items-center gap-2 text-sm font-medium" aria-label="Order flow">
          @for (s of ['Pay', 'Invoice', 'KOT', 'Cook', 'Serve']; track s; let last = $last) {
            <li class="flex items-center gap-2">
              <span class="rounded-full bg-ink px-3 py-1.5 text-cream">{{ s }}</span>
              @if (!last) {
                <app-icon name="arrow" class="size-4 text-ink-3" />
              }
            </li>
          }
        </ol>
      </div>
    </section>

    <!-- Screen switcher for small screens -->
    <div class="mx-auto max-w-[1500px] px-4 xl:hidden">
      <div class="grid grid-cols-3 gap-1 rounded-2xl bg-cream-2 p-1" role="tablist" aria-label="Choose screen">
        @for (s of screens; track s.id) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="tab() === s.id"
            class="rounded-xl px-2 py-2.5 text-sm font-semibold"
            [class.bg-paper]="tab() === s.id"
            [class.shadow-card]="tab() === s.id"
            (click)="tab.set(s.id)"
          >
            {{ s.title }}
          </button>
        }
      </div>
    </div>

    <section class="mx-auto grid max-w-[1500px] gap-5 px-4 py-6 xl:grid-cols-[400px_1fr_1fr]" aria-label="Live screens">
      @for (s of screens; track s.id) {
        <figure class="xl:block" [class.hidden]="tab() !== s.id">
          <figcaption class="mb-3 flex items-baseline justify-between gap-2">
            <span class="font-semibold">{{ s.title }} <span class="font-normal text-ink-2">· {{ s.sub }}</span></span>
            <a [routerLink]="s.path" target="_blank" rel="noopener" class="text-sm font-medium underline">Open full screen<span class="sr-only"> (new tab)</span></a>
          </figcaption>
          @if (s.id === 'guest') {
            <div class="mx-auto w-full max-w-[400px] rounded-[44px] bg-night p-3 shadow-pop">
              <div class="relative overflow-hidden rounded-[34px] bg-cream">
                <span class="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-night" aria-hidden="true"></span>
                <iframe [src]="s.url" [title]="s.title + ' (live)'" class="h-[760px] w-full" loading="lazy"></iframe>
              </div>
            </div>
          } @else {
            <div class="overflow-hidden rounded-3xl border border-line bg-paper shadow-card">
              <div class="flex items-center gap-1.5 border-b border-line bg-cream-2 px-4 py-2.5" aria-hidden="true">
                <span class="size-3 rounded-full bg-chili/70"></span><span class="size-3 rounded-full bg-saffron"></span><span class="size-3 rounded-full bg-leaf/70"></span>
                <span class="ml-3 truncate rounded-md bg-paper px-3 py-0.5 font-mono text-xs text-ink-2">vedorahotel.app{{ s.path }}</span>
              </div>
              <iframe [src]="s.url" [title]="s.title + ' (live)'" class="h-[740px] w-full" loading="lazy"></iframe>
            </div>
          }
        </figure>
      }
    </section>

    <section class="mx-auto max-w-6xl px-4 py-16" aria-labelledby="feat-h">
      <h2 id="feat-h" class="font-display text-3xl font-bold">What’s inside</h2>
      <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (f of features; track f.title) {
          <li class="card p-6">
            <span class="grid size-11 place-items-center rounded-2xl bg-saffron text-ink"><app-icon [name]="f.icon" class="size-5" /></span>
            <h3 class="mt-4 font-semibold">{{ f.title }}</h3>
            <p class="mt-1 text-sm text-ink-2">{{ f.text }}</p>
          </li>
        }
      </ul>
      <p class="mt-10 text-sm text-ink-2">
        This is a front-end demo: payments are simulated and orders are kept in this browser, synced between tabs. In production the same screens talk to
        a real payment gateway, a POS/billing API and kitchen printers.
      </p>
    </section>
  `,
})
export class ShowcasePage {
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly tab = signal<Screen['id']>('guest');

  // URLs are built once: a fresh SafeResourceUrl per change detection would reload the iframes.
  protected readonly screens: Screen[] = [
    { id: 'guest' as const, title: 'Guest phone', sub: 'scan, order, pay', path: '/menu' },
    { id: 'counter' as const, title: 'Billing counter', sub: 'invoices & KOTs', path: '/counter' },
    { id: 'kitchen' as const, title: 'Kitchen display', sub: 'tickets & timers', path: '/kitchen' },
  ].map((s) => ({ ...s, url: this.sanitizer.bypassSecurityTrustResourceUrl(`${s.path}?embed=1`) }));

  protected readonly features: Feature[] = [
    { icon: 'table', title: 'QR table ordering', text: 'Each table’s QR opens the menu with the table pre-selected (try /?table=7).' },
    { icon: 'lock', title: 'Pay-first checkout', text: 'UPI collect, UPI QR and cards with validation, declines and retries handled gracefully.' },
    { icon: 'receipt', title: 'GST-ready invoicing', text: 'CGST/SGST split, round-off, packaging charges and sequential invoice numbers per fiscal year.' },
    { icon: 'printer', title: 'Automatic KOT routing', text: 'The billing machine fires kitchen tickets grouped by station: dosa tawa, tandoor, curry and bar.' },
    { icon: 'screen', title: 'Kitchen display system', text: 'Live tickets with stage timers, late alerts, station filters and one-tap bumping.' },
    { icon: 'bell', title: 'Live order tracking', text: 'Guests see every step in real time and get a chime when food is ready.' },
  ];
}
