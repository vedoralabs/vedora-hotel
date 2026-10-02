import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clock } from '../core/clock';
import { Logo } from './logo';

@Component({
  selector: 'app-staff-bar',
  imports: [Logo, RouterLink],
  host: { class: 'no-print block bg-night text-cream' },
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <div class="flex items-center gap-4">
        <a routerLink="/" class="rounded-xl" aria-label="Customer app home"><app-logo [inverse]="true" /></a>
        <span class="hidden h-8 w-px bg-cream/15 sm:block" aria-hidden="true"></span>
        <div>
          <h1 class="text-base font-semibold">{{ title() }}</h1>
          <p class="flex items-center gap-1.5 text-xs text-cream/60">
            <span class="size-2 rounded-full bg-[#4ade80]" aria-hidden="true"></span> {{ device() }} · Online
          </p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ng-content />
        <time class="rounded-full bg-night-3 px-3 py-1.5 font-mono text-sm tabular-nums" aria-label="Current time">{{ time() }}</time>
      </div>
    </div>
  `,
})
export class StaffBar {
  readonly title = input.required<string>();
  readonly device = input('');
  private readonly clock = inject(Clock);
  protected readonly time = computed(() =>
    new Date(this.clock.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  );
}
