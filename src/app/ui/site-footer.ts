import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RESTAURANT, STUDIO } from '../core/restaurant';
import { Logo } from './logo';

@Component({
  selector: 'app-site-footer',
  imports: [Logo, RouterLink],
  host: { class: 'no-print block bg-night text-cream' },
  template: `
    <div class="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.3fr_1fr_1fr]">
      <div>
        <app-logo [inverse]="true" subtitle="Karnataka kitchen" />
        <p class="mt-4 max-w-xs text-sm text-cream/70">{{ r.address }}</p>
        <p class="mt-1 text-sm text-cream/70">Open daily · 7:00 am – 11:00 pm</p>
      </div>
      <nav aria-label="Footer">
        <h2 class="text-sm font-semibold text-cream/90">Eat</h2>
        <ul class="mt-3 space-y-2 text-sm text-cream/70">
          <li><a routerLink="/menu" class="hover:text-cream">Menu</a></li>
          <li><a routerLink="/" fragment="start" class="hover:text-cream">Dine-in or takeaway</a></li>
          <li><a routerLink="/orders" class="hover:text-cream">My orders</a></li>
        </ul>
      </nav>
      <nav aria-label="Restaurant screens">
        <h2 class="text-sm font-semibold text-cream/90">Behind the scenes</h2>
        <ul class="mt-3 space-y-2 text-sm text-cream/70">
          <li><a routerLink="/showcase" class="hover:text-cream">Live showcase</a></li>
          <li><a routerLink="/counter" class="hover:text-cream">Billing counter</a></li>
          <li><a routerLink="/kitchen" class="hover:text-cream">Kitchen display</a></li>
        </ul>
      </nav>
    </div>
    <div class="border-t border-cream/10">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-cream/60">
        <p>Vedora Hotel is a demo restaurant. Payments are simulated; no real money moves.</p>
        <p>
          Designed & engineered by
          @if (studio.url) {
            <a [href]="studio.url" class="font-semibold text-saffron hover:underline">{{ studio.name }}</a>
          } @else {
            <span class="font-semibold text-saffron">{{ studio.name }}</span>
          }
        </p>
      </div>
    </div>
  `,
})
export class SiteFooter {
  protected readonly r = RESTAURANT;
  protected readonly studio = STUDIO;
}
