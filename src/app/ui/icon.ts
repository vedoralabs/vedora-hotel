import { Component, computed, input } from '@angular/core';

const PATHS = {
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3 17h2',
  receipt: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4',
  chef: 'M7 13a4 4 0 1 1 1.5-7.7A4 4 0 0 1 16 6a4 4 0 1 1 1 7v6H7zM7 17h10',
  bell: 'M5 17h14l-1.5-2V11a5.5 5.5 0 0 0-11 0v4zM10 20a2 2 0 0 0 4 0M12 3v2',
  check: 'M5 12.5 10 17l9-10',
  cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2M10 21h.01M17 21h.01',
  close: 'M6 6l12 12M18 6 6 18',
  search: 'M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm9 3-4.3-4.3',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  back: 'M19 12H5m6 6-6-6 6-6',
  clock: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zm0-13v4l3 2',
  table: 'M3 9h18l-1.5 3h-15zM6 12v8M18 12v8M9 5.5c.5-1 1.5-1 2 0M13 5.5c.5-1 1.5-1 2 0',
  bag: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2',
  upi: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
  card: 'M3 6h18v12H3zM3 10h18M7 15h4',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
  printer: 'M7 9V3h10v6M7 17H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-3M7 14h10v7H7z',
  flame: 'M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 9 0 4 3 7 7 7z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  screen: 'M3 4h18v12H3zM8 20h8M12 16v4',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
} as const;

export type IconName = keyof typeof PATHS;

@Component({
  selector: 'app-icon',
  host: { class: 'inline-flex shrink-0', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 24 24" class="size-full" fill="none" stroke="currentColor" [attr.stroke-width]="stroke()" stroke-linecap="round" stroke-linejoin="round">
      <path [attr.d]="d()" />
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly stroke = input(1.8);
  protected readonly d = computed(() => PATHS[this.name()]);
}
