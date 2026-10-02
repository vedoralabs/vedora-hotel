import { Component, inject } from '@angular/core';
import { UiState } from '../core/ui-state';

@Component({
  selector: 'app-toasts',
  host: { class: 'pointer-events-none fixed inset-x-0 top-20 z-[90] flex flex-col items-center gap-2 px-4' },
  template: `
    <div role="status" aria-live="polite" class="contents">
      @for (t of ui.toasts(); track t.id) {
        <div class="animate-pop rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-cream shadow-pop">
          <span class="mr-1.5 text-saffron" aria-hidden="true">✓</span>{{ t.text }}
        </div>
      }
    </div>
  `,
})
export class Toasts {
  protected readonly ui = inject(UiState);
}
