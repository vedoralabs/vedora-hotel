import { Component, input } from '@angular/core';

/** FSSAI-style veg / non-veg indicator. */
@Component({
  selector: 'app-veg-mark',
  host: { class: 'inline-flex shrink-0', role: 'img', '[attr.aria-label]': 'veg() ? "Vegetarian" : "Non-vegetarian"' },
  template: `
    <span
      class="grid size-4 place-items-center rounded-[3px] border-[1.5px] bg-paper"
      [class.border-leaf]="veg()"
      [class.border-chili]="!veg()"
    >
      @if (veg()) {
        <span class="size-2 rounded-full bg-leaf"></span>
      } @else {
        <span class="size-0 border-x-[4.5px] border-b-[8px] border-x-transparent border-b-chili"></span>
      }
    </span>
  `,
})
export class VegMark {
  readonly veg = input.required<boolean>();
}
