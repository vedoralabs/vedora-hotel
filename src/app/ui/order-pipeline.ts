import { Component, computed, input } from '@angular/core';
import { OrderMode, OrderStatus } from '../core/models';
import { Icon, IconName } from './icon';

interface Stage {
  icon: IconName;
  label: string;
  sub: string;
}

const STAGE_OF: Record<OrderStatus, number> = {
  paid: 0,
  billed: 1,
  queued: 2,
  preparing: 2,
  ready: 3,
  completed: 4,
  refunded: -1,
};

/** Shows where the order physically is: your phone → billing machine → kitchen → pass → you. */
@Component({
  selector: 'app-order-pipeline',
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <ol class="relative grid grid-cols-4 gap-1" [attr.aria-label]="'Order journey, currently: ' + current().label">
      @for (s of stages(); track s.label; let i = $index; let last = $last) {
        <li class="relative flex flex-col items-center text-center" [attr.aria-current]="i === stage() ? 'step' : null">
          @if (!last) {
            <span class="absolute top-6 left-[calc(50%+28px)] h-0.5 w-[calc(100%-56px)] overflow-hidden rounded bg-line" aria-hidden="true">
              <span
                class="absolute inset-y-0 left-0 bg-saffron-deep transition-all duration-700"
                [style.width.%]="i < stage() ? 100 : 0"
              ></span>
              @if (i === stage() && !done()) {
                <span class="packet absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-saffron-deep"></span>
              }
            </span>
          }
          <span
            class="relative grid size-12 place-items-center rounded-2xl border-2 transition-colors duration-500"
            [class.border-saffron-deep]="i <= stage()"
            [class.bg-saffron]="i < stage() || done()"
            [class.bg-paper]="i >= stage() && !done()"
            [class.border-line]="i > stage()"
            [class.text-ink-3]="i > stage()"
            [class.animate-pulse-ring]="i === stage() && !done()"
          >
            <app-icon [name]="i < stage() || done() ? 'check' : s.icon" class="size-6" />
          </span>
          <span class="mt-2 text-xs font-semibold sm:text-sm" [class.text-ink-3]="i > stage()">{{ s.label }}</span>
          <span class="mt-0.5 hidden text-[11px] text-ink-2 sm:block">{{ s.sub }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    .packet {
      animation: travel 1.1s ease-in-out infinite;
    }
    @keyframes travel {
      from {
        left: 0;
      }
      to {
        left: calc(100% - 8px);
      }
    }
  `,
})
export class OrderPipeline {
  readonly status = input.required<OrderStatus>();
  readonly mode = input<OrderMode>('dine-in');

  protected readonly stages = computed<Stage[]>(() => [
    { icon: 'phone', label: 'Paid', sub: 'From your phone' },
    { icon: 'printer', label: 'Billing', sub: 'Invoice + KOT printed' },
    { icon: 'chef', label: 'Kitchen', sub: 'Chefs on it' },
    {
      icon: this.mode() === 'takeaway' ? 'bag' : 'bell',
      label: this.mode() === 'takeaway' ? 'Pickup' : 'Served',
      sub: this.mode() === 'takeaway' ? 'Collect at counter' : 'Brought to your table',
    },
  ]);
  protected readonly stage = computed(() => Math.min(STAGE_OF[this.status()], 3));
  protected readonly done = computed(() => this.status() === 'completed');
  protected readonly current = computed(() => this.stages()[Math.max(0, this.stage())]);
}
