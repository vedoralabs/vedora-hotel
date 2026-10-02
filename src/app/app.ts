import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { DiningSessionStore, normaliseTable } from './core/dining-session';
import { CartDrawer } from './ui/cart-drawer';
import { HotelIntro } from './ui/hotel-intro';
import { SiteFooter } from './ui/site-footer';
import { SiteHeader } from './ui/site-header';
import { Toasts } from './ui/toasts';

const INTRO_KEY = 'vh.intro.seen';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteHeader, SiteFooter, CartDrawer, Toasts, HotelIntro],
  template: `
    @if (staff()) {
      <router-outlet />
    } @else {
      <app-site-header />
      <main id="main" tabindex="-1" class="min-h-[70dvh] focus:outline-none">
        <router-outlet />
      </main>
      @if (!embedded) {
        <app-site-footer />
      }
      <app-cart-drawer />
    }
    <app-toasts />
    @if (showIntro()) {
      <app-hotel-intro (done)="introDone()" />
    }
  `,
})
export class App {
  private readonly router = inject(Router);
  private readonly session = inject(DiningSessionStore);

  protected readonly embedded = new URLSearchParams(location.search).has('embed');
  protected readonly showIntro = signal(!this.embedded && !location.pathname.match(/^\/(counter|kitchen)/) && !sessionSeen());

  protected readonly staff = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => {
        this.applyTableFromQr(e.urlAfterRedirects);
        return !!deepest(this.router.routerState.snapshot.root).data['staff'];
      }),
    ),
    { initialValue: /^\/(counter|kitchen)/.test(location.pathname) },
  );

  protected introDone(): void {
    this.showIntro.set(false);
    try {
      sessionStorage.setItem(INTRO_KEY, '1');
    } catch {
      // ignore
    }
  }

  /** Table QR codes link to e.g. /?table=7 — pre-select dine-in at that table. */
  private applyTableFromQr(url: string): void {
    const table = this.router.parseUrl(url).queryParams['table'];
    if (typeof table === 'string' && normaliseTable(table)) this.session.set('dine-in', table);
  }
}

function deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? deepest(route.firstChild) : route;
}

function sessionSeen(): boolean {
  try {
    return sessionStorage.getItem(INTRO_KEY) === '1';
  } catch {
    return false;
  }
}
