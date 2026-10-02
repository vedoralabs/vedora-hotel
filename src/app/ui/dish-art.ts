import { Component, computed, input } from '@angular/core';
import { DishLook } from '../core/models';

let uid = 0;

interface Dot {
  x: number;
  y: number;
  r: number;
  rot: number;
}

/** Illustrated, top-down plate art generated from a dish's palette — no photos required. */
@Component({
  selector: 'app-dish-art',
  host: { class: 'block', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 200 200" class="h-full w-full" [class.grayscale]="muted()">
      <defs>
        <radialGradient [id]="gid + 'f'" cx="40%" cy="35%" r="75%">
          <stop offset="0" [attr.stop-color]="look().accent" />
          <stop offset="1" [attr.stop-color]="look().base" />
        </radialGradient>
        <linearGradient [id]="gid + 's'" x1="0" x2="1">
          <stop offset="0" stop-color="#d9dde1" />
          <stop offset="0.5" stop-color="#f4f6f8" />
          <stop offset="1" stop-color="#b9bfc5" />
        </linearGradient>
      </defs>

      @switch (look().shape) {
        @case ('cup') {
          <ellipse cx="100" cy="164" rx="70" ry="16" fill="#00000014" />
          <path d="M42 150 Q100 182 158 150 L150 140 Q100 162 50 140 Z" [attr.fill]="'url(#' + gid + 's)'" />
          <path d="M66 70 L134 70 L124 150 Q100 158 76 150 Z" [attr.fill]="'url(#' + gid + 's)'" />
          <ellipse cx="100" cy="70" rx="34" ry="9" [attr.fill]="look().base" />
          <ellipse cx="100" cy="68" rx="28" ry="6" [attr.fill]="look().accent" />
          @for (s of [0, 1, 2]; track s) {
            <path
              class="steam"
              [style.animation-delay]="s * 0.6 + 's'"
              [attr.d]="'M' + (86 + s * 14) + ' 54 q-8 -12 0 -22 q8 -10 0 -22'"
              fill="none"
              stroke="#bfb5aa"
              stroke-width="3"
              stroke-linecap="round"
            />
          }
        }
        @case ('glass') {
          <ellipse cx="100" cy="172" rx="44" ry="9" fill="#00000014" />
          <path d="M62 40 L138 40 L128 168 Q100 176 72 168 Z" fill="#ffffffb3" stroke="#d8cfc3" stroke-width="2" />
          <path d="M66 70 L134 70 L127 164 Q100 171 73 164 Z" [attr.fill]="'url(#' + gid + 'f)'" />
          <ellipse cx="100" cy="70" rx="34" ry="6" [attr.fill]="look().accent" />
          <rect x="112" y="18" width="7" height="96" rx="3" transform="rotate(14 115 66)" fill="#e9a23b" />
          <path d="M80 62 q10 -16 22 -4 q-10 10 -22 4z" [attr.fill]="look().garnish" />
          @for (b of dots().slice(0, 5); track $index) {
            <circle [attr.cx]="80 + b.x * 0.4" [attr.cy]="100 + b.y * 0.5" r="2.5" fill="#ffffff8c" />
          }
        }
        @default {
          <ellipse cx="100" cy="108" rx="88" ry="86" fill="#00000012" />
          <circle cx="100" cy="100" r="88" fill="#fffdf9" stroke="#eadfcd" stroke-width="2" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="#f1e8da" stroke-width="2" />

          @switch (look().shape) {
            @case ('dosa') {
              <g transform="rotate(-24 100 100)">
                <rect x="26" y="78" width="148" height="44" rx="22" [attr.fill]="'url(#' + gid + 'f)'" />
                <path d="M30 100 H170" stroke="#00000014" stroke-width="3" />
                @for (d of dots(); track $index) {
                  <ellipse
                    [attr.cx]="40 + d.x * 1.2"
                    [attr.cy]="84 + (d.y % 30)"
                    [attr.rx]="d.r * 0.8"
                    [attr.ry]="d.r * 0.45"
                    [attr.fill]="look().garnish"
                    opacity="0.45"
                  />
                }
              </g>
              <circle cx="62" cy="150" r="17" fill="#f3efe6" stroke="#e1d6c4" />
              <circle cx="62" cy="150" r="12" fill="#e9eedc" />
              <circle cx="104" cy="160" r="17" fill="#f3efe6" stroke="#e1d6c4" />
              <circle cx="104" cy="160" r="12" fill="#d9822f" />
            }
            @case ('idli') {
              <circle cx="78" cy="88" r="32" [attr.fill]="look().base" stroke="#00000012" stroke-width="3" />
              <circle cx="122" cy="94" r="32" [attr.fill]="look().base" stroke="#00000012" stroke-width="3" />
              <circle cx="100" cy="132" r="28" [attr.fill]="look().accent" />
              <circle cx="100" cy="132" r="9" fill="#fffdf9" />
              @for (d of dots().slice(0, 7); track $index) {
                <circle [attr.cx]="60 + d.x * 0.8" [attr.cy]="70 + d.y * 0.4" r="2.2" [attr.fill]="look().garnish" />
              }
            }
            @case ('bowl') {
              <circle cx="100" cy="100" r="60" fill="#3a2e27" />
              <circle cx="100" cy="100" r="54" [attr.fill]="'url(#' + gid + 'f)'" />
              <path
                d="M70 96 q14 -18 30 -4 t30 4"
                fill="none"
                [attr.stroke]="look().garnish"
                stroke-width="5"
                stroke-linecap="round"
                opacity="0.85"
              />
              @for (d of dots().slice(0, 8); track $index) {
                <rect
                  [attr.x]="66 + d.x * 0.6"
                  [attr.y]="70 + d.y * 0.55"
                  [attr.width]="d.r + 4"
                  [attr.height]="d.r + 4"
                  rx="2"
                  [attr.transform]="'rotate(' + d.rot + ' ' + (70 + d.x * 0.6) + ' ' + (74 + d.y * 0.55) + ')'"
                  [attr.fill]="look().accent"
                  opacity="0.9"
                />
              }
              <path d="M128 64 q10 -6 14 4 q-8 6 -14 -4z" fill="#3f8f3a" />
            }
            @case ('rice') {
              <path
                d="M40 112 C40 70 70 52 100 52 C134 52 162 72 160 112 C158 140 130 150 100 150 C68 150 40 140 40 112Z"
                [attr.fill]="'url(#' + gid + 'f)'"
              />
              @for (d of dots(); track $index) {
                <ellipse
                  [attr.cx]="54 + d.x"
                  [attr.cy]="66 + d.y * 0.7"
                  rx="4"
                  ry="1.6"
                  [attr.transform]="'rotate(' + d.rot + ' ' + (54 + d.x) + ' ' + (66 + d.y * 0.7) + ')'"
                  fill="#fff8e6"
                  opacity="0.8"
                />
              }
              @for (d of dots().slice(0, 4); track $index) {
                <circle [attr.cx]="64 + d.x * 0.8" [attr.cy]="74 + d.y * 0.6" r="4" [attr.fill]="look().garnish" />
              }
            }
            @case ('bread') {
              <ellipse cx="88" cy="104" rx="56" ry="50" [attr.fill]="look().accent" transform="rotate(-12 88 104)" />
              <ellipse cx="110" cy="96" rx="54" ry="48" [attr.fill]="'url(#' + gid + 'f)'" transform="rotate(10 110 96)" />
              @for (d of dots(); track $index) {
                <ellipse
                  [attr.cx]="70 + d.x * 0.85"
                  [attr.cy]="62 + d.y * 0.7"
                  [attr.rx]="d.r * 0.7"
                  [attr.ry]="d.r * 0.45"
                  [attr.fill]="look().garnish"
                  opacity="0.5"
                />
              }
            }
            @case ('sweet') {
              @for (p of [[70, 84], [116, 80], [92, 124]]; track $index) {
                <rect
                  [attr.x]="p[0] - 24"
                  [attr.y]="p[1] - 20"
                  width="48"
                  height="40"
                  rx="6"
                  [attr.fill]="'url(#' + gid + 'f)'"
                  [attr.transform]="'rotate(' + ($index * 14 - 10) + ' ' + p[0] + ' ' + p[1] + ')'"
                />
              }
              @for (d of dots().slice(0, 12); track $index) {
                <circle [attr.cx]="50 + d.x * 0.9" [attr.cy]="64 + d.y * 0.7" r="1.8" [attr.fill]="look().garnish" />
              }
            }
            @default {
              @for (d of dots(); track $index) {
                <path
                  [attr.d]="blob(d)"
                  [attr.fill]="$index % 3 === 0 ? look().accent : look().base"
                  stroke="#00000018"
                  stroke-width="1.5"
                />
              }
              @for (d of dots().slice(0, 6); track $index) {
                <path
                  [attr.d]="'M' + (60 + d.x * 0.8) + ' ' + (60 + d.y * 0.7) + ' q6 -8 12 0 q-6 6 -12 0z'"
                  [attr.fill]="look().garnish"
                />
              }
            }
          }
        }
      }
    </svg>
  `,
  styles: `
    .steam {
      animation: steam 2.4s ease-in-out infinite;
      opacity: 0;
    }
    @keyframes steam {
      0% {
        opacity: 0;
        transform: translateY(6px);
      }
      40% {
        opacity: 0.8;
      }
      100% {
        opacity: 0;
        transform: translateY(-10px);
      }
    }
  `,
})
export class DishArt {
  readonly look = input.required<DishLook>();
  readonly seed = input('dish');
  readonly muted = input(false);

  protected readonly gid = `dish${++uid}`;

  protected readonly dots = computed<Dot[]>(() => {
    let h = 2166136261;
    for (const ch of this.seed()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const rand = () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
    return Array.from({ length: 16 }, () => ({
      x: rand() * 90,
      y: rand() * 110,
      r: 4 + rand() * 8,
      rot: rand() * 180,
    }));
  });

  protected blob(d: Dot): string {
    const cx = 56 + d.x;
    const cy = 50 + d.y * 0.85;
    const r = 10 + d.r * 0.9;
    return `M${cx - r} ${cy} q${r * 0.2} ${-r * 1.1} ${r} ${-r * 0.9} q${r * 1.1} ${r * 0.1} ${r} ${r} q${-r * 0.3} ${r * 0.9} ${-r} ${r * 0.8} q${-r * 0.9} ${-r * 0.2} ${-r} ${-r * 0.9}z`;
  }
}
