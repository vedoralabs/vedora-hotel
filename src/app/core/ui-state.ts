import { Service, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
}

@Service()
export class UiState {
  readonly cartOpen = signal(false);
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  toast(text: string): void {
    const id = this.nextId++;
    this.toasts.update((t) => [...t.slice(-2), { id, text }]);
    setTimeout(() => this.toasts.update((t) => t.filter((x) => x.id !== id)), 2600);
  }
}
