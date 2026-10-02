import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Cart } from '../../core/cart';
import { DiningSessionStore } from '../../core/dining-session';
import { InrPipe } from '../../core/money';
import { UiState } from '../../core/ui-state';
import { MENU } from '../../data/menu';
import { DishArt } from '../../ui/dish-art';
import { HotelFacade } from '../../ui/hotel-facade';
import { Icon, IconName } from '../../ui/icon';
import { ModePicker } from '../../ui/mode-picker';
import { VegMark } from '../../ui/veg-mark';

interface Step {
  icon: IconName;
  title: string;
  text: string;
}

@Component({
  selector: 'app-home-page',
  imports: [HotelFacade, ModePicker, Icon, DishArt, VegMark, InrPipe, RouterLink],
  templateUrl: './home-page.html',
  styles: `
    .hero-bg {
      background:
        radial-gradient(60% 80% at 75% 90%, rgb(245 183 48 / 0.22), transparent 70%),
        radial-gradient(120% 100% at 50% 100%, #3a2416 0%, #1c1512 50%, #0f0b09 100%);
    }
  `,
})
export class HomePage {
  protected readonly session = inject(DiningSessionStore);
  protected readonly cart = inject(Cart);
  private readonly ui = inject(UiState);
  private readonly router = inject(Router);

  protected readonly ready = computed(
    () => this.session.mode() === 'takeaway' || (this.session.mode() === 'dine-in' && !!this.session.table()),
  );

  protected readonly popular = MENU.filter((m) => m.tags.includes('bestseller') && m.available).slice(0, 8);

  protected readonly steps: Step[] = [
    { icon: 'search', title: 'Browse & customise', text: 'Every dish, every add-on — ghee roast, spice level, notes for the chef.' },
    { icon: 'lock', title: 'Pay in a tap', text: 'UPI or card, right from your seat. No waiting to catch a server for the bill.' },
    { icon: 'printer', title: 'Billing fires it', text: 'Your GST invoice prints at the counter and a kitchen ticket goes straight to the line.' },
    { icon: 'chef', title: 'Cooked & served', text: 'Chefs see it instantly. You watch it move — and we bring it to your table.' },
  ];

  protected continue(): void {
    if (this.ready()) void this.router.navigateByUrl('/menu');
  }

  protected quickAdd(id: string): void {
    const item = MENU.find((m) => m.id === id);
    if (!item) return;
    if (item.options?.length) {
      void this.router.navigateByUrl('/menu');
      return;
    }
    this.cart.add(item);
    this.ui.toast(`${item.name} added`);
  }
}
