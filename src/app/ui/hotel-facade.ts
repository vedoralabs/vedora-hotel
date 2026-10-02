import { Component, input } from '@angular/core';

/**
 * Illustrated Vedora Hotel storefront. With `play` it performs the opening sequence:
 * outline draws → walls fill → windows light up → sign flickers on → doors swing open.
 */
@Component({
  selector: 'app-hotel-facade',
  host: { class: 'block', '[class.play]': 'play()', role: 'img', 'aria-label': 'Illustration of the Vedora Hotel storefront at night' },
  template: `
    <svg viewBox="0 0 400 300" class="h-auto w-full overflow-visible">
      <defs>
        <radialGradient id="vh-glow" cx="50%" cy="60%" r="60%">
          <stop offset="0" stop-color="#ffd877" stop-opacity="0.95" />
          <stop offset="1" stop-color="#ffb02e" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="vh-door-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe7a8" />
          <stop offset="1" stop-color="#f5a623" />
        </linearGradient>
        <filter id="vh-neon" x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <!-- light spill on the pavement -->
      <ellipse class="spill" cx="200" cy="270" rx="120" ry="22" fill="url(#vh-glow)" />

      <!-- ground -->
      <rect x="0" y="262" width="400" height="38" fill="#2a211c" />
      <path d="M0 284 H400" stroke="#4a3c33" stroke-width="2" stroke-dasharray="18 14" />

      <!-- lamp posts -->
      @for (x of [26, 374]; track x) {
        <g class="lamp" [style.--d]="x === 26 ? '1.05s' : '1.25s'">
          <rect [attr.x]="x - 2" y="150" width="4" height="112" fill="#3a2e27" />
          <circle class="lamp-glow" [attr.cx]="x" cy="146" r="22" fill="url(#vh-glow)" />
          <circle class="lamp-bulb" [attr.cx]="x" cy="146" r="7" fill="#ffd877" />
        </g>
      }

      <!-- chimney + steam -->
      <rect class="fill-in" x="286" y="58" width="20" height="40" fill="#8c3d1f" />
      @for (s of [0, 1, 2]; track s) {
        <path
          class="steam"
          [style.animation-delay]="2 + s * 0.7 + 's'"
          [attr.d]="'M' + (292 + s * 5) + ' 54 q-10 -14 0 -26 q10 -12 0 -26'"
          fill="none"
          stroke="#e9dfd2"
          stroke-width="4"
          stroke-linecap="round"
        />
      }

      <!-- roof -->
      <polygon class="fill-in" points="36,114 200,38 364,114" fill="#b4532a" />
      @for (y of [62, 78, 94, 108]; track y) {
        <path class="fill-in" [attr.d]="roofLine(y)" stroke="#8c3d1f" stroke-width="2" />
      }
      <polygon class="draw" points="36,114 200,38 364,114" fill="none" stroke="#f4ebdc" stroke-width="2.5" />

      <!-- walls -->
      <rect class="fill-in" x="58" y="112" width="284" height="150" fill="#f4ebdc" />
      <rect class="fill-in" x="58" y="248" width="284" height="14" fill="#e3d4bd" />
      <rect class="draw" x="58" y="112" width="284" height="150" fill="none" stroke="#f4ebdc" stroke-width="2.5" />

      <!-- sign -->
      <rect class="fill-in" x="124" y="120" width="152" height="30" rx="5" fill="#1c1512" />
      <text
        class="neon"
        x="200"
        y="141"
        text-anchor="middle"
        font-family="Fraunces, Georgia, serif"
        font-weight="700"
        font-size="17"
        letter-spacing="3"
        fill="#f5b730"
        filter="url(#vh-neon)"
      >
        VEDORA HOTEL
      </text>

      <!-- windows -->
      @for (w of windows; track w.x) {
        <g>
          <rect class="fill-in" [attr.x]="w.x - 3" y="163" width="40" height="52" rx="3" fill="#6b3a1f" />
          <rect class="win" [style.--d]="w.d" [attr.x]="w.x" y="166" width="34" height="46" rx="2" />
          <path [attr.d]="'M' + (w.x + 17) + ' 166 V212 M' + w.x + ' 189 H' + (w.x + 34)" stroke="#6b3a1f" stroke-width="3" class="fill-in" />
          <rect class="fill-in" [attr.x]="w.x - 6" y="215" width="46" height="6" rx="2" fill="#2f7d32" />
        </g>
      }

      <!-- awning -->
      <g class="awning">
        @for (i of awningStripes; track i) {
          <path
            [attr.d]="'M' + (160 + i * 10) + ' 156 h10 v14 a5 5 0 0 1 -10 0z'"
            [attr.fill]="i % 2 === 0 ? '#f5b730' : '#fbf6ee'"
          />
        }
      </g>

      <!-- doorway -->
      <rect class="fill-in" x="170" y="172" width="60" height="90" fill="#6b3a1f" />
      <rect x="175" y="177" width="50" height="85" fill="url(#vh-door-light)" class="door-light" />
      <g class="fill-in">
        <circle cx="200" cy="214" r="8" fill="#b4532a" opacity="0.7" />
        <rect x="190" y="222" width="20" height="40" rx="4" fill="#b4532a" opacity="0.5" />
      </g>
      <rect class="door door-l" x="175" y="177" width="25" height="85" fill="#8a4a24" stroke="#5a2f17" stroke-width="2" />
      <rect class="door door-r" x="200" y="177" width="25" height="85" fill="#8a4a24" stroke="#5a2f17" stroke-width="2" />

      <!-- steps + planters -->
      <rect class="fill-in" x="164" y="262" width="72" height="6" fill="#cbb894" />
      @for (x of [146, 254]; track x) {
        <g class="fill-in">
          <rect [attr.x]="x - 9" y="240" width="18" height="22" rx="3" fill="#b4532a" />
          <circle [attr.cx]="x" cy="232" r="13" fill="#2f7d32" />
          <circle [attr.cx]="x - 6" cy="226" r="7" fill="#3f8f3a" />
        </g>
      }
    </svg>
  `,
  styles: `
    .win {
      fill: #ffd66b;
      filter: drop-shadow(0 0 6px rgb(255 205 100 / 0.8));
    }
    .door-l {
      transform-origin: 175px 0;
      transform: scaleX(0.16);
    }
    .door-r {
      transform-origin: 225px 0;
      transform: scaleX(0.16);
    }
    .steam {
      animation: vh-steam 2.6s ease-in-out infinite;
      opacity: 0;
    }
    .lamp-glow {
      opacity: 0.9;
    }
    .neon {
      opacity: 1;
    }

    :host(.play) .draw {
      stroke-dasharray: 900;
      stroke-dashoffset: 900;
      animation: vh-draw 1.2s cubic-bezier(0.6, 0, 0.3, 1) forwards;
    }
    :host(.play) .fill-in {
      opacity: 0;
      animation: vh-fade 0.6s ease 0.8s forwards;
    }
    :host(.play) .win {
      animation: vh-light 0.35s steps(2, jump-none) var(--d) both;
    }
    :host(.play) .lamp-glow,
    :host(.play) .lamp-bulb {
      animation: vh-fade 0.4s ease var(--d) both;
    }
    :host(.play) .awning {
      transform-origin: 200px 156px;
      animation: vh-drop 0.5s cubic-bezier(0.3, 1.4, 0.5, 1) 1.5s both;
    }
    :host(.play) .neon {
      animation: vh-flicker 0.9s linear 1.8s both;
    }
    :host(.play) .door-l,
    :host(.play) .door-r {
      animation: vh-open 0.9s cubic-bezier(0.5, 0, 0.2, 1) 2.3s both;
    }
    :host(.play) .door-light,
    :host(.play) .spill {
      animation: vh-fade 0.8s ease 2.4s both;
    }

    @keyframes vh-draw {
      to {
        stroke-dashoffset: 0;
      }
    }
    @keyframes vh-fade {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes vh-light {
      from {
        fill: #2a211c;
        filter: none;
      }
    }
    @keyframes vh-drop {
      from {
        transform: scaleY(0);
      }
    }
    @keyframes vh-flicker {
      0%,
      18%,
      32%,
      58% {
        opacity: 0.15;
      }
      12%,
      26%,
      44%,
      100% {
        opacity: 1;
      }
    }
    @keyframes vh-open {
      from {
        transform: scaleX(1);
      }
    }
    @keyframes vh-steam {
      0% {
        opacity: 0;
        transform: translateY(8px);
      }
      40% {
        opacity: 0.7;
      }
      100% {
        opacity: 0;
        transform: translateY(-16px);
      }
    }
  `,
})
export class HotelFacade {
  readonly play = input(false);

  protected readonly windows = [
    { x: 76, d: '1.2s' },
    { x: 120, d: '1.4s' },
    { x: 246, d: '1.3s' },
    { x: 290, d: '1.55s' },
  ];
  protected readonly awningStripes = Array.from({ length: 8 }, (_, i) => i);

  protected roofLine(y: number): string {
    // Horizontal tile courses clipped to the roof triangle (apex 200,38 → eaves y=114).
    const half = ((y - 38) / (114 - 38)) * 164;
    return `M${200 - half} ${y} H${200 + half}`;
  }
}
