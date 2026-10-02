import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  host: { class: 'inline-flex items-center gap-2.5' },
  template: `
    <svg viewBox="0 0 64 64" class="size-9 shrink-0" aria-hidden="true">
      <rect width="64" height="64" rx="16" [attr.fill]="inverse() ? '#f5b730' : '#1c1512'" />
      <path d="M14 18h9l9 24 9-24h9L37 50h-10z" [attr.fill]="inverse() ? '#1c1512' : '#f5b730'" />
    </svg>
    <span class="leading-none">
      <span class="block font-display text-lg font-bold tracking-tight">Vedora Hotel</span>
      @if (subtitle()) {
        <span class="mt-0.5 block text-[11px] font-medium tracking-wide opacity-70">{{ subtitle() }}</span>
      }
    </span>
  `,
})
export class Logo {
  readonly inverse = input(false);
  readonly subtitle = input('');
}
