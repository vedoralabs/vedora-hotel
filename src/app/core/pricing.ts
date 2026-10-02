import { OptionChoice, OrderMode, Totals } from './models';
import { RESTAURANT } from './restaurant';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function unitPrice(base: number, choices: readonly OptionChoice[]): number {
  return base + choices.reduce((sum, c) => sum + c.price, 0);
}

export function computeTotals(subtotal: number, mode: OrderMode): Totals {
  const packaging = mode === 'takeaway' && subtotal > 0 ? RESTAURANT.takeawayPackaging : 0;
  const taxable = subtotal + packaging;
  const cgst = round2((taxable * RESTAURANT.gstRate) / 2);
  const sgst = cgst;
  const exact = taxable + cgst + sgst;
  const total = Math.round(exact);
  return { subtotal, packaging, cgst, sgst, roundOff: round2(total - exact), total };
}
