import { Component, computed, inject, signal } from '@angular/core';
import {
  FormField,
  applyWhen,
  form,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Cart } from '../../core/cart';
import { DiningSessionStore } from '../../core/dining-session';
import { PaymentMethod } from '../../core/models';
import { InrPipe } from '../../core/money';
import { OrderStore } from '../../core/order-store';
import { PaymentDeclined, PaymentGateway, luhnValid } from '../../core/payment-gateway';
import { readJson, writeJson } from '../../core/storage';
import { DishArt } from '../../ui/dish-art';
import { Icon } from '../../ui/icon';
import { ModePicker } from '../../ui/mode-picker';
import { VegMark } from '../../ui/veg-mark';
import { PayOverlay, PayPhase } from './pay-overlay';

interface CheckoutModel {
  name: string;
  phone: string;
  instructions: string;
  method: PaymentMethod;
  upiMode: 'id' | 'qr';
  upiId: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

const GUEST_KEY = 'vh.guest.v1';
const digits = (v: string) => v.replace(/\D/g, '');

@Component({
  selector: 'app-checkout-page',
  imports: [FormField, InrPipe, DishArt, VegMark, Icon, ModePicker, PayOverlay, RouterLink],
  templateUrl: './checkout-page.html',
})
export class CheckoutPage {
  protected readonly cart = inject(Cart);
  protected readonly session = inject(DiningSessionStore);
  private readonly store = inject(OrderStore);
  private readonly gateway = inject(PaymentGateway);
  private readonly router = inject(Router);

  private readonly guest = readJson('local', GUEST_KEY, { name: '', phone: '' });

  protected readonly model = signal<CheckoutModel>({
    name: this.guest.name,
    phone: this.guest.phone,
    instructions: '',
    method: 'upi',
    upiMode: 'id',
    upiId: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  protected readonly f = form(this.model, (p) => {
    required(p.name, { message: 'Please tell us your name' });
    minLength(p.name, 2, { message: 'Name looks too short' });
    maxLength(p.name, 40, { message: 'Keep it under 40 characters' });
    required(p.phone, { message: 'We need a number to send your bill to' });
    pattern(p.phone, /^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' });
    maxLength(p.phone, 10, { message: 'Enter a valid 10-digit Indian mobile number' });
    maxLength(p.instructions, 140, { message: 'Keep it under 140 characters' });

    applyWhen(p, ({ value }) => value().method === 'upi' && value().upiMode === 'id', (u) => {
      required(u.upiId, { message: 'Enter your UPI ID' });
      pattern(u.upiId, /^[\w.-]{2,}@[a-zA-Z]{2,}$/, { message: 'UPI IDs look like name@bank' });
    });

    applyWhen(p, ({ value }) => value().method === 'card', (c) => {
      required(c.cardNumber, { message: 'Enter your card number' });
      maxLength(c.cardNumber, 23, { message: 'Card number is too long' });
      maxLength(c.expiry, 5, { message: 'Use MM/YY' });
      maxLength(c.cvv, 4, { message: '3 or 4 digits' });
      validate(c.cardNumber, ({ value }) =>
        !value() || luhnValid(digits(value())) ? null : { kind: 'luhn', message: 'That card number doesn’t look right' },
      );
      required(c.expiry, { message: 'Enter expiry' });
      validate(c.expiry, ({ value }) => (!value() || expiryValid(value()) ? null : { kind: 'expiry', message: 'Use MM/YY, in the future' }));
      required(c.cvv, { message: 'Enter CVV' });
      pattern(c.cvv, /^\d{3,4}$/, { message: '3 or 4 digits' });
    });
  });

  protected readonly phase = signal<PayPhase | null>(null);
  protected readonly declineReason = signal('');
  protected readonly tableMissing = computed(() => this.session.mode() === 'dine-in' && !this.session.table());
  protected readonly needsMode = computed(() => !this.session.mode() || this.tableMissing());
  protected readonly showModeError = signal(false);

  protected setMethod(method: PaymentMethod): void {
    this.model.update((m) => ({ ...m, method }));
  }

  protected setUpiMode(upiMode: 'id' | 'qr'): void {
    this.model.update((m) => ({ ...m, upiMode }));
  }

  protected formatCard(): void {
    const d = digits(this.model().cardNumber).slice(0, 19);
    this.model.update((m) => ({ ...m, cardNumber: d.replace(/(\d{4})(?=\d)/g, '$1 ') }));
  }

  protected formatExpiry(): void {
    const d = digits(this.model().expiry).slice(0, 4);
    this.model.update((m) => ({ ...m, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }));
  }

  protected async pay(e?: Event): Promise<void> {
    e?.preventDefault();
    if (this.cart.isEmpty() || this.phase()) return;
    if (this.needsMode()) {
      this.showModeError.set(true);
      document.getElementById('where')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const ok = await submit(this.f, async () => {
      const m = this.model();
      if (m.method === 'card') {
        void this.authorise();
      } else {
        this.phase.set(m.upiMode === 'qr' ? 'qr' : 'upi-collect');
      }
    });
    if (!ok) {
      queueMicrotask(() => (document.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());
    }
  }

  /** Called by the overlay once the customer has "approved" the payment on their side. */
  protected async authorise(): Promise<void> {
    const m = this.model();
    this.phase.set('authorising');
    try {
      const payment = await this.gateway.authorise({
        method: m.method,
        amount: this.cart.totals().total,
        upiId: m.method === 'upi' && m.upiMode === 'id' ? m.upiId : undefined,
        cardNumber: m.method === 'card' ? m.cardNumber : undefined,
      });
      this.phase.set('success');
      writeJson('local', GUEST_KEY, { name: m.name.trim(), phone: m.phone });

      const order = await this.store.place({
        mode: this.session.mode() ?? 'dine-in',
        table: this.session.table(),
        customer: { name: m.name.trim(), phone: m.phone },
        instructions: m.instructions.trim(),
        lines: this.cart.rows().map((r) => ({
          itemId: r.itemId,
          name: r.item.name,
          veg: r.item.veg,
          station: r.item.station,
          qty: r.qty,
          unitPrice: r.unitPrice,
          choices: r.choices,
          note: r.note,
          lineTotal: r.lineTotal,
        })),
        totals: this.cart.totals(),
        payment,
      });
      setTimeout(() => {
        this.cart.clear();
        void this.router.navigate(['/order', order.id], { replaceUrl: true });
      }, 1300);
    } catch (err) {
      this.declineReason.set(err instanceof PaymentDeclined ? err.message : 'Something went wrong talking to the bank. You have not been charged.');
      this.phase.set('declined');
    }
  }

  protected cancelPayment(): void {
    this.phase.set(null);
  }

  protected errorOf(field: { touched: () => boolean; errors: () => readonly { message?: string }[] }): string {
    return field.touched() ? (field.errors()[0]?.message ?? '') : '';
  }
}

function expiryValid(v: string): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(v.trim());
  if (!m) return false;
  const month = Number(m[1]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const end = new Date(2000 + Number(m[2]), month, 0, 23, 59, 59);
  return end >= now;
}
