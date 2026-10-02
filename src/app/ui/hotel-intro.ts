import { Component, DestroyRef, afterNextRender, inject, output, signal, viewChild, ElementRef } from '@angular/core';
import { HotelFacade } from './hotel-facade';

const DURATION_MS = 3900;

@Component({
  selector: 'app-hotel-intro',
  imports: [HotelFacade],
  host: {
    class: 'fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-6 transition-[transform,opacity] duration-700 ease-in-out',
    '[class.-translate-y-full]': 'leaving()',
    '[class.opacity-0]': 'leaving()',
    role: 'region',
    'aria-label': 'Welcome to Vedora Hotel',
  },
  template: `
    <div class="sky absolute inset-0 -z-10" aria-hidden="true">
      @for (s of stars; track $index) {
        <span
          class="star absolute rounded-full bg-cream"
          [style.left.%]="s.x"
          [style.top.%]="s.y"
          [style.width.px]="s.size"
          [style.height.px]="s.size"
          [style.animation-delay.s]="s.delay"
        ></span>
      }
      <span class="moon absolute top-[9%] right-[12%] size-14 rounded-full"></span>
    </div>

    <app-hotel-facade class="w-full max-w-xl" [play]="true" />

    <p class="greet mt-8 text-center font-display text-2xl text-cream sm:text-3xl">
      Welcome. Your table is ready.
    </p>
    <p class="greet-sub mt-2 text-center text-sm text-cream/70">Order from your seat · Pay in seconds · We cook</p>

    <div class="absolute inset-x-0 bottom-0 h-1 bg-night-3" aria-hidden="true">
      <div class="bar h-full bg-saffron"></div>
    </div>

    <button #skip type="button" class="btn absolute right-5 bottom-6 border border-cream/30 px-4 py-2 text-cream hover:bg-cream/10" (click)="finish()">
      Skip intro
    </button>
  `,
  styles: `
    :host {
      background: radial-gradient(120% 90% at 50% 100%, #3a2416 0%, #1c1512 45%, #0f0b09 100%);
    }
    .star {
      animation: twinkle 2.8s ease-in-out infinite;
    }
    .moon {
      background: radial-gradient(circle at 35% 35%, #fff8e1, #f1dca0 60%, #d7bd73);
      box-shadow: 0 0 40px 10px rgb(255 236 179 / 0.25);
    }
    .greet {
      animation: rise 0.7s ease 2.6s both;
    }
    .greet-sub {
      animation: rise 0.7s ease 2.9s both;
    }
    .bar {
      animation: grow 3900ms linear both;
      transform-origin: left;
    }
    @keyframes twinkle {
      50% {
        opacity: 0.25;
      }
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
    }
    @keyframes grow {
      from {
        transform: scaleX(0);
      }
    }
  `,
})
export class HotelIntro {
  readonly done = output<void>();
  protected readonly leaving = signal(false);
  private readonly skip = viewChild.required<ElementRef<HTMLButtonElement>>('skip');
  private timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly stars = Array.from({ length: 46 }, (_, i) => ({
    x: (i * 37.3) % 100,
    y: (i * 17.9) % 55,
    size: 1 + (i % 3),
    delay: (i % 7) * 0.4,
  }));

  constructor() {
    afterNextRender(() => {
      this.skip().nativeElement.focus({ preventScroll: true });
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.timers.push(setTimeout(() => this.finish(), reduced ? 900 : DURATION_MS));
    });
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  protected finish(): void {
    if (this.leaving()) return;
    this.leaving.set(true);
    this.timers.push(setTimeout(() => this.done.emit(), 700));
  }
}
