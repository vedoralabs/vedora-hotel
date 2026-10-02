import { Pipe, PipeTransform } from '@angular/core';

const WHOLE = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const PAISE = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });

/** ₹357 for whole rupees, ₹8.50 when there are paise — the way Indian bills print. */
export function formatInr(value: number): string {
  return Number.isInteger(value) ? WHOLE.format(value) : PAISE.format(value);
}

@Pipe({ name: 'inr' })
export class InrPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatInr(value ?? 0);
  }
}
