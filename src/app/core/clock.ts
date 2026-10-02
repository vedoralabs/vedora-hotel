import { DestroyRef, Service, inject, signal } from '@angular/core';

@Service()
export class Clock {
  readonly now = signal(Date.now());

  constructor() {
    const id = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}

export function elapsed(from: number, now: number): string {
  const s = Math.max(0, Math.floor((now - from) / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function clockTime(at: number): string {
  return new Date(at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
