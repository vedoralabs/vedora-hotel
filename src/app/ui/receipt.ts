import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { InrPipe } from '../core/money';
import { Order } from '../core/models';
import { RESTAURANT } from '../core/restaurant';

/** Thermal-printer style tax invoice, as issued by the billing machine. */
@Component({
  selector: 'app-receipt',
  imports: [InrPipe, DatePipe],
  host: { class: 'block' },
  template: `
    <article class="receipt mx-auto max-w-sm bg-paper px-6 pt-6 pb-8 font-mono text-[12.5px] leading-relaxed text-ink" [attr.aria-label]="'Tax invoice ' + order().invoiceNo">
      <header class="text-center">
        <p class="font-display text-xl font-bold tracking-wide">{{ r.name }}</p>
        <p class="text-ink-2">{{ r.address }}</p>
        <p class="text-ink-2">GSTIN {{ r.gstin }}</p>
        <p class="mt-2 font-bold tracking-[0.2em]">TAX INVOICE</p>
      </header>

      <hr class="my-3 border-dashed border-ink-3" />
      <dl class="grid grid-cols-2 gap-x-2">
        <dt class="text-ink-2">Bill no</dt><dd class="text-right">{{ order().invoiceNo }}</dd>
        <dt class="text-ink-2">Date</dt><dd class="text-right">{{ order().createdAt | date: 'dd MMM yy, h:mm a' }}</dd>
        <dt class="text-ink-2">Token</dt><dd class="text-right font-bold">#{{ order().token }}</dd>
        <dt class="text-ink-2">Type</dt>
        <dd class="text-right">{{ order().mode === 'takeaway' ? 'Takeaway' : 'Dine-in · T' + order().table }}</dd>
        <dt class="text-ink-2">Guest</dt><dd class="truncate text-right">{{ order().customer.name }}</dd>
      </dl>

      <hr class="my-3 border-dashed border-ink-3" />
      <table class="w-full">
        <caption class="sr-only">Items</caption>
        <thead>
          <tr class="text-left text-ink-2">
            <th scope="col" class="font-normal">Item</th>
            <th scope="col" class="w-8 text-right font-normal">Qty</th>
            <th scope="col" class="w-20 text-right font-normal">Amt</th>
          </tr>
        </thead>
        <tbody>
          @for (l of order().lines; track $index) {
            <tr class="align-top">
              <td class="pt-1.5 pr-2">
                {{ l.name }}
                @if (l.choices.length) {
                  <span class="block text-[11px] text-ink-2">+ {{ choiceText(l.choices) }}</span>
                }
                <span class="block text-[11px] text-ink-2">&#64; {{ l.unitPrice | inr }}</span>
              </td>
              <td class="pt-1.5 text-right">{{ l.qty }}</td>
              <td class="pt-1.5 text-right">{{ l.lineTotal | inr }}</td>
            </tr>
          }
        </tbody>
      </table>

      <hr class="my-3 border-dashed border-ink-3" />
      <dl class="grid grid-cols-2 gap-x-2">
        <dt>Subtotal</dt><dd class="text-right">{{ order().totals.subtotal | inr }}</dd>
        @if (order().totals.packaging) {
          <dt>Packaging</dt><dd class="text-right">{{ order().totals.packaging | inr }}</dd>
        }
        <dt>CGST 2.5%</dt><dd class="text-right">{{ order().totals.cgst | inr }}</dd>
        <dt>SGST 2.5%</dt><dd class="text-right">{{ order().totals.sgst | inr }}</dd>
        @if (order().totals.roundOff) {
          <dt>Round off</dt><dd class="text-right">{{ order().totals.roundOff | inr }}</dd>
        }
      </dl>
      <div class="mt-2 flex justify-between border-y-2 border-ink py-1.5 text-base font-bold">
        <span>TOTAL</span><span>{{ order().totals.total | inr }}</span>
      </div>

      <p class="mt-3">
        @if (refunded()) {
          <span class="font-bold text-chili">REFUNDED</span> to {{ order().payment.detail }}
        } @else {
          PAID via {{ order().payment.method === 'upi' ? 'UPI' : 'Card' }} · {{ order().payment.detail }}
        }
      </p>
      <p class="break-all text-ink-2">Ref {{ order().payment.reference }}</p>

      <hr class="my-3 border-dashed border-ink-3" />
      <p class="text-center text-ink-2">Thank you! Visit again.</p>
      <p class="mt-1 text-center text-[10.5px] text-ink-3">Demo invoice · no real transaction · Software by Vedora Labs</p>
    </article>
  `,
  styles: `
    .receipt {
      --tooth: 8px;
      mask:
        conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / calc(2 * var(--tooth)) 100%;
      filter: drop-shadow(0 6px 14px rgb(31 26 23 / 0.12));
    }
  `,
})
export class Receipt {
  readonly order = input.required<Order>();
  protected readonly r = RESTAURANT;
  protected readonly refunded = computed(() => this.order().status === 'refunded');

  protected choiceText(choices: { label: string }[]): string {
    return choices.map((c) => c.label).join(', ');
  }
}
