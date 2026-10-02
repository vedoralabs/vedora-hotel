import { Service } from '@angular/core';
import { PaymentInfo, PaymentMethod } from './models';

export interface PaymentRequest {
  method: PaymentMethod;
  amount: number;
  upiId?: string;
  cardNumber?: string;
}

export class PaymentDeclined extends Error {}

/*
 * Stand-in for a real gateway (Razorpay / PayU / Paytm). It behaves like one from the UI's point
 * of view: async authorisation, a gateway reference, and deterministic test declines.
 *   Card 4000 0000 0000 0002 → declined (insufficient funds)
 *   UPI ID containing "fail"  → declined (collect request rejected)
 */
@Service()
export class PaymentGateway {
  async authorise(req: PaymentRequest): Promise<PaymentInfo> {
    await wait(1400 + Math.random() * 900);
    const digits = (req.cardNumber ?? '').replace(/\D/g, '');

    if (req.method === 'card' && digits.endsWith('0002')) {
      throw new PaymentDeclined('Your bank declined this card (insufficient funds). Try another card or UPI.');
    }
    if (req.method === 'upi' && (req.upiId ?? '').toLowerCase().includes('fail')) {
      throw new PaymentDeclined('The UPI collect request was declined in your app. Please try again.');
    }

    return {
      method: req.method,
      reference: `pay_${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      detail: req.method === 'card' ? `${cardBrand(digits)} •••• ${digits.slice(-4)}` : req.upiId || 'UPI QR',
      paidAt: Date.now(),
    };
  }
}

export function cardBrand(digits: string): string {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^(60|65|81|82|508)/.test(digits)) return 'RuPay';
  if (/^3[47]/.test(digits)) return 'Amex';
  return 'Card';
}

export function luhnValid(digits: string): boolean {
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
