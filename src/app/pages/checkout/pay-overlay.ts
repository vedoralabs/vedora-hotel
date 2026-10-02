import { Component, DestroyRef, ElementRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { InrPipe } from '../../core/money';
import { Icon } from '../../ui/icon';

export type PayPhase = 'qr' | 'upi-collect' | 'authorising' | 'success' | 'declined';

const QR_SIZE = 25;
const QR_SECONDS = 300;

/** The modal a customer watches while the (simulated) payment goes through. */
@Component({
  selector: 'app-pay-overlay',
  imports: [InrPipe, Icon],
  template: `
    <dialog
      #dlg
      class="m-auto w-[calc(100%-2rem)] max-w-sm rounded-[28px] bg-paper p-0 text-ink shadow-pop backdrop:bg-night/70 backdrop:backdrop-blur-sm"
      aria-labelledby="pay-title"
      aria-describedby="pay-desc"
      (cancel)="onEsc($event)"
    >
      <div class="px-7 pt-8 pb-7 text-center" aria-live="polite">
        @switch (phase()) {
          @case ('qr') {
            <h2 id="pay-title" class="font-display text-2xl font-bold">Scan to pay</h2>
            <p id="pay-desc" class="mt-1 text-sm text-ink-2">Open any UPI app and scan. Amount: <strong class="text-ink">{{ amount() | inr }}</strong></p>
            <div class="relative mx-auto mt-5 w-52 rounded-2xl border border-line p-3">
              <svg [attr.viewBox]="'0 0 ' + qrSize + ' ' + qrSize" class="w-full" shape-rendering="crispEdges" role="img" aria-label="UPI payment QR code (demo)">
                @for (c of qrCells; track $index) {
                  <rect [attr.x]="c.x" [attr.y]="c.y" width="1" height="1" fill="#1f1a17" />
                }
              </svg>
              <span class="absolute inset-0 m-auto grid size-11 place-items-center rounded-xl bg-paper shadow-card">
                <svg viewBox="0 0 64 64" class="size-8" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#1c1512" /><path d="M14 18h9l9 24 9-24h9L37 50h-10z" fill="#f5b730" /></svg>
              </span>
            </div>
            <p class="mt-3 text-sm text-ink-2">vedorahotel&#64;upi · expires in <span class="font-mono font-semibold text-ink">{{ countdown() }}</span></p>
            <div class="mt-4 flex items-center justify-center gap-2 text-sm font-medium"><span class="spinner"></span> Waiting for payment…</div>
            <button type="button" class="btn-saffron mt-6 w-full" (click)="approve.emit()">Simulate: I’ve paid in my UPI app</button>
            <button type="button" class="btn mt-2 w-full text-ink-2 hover:text-ink" (click)="cancel.emit()">Cancel</button>
          }
          @case ('upi-collect') {
            <div class="mx-auto grid size-16 place-items-center rounded-2xl bg-cream-2"><app-icon name="phone" class="size-8" /></div>
            <h2 id="pay-title" class="mt-5 font-display text-2xl font-bold">Approve in your UPI app</h2>
            <p id="pay-desc" class="mt-2 text-sm text-ink-2">
              We’ve sent a request of <strong class="text-ink">{{ amount() | inr }}</strong> to <strong class="break-all text-ink">{{ upiId() }}</strong>. Open your app and enter your UPI PIN.
            </p>
            <div class="mt-5 flex items-center justify-center gap-2 text-sm font-medium"><span class="spinner"></span> Waiting for approval…</div>
            <button type="button" class="btn-saffron mt-6 w-full" (click)="approve.emit()">Simulate: approve request</button>
            <button type="button" class="btn mt-2 w-full text-ink-2 hover:text-ink" (click)="cancel.emit()">Cancel</button>
          }
          @case ('authorising') {
            <div class="mx-auto size-16"><span class="spinner big"></span></div>
            <h2 id="pay-title" class="mt-5 font-display text-2xl font-bold">Confirming payment</h2>
            <p id="pay-desc" class="mt-2 text-sm text-ink-2">Talking to your bank. Please don’t close this page.</p>
          }
          @case ('success') {
            <div class="mx-auto grid size-20 animate-pop place-items-center rounded-full bg-leaf text-paper">
              <svg viewBox="0 0 24 24" class="tick size-10" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17l9-10" /></svg>
            </div>
            <h2 id="pay-title" class="mt-5 font-display text-2xl font-bold">{{ amount() | inr }} paid</h2>
            <p id="pay-desc" class="mt-2 text-sm text-ink-2">Sending your order to the billing counter…</p>
          }
          @case ('declined') {
            <div class="mx-auto grid size-16 animate-pop place-items-center rounded-full bg-chili/10 text-chili"><app-icon name="close" class="size-8" [stroke]="2.4" /></div>
            <h2 id="pay-title" class="mt-5 font-display text-2xl font-bold">Payment didn’t go through</h2>
            <p id="pay-desc" class="mt-2 text-sm text-ink-2">{{ reason() }}</p>
            <p class="mt-1 text-xs text-ink-2">No money was taken. Your cart is safe.</p>
            <button type="button" class="btn-primary mt-6 w-full" (click)="cancel.emit()">Try again</button>
          }
        }
      </div>
    </dialog>
  `,
  styles: `
    .spinner {
      display: inline-block;
      width: 1.1rem;
      height: 1.1rem;
      border-radius: 9999px;
      border: 2.5px solid var(--color-line);
      border-top-color: var(--color-ink);
      animation: spin 0.8s linear infinite;
    }
    .spinner.big {
      width: 4rem;
      height: 4rem;
      border-width: 4px;
      border-top-color: var(--color-saffron-deep);
    }
    .tick path {
      stroke-dasharray: 24;
      animation: draw 0.5s ease 0.15s both;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    @keyframes draw {
      from {
        stroke-dashoffset: 24;
      }
    }
  `,
})
export class PayOverlay {
  readonly phase = input<PayPhase | null>(null);
  readonly amount = input(0);
  readonly reason = input('');
  readonly upiId = input('');
  readonly approve = output<void>();
  readonly cancel = output<void>();

  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  private readonly secondsLeft = signal(QR_SECONDS);
  protected readonly qrSize = QR_SIZE;
  protected readonly qrCells = buildQr();
  protected readonly countdown = computed(() => {
    const s = this.secondsLeft();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });

  constructor() {
    effect(() => {
      const el = this.dlg().nativeElement;
      if (this.phase() && !el.open) el.showModal();
      if (!this.phase() && el.open) el.close();
    });
    effect(() => {
      if (this.phase() === 'qr') this.secondsLeft.set(QR_SECONDS);
    });
    const t = setInterval(() => {
      if (this.phase() === 'qr') this.secondsLeft.update((s) => Math.max(0, s - 1));
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(t));
  }

  protected onEsc(e: Event): void {
    // Never let Esc dismiss an in-flight authorisation.
    e.preventDefault();
    const p = this.phase();
    if (p === 'qr' || p === 'upi-collect' || p === 'declined') this.cancel.emit();
  }
}

/** Decorative QR-like matrix with real finder patterns. Not scannable — it's a demo. */
function buildQr(): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const ring = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        if (ring || core) cells.push({ x: ox + x, y: oy + y });
      }
  };
  finder(0, 0);
  finder(QR_SIZE - 7, 0);
  finder(0, QR_SIZE - 7);
  let h = 0x9e3779b9;
  for (let y = 0; y < QR_SIZE; y++)
    for (let x = 0; x < QR_SIZE; x++) {
      const inFinder = (x < 8 && y < 8) || (x >= QR_SIZE - 8 && y < 8) || (x < 8 && y >= QR_SIZE - 8);
      h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) ^ (x * 31 + y);
      if (!inFinder && (h >>> 0) % 100 < 46) cells.push({ x, y });
    }
  return cells;
}
