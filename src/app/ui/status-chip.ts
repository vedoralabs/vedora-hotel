import { Component, computed, input } from '@angular/core';
import { OrderStatus } from '../core/models';
import { STATUS_LABEL } from '../core/order-store';

const TONE: Record<OrderStatus, string> = {
  paid: 'bg-sky/10 text-sky',
  billed: 'bg-sky/10 text-sky',
  queued: 'bg-saffron/25 text-saffron-deep',
  preparing: 'bg-saffron/25 text-[#7a5200]',
  ready: 'bg-leaf/15 text-leaf',
  completed: 'bg-ink/8 text-ink-2',
  refunded: 'bg-chili/10 text-chili',
};

@Component({
  selector: 'app-status-chip',
  host: { class: 'inline-flex' },
  template: `
    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold {{ tone() }}">
      @if (live()) {
        <span class="relative flex size-2">
          <span class="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60"></span>
          <span class="relative inline-flex size-2 rounded-full bg-current"></span>
        </span>
      }
      {{ label() }}
    </span>
  `,
})
export class StatusChip {
  readonly status = input.required<OrderStatus>();
  protected readonly tone = computed(() => TONE[this.status()]);
  protected readonly label = computed(() => STATUS_LABEL[this.status()]);
  protected readonly live = computed(() => this.status() === 'preparing' || this.status() === 'ready');
}
