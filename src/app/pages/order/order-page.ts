import { Component, computed, effect, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Clock, clockTime } from '../../core/clock';
import { OrderEvent, OrderStatus } from '../../core/models';
import { formatInr } from '../../core/money';
import { OrderStore, STATUS_LABEL } from '../../core/order-store';
import { Icon } from '../../ui/icon';
import { OrderPipeline } from '../../ui/order-pipeline';
import { Receipt } from '../../ui/receipt';

const BY_LABEL: Record<OrderEvent['by'], string> = {
  customer: 'You',
  billing: 'Billing machine',
  kitchen: 'Kitchen',
  counter: 'Counter staff',
};

@Component({
  selector: 'app-order-page',
  imports: [OrderPipeline, Receipt, Icon, RouterLink, DatePipe],
  template: `
    @if (order(); as o) {
      <div class="mx-auto max-w-6xl px-4 pt-6 pb-20">
        <div class="no-print grid gap-8 lg:grid-cols-[1fr_400px]">
          <div class="space-y-6">
            <!-- Hero status -->
            <section class="relative overflow-hidden rounded-[32px] bg-night p-7 text-cream sm:p-9" aria-labelledby="status-h">
              <div class="glow pointer-events-none absolute -top-24 -right-24 size-72 rounded-full" aria-hidden="true"></div>
              <div class="relative flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p class="text-xs font-semibold tracking-[0.18em] text-saffron uppercase">
                    {{ o.mode === 'takeaway' ? 'Takeaway' : 'Table ' + o.table }} · {{ o.createdAt | date: 'h:mm a' }}
                  </p>
                  <h1 id="status-h" class="mt-3 max-w-md font-display text-3xl leading-tight font-bold sm:text-4xl" aria-live="polite">
                    {{ headline() }}
                  </h1>
                  <p class="mt-3 max-w-md text-cream/75">{{ subline() }}</p>
                </div>
                <div class="rounded-3xl bg-cream px-6 py-4 text-center text-ink" [class.animate-pulse-ring]="o.status === 'ready'">
                  <p class="text-[11px] font-semibold tracking-widest text-ink-2 uppercase">Token</p>
                  <p class="font-mono text-5xl font-bold tabular-nums">{{ o.token }}</p>
                </div>
              </div>
              @if (o.status !== 'completed' && o.status !== 'refunded') {
                <div class="relative mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/80">
                  <span class="inline-flex items-center gap-2"><app-icon name="clock" class="size-4" /> Usually ready in ~{{ o.etaMins }} min</span>
                  <span class="inline-flex items-center gap-2"><app-icon name="sparkle" class="size-4" /> Live — this page updates by itself</span>
                </div>
              }
            </section>

            <!-- Journey -->
            @if (o.status !== 'refunded') {
              <section class="card p-6 sm:p-8" aria-labelledby="journey-h">
                <h2 id="journey-h" class="mb-6 font-semibold">Where your order is right now</h2>
                <app-order-pipeline [status]="o.status" [mode]="o.mode" />
              </section>
            }

            <!-- Timeline -->
            <section class="card p-6 sm:p-8" aria-labelledby="tl-h">
              <h2 id="tl-h" class="font-semibold">Activity</h2>
              <ol class="mt-4 space-y-0">
                @for (e of eventsDesc(); track e.at + e.status; let first = $first) {
                  <li class="relative flex gap-4 pb-5 pl-1 last:pb-0">
                    <span class="relative z-10 mt-1 size-3 shrink-0 rounded-full" [class.bg-saffron-deep]="first" [class.bg-line]="!first"></span>
                    <span class="absolute top-4 bottom-0 left-[9px] w-px bg-line" aria-hidden="true"></span>
                    <div class="flex flex-1 flex-wrap justify-between gap-x-4">
                      <p [class.font-semibold]="first">{{ statusLabel(e.status) }} <span class="font-normal text-ink-2">· {{ byLabel[e.by] }}</span></p>
                      <time class="text-sm text-ink-2 tabular-nums" [attr.datetime]="iso(e.at)">{{ time(e.at) }}</time>
                    </div>
                  </li>
                }
              </ol>
            </section>

            <!-- Behind the scenes nudge -->
            <section class="rounded-3xl border border-dashed border-ink-3/50 p-6" aria-labelledby="bts-h">
              <h2 id="bts-h" class="flex items-center gap-2 font-semibold"><app-icon name="eye" class="size-5" /> Want to see the other side?</h2>
              <p class="mt-1 text-sm text-ink-2">
                This order is live on the restaurant’s screens right now. Open them in a new tab and watch it move — or drive it yourself.
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                <a class="btn-ghost" routerLink="/counter" target="_blank" rel="noopener">Billing counter <span class="sr-only">(opens in new tab)</span></a>
                <a class="btn-ghost" routerLink="/kitchen" target="_blank" rel="noopener">Kitchen display <span class="sr-only">(opens in new tab)</span></a>
              </div>
            </section>
          </div>

          <aside class="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Your bill">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">Your e-bill</h2>
              <button type="button" class="btn-ghost px-4 py-2" (click)="print()"><app-icon name="printer" class="size-4" /> Print / Save PDF</button>
            </div>
            <div class="rounded-3xl bg-cream-2 p-4 sm:p-6">
              <app-receipt [order]="o" />
            </div>
            <a routerLink="/menu" class="btn-primary w-full">Order something else</a>
          </aside>
        </div>

        <div class="hidden print:block"><app-receipt [order]="o" /></div>
      </div>
    } @else {
      <section class="mx-auto max-w-md px-4 py-24 text-center">
        <p class="font-display text-3xl font-bold">Order not found</p>
        <p class="mt-2 text-ink-2">It may have been cleared from this demo. Orders live in this browser only.</p>
        <a routerLink="/orders" class="btn-primary mt-8">See my orders</a>
      </section>
    }
  `,
  styles: `
    .glow {
      background: radial-gradient(circle, rgb(245 183 48 / 0.35), transparent 65%);
    }
  `,
})
export class OrderPage {
  readonly id = input.required<string>();
  private readonly store = inject(OrderStore);
  private readonly clock = inject(Clock);

  protected readonly byLabel = BY_LABEL;
  protected readonly order = computed(() => this.store.orders().find((o) => o.id === this.id()));
  protected readonly eventsDesc = computed(() => [...(this.order()?.events ?? [])].reverse());

  protected readonly headline = computed(() => {
    const o = this.order();
    if (!o) return '';
    const map: Record<OrderStatus, string> = {
      paid: 'Payment received!',
      billed: 'Your bill is printed',
      queued: 'Your order is in the kitchen',
      preparing: 'Our chefs are cooking',
      ready: o.mode === 'takeaway' ? 'Ready for pickup!' : 'Ready — coming to your table',
      completed: o.mode === 'takeaway' ? 'Collected. Enjoy!' : 'Served. Enjoy your meal!',
      refunded: 'This order was refunded',
    };
    return map[o.status];
  });

  protected readonly subline = computed(() => {
    const o = this.order();
    if (!o) return '';
    switch (o.status) {
      case 'paid':
        return 'Sending it to our billing counter. You’ll get an invoice in a second.';
      case 'billed':
        return `Invoice ${o.invoiceNo} is done. The kitchen ticket is printing now.`;
      case 'queued':
        return 'Your ticket is on the kitchen screen. A chef will pick it up shortly.';
      case 'preparing':
        return `Started ${this.ago(o.events.at(-1)!.at)}. Fresh food takes a few minutes — sit back.`;
      case 'ready':
        return o.mode === 'takeaway' ? `Show token ${o.token} at the counter to collect.` : `A server is bringing it to table ${o.table}.`;
      case 'completed':
        return 'Thanks for eating with us. Your e-bill is below.';
      case 'refunded':
        return `${formatInr(o.totals.total)} has been returned to ${o.payment.detail}.`;
    }
  });

  constructor() {
    let last: OrderStatus | undefined;
    effect(() => {
      const s = this.order()?.status;
      if (last && s === 'ready' && last !== 'ready') chime();
      last = s;
    });
  }

  protected statusLabel(s: OrderStatus): string {
    return STATUS_LABEL[s];
  }
  protected time(at: number): string {
    return clockTime(at);
  }
  protected iso(at: number): string {
    return new Date(at).toISOString();
  }
  protected print(): void {
    window.print();
  }

  private ago(at: number): string {
    const m = Math.floor((this.clock.now() - at) / 60000);
    return m < 1 ? 'just now' : `${m} min ago`;
  }
}

function chime(): void {
  try {
    navigator.vibrate?.([120, 60, 120]);
    const ctx = new AudioContext();
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  } catch {
    // Audio is a nicety; browsers may block it without a user gesture.
  }
}
