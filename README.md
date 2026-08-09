# @codewithsachin/ngx-gsap

Angular directives for [GSAP](https://gsap.com) + [Lenis](https://lenis.darkroom.engineering) —
scrub timelines, split-text reveals, marquees, counters and canvas frame sequences.

**[Live demo & docs → https://sachinsingh.me/packages/gsap](https://sachinsingh.me/packages/gsap)**

GSAP and ScrollTrigger are the heavy machinery behind scroll-driven sites, and wiring
them into Angular means the same boilerplate every time: register plugins once,
browser-only; do DOM work after render; scope everything to a `gsap.context()` so it
reverts on destroy. This package is that boilerplate, written once, as directives.

- Every directive early-returns on the server; nothing touches the DOM there.
- Reduced motion is a first-class path — timelines jump to their final state, marquees
  freeze, counters print their final value, sequences draw their last frame.
- Lenis smooth scroll synced to ScrollTrigger and driven off `gsap.ticker` — the rAF
  loop never touches change detection.

## Install

```bash
npm i @codewithsachin/ngx-gsap gsap lenis
```

Peer dependencies: Angular 22+, `gsap` 3.13+, `lenis` 1.3+. SplitText is a GSAP plugin,
free from GSAP 3.13 onward — which is why the peer range starts there.

## Setup

```ts
import { ApplicationConfig } from '@angular/core';
import { provideGsap } from '@codewithsachin/ngx-gsap';

export const appConfig: ApplicationConfig = {
  // Registers ScrollTrigger + SplitText once, browser-only.
  // Required before any directive in this package works.
  providers: [provideGsap()],
};
```

## Requirements

Peer ranges are wider than this; the **Tested** column is the exact combination the
[live demo](https://sachinsingh.me/packages/gsap) runs, so you have a known-good set to fall back on.

| Package         | Peer range | Tested  | Notes                                                                    |
| --------------- | ---------- | ------- | ------------------------------------------------------------------------ |
| `@angular/core` | `^22.0.0`  | 22.0.5  | Standalone APIs, signal inputs and `afterNextRender`.                    |
| `typescript`    | `~6.0.0`   | 6.0.3   | Whatever your Angular version supports.                                  |
| `node`          | `>=20`     | 24.15.0 | Build and SSR only.                                                      |
| `gsap`          | `^3.13.0`  | 3.15.0  | SplitText became free in 3.13, which is why the range starts there.      |
| `lenis`         | `^1.3.0`   | 1.3.25  | Only used by `ScrollService`; the directives work without smooth scroll. |

## Providers

**Required.** Without it ScrollTrigger and SplitText are never registered and every directive silently does nothing.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideGsap } from '@codewithsachin/ngx-gsap';

export const appConfig: ApplicationConfig = {
  providers: [provideGsap()],
};

// main.ts
// bootstrapApplication(App, appConfig);
```

## Using NgModules

Everything here is standalone, but standalone components and directives are importable from
an `@NgModule` — put them in the module's `imports`, **not** `declarations`. No
`importProvidersFrom` is needed: `@NgModule.providers` is typed
`Array<Provider | EnvironmentProviders>`, so the `provide*()` functions drop straight in.

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  MarqueeDirective,
  CountUpDirective,
  SplitRevealDirective,
  ScrubTimelineDirective,
  FrameSequenceComponent,
  provideGsap,
} from '@codewithsachin/ngx-gsap';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  // Standalone components and directives go in `imports`.
  imports: [
    BrowserModule,
    MarqueeDirective,
    CountUpDirective,
    SplitRevealDirective,
    ScrubTimelineDirective,
    FrameSequenceComponent,
  ],
  providers: [provideGsap()],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

## `ngxMarquee`

Wraps the host's content in a track and clones it until the row is at least twice the
host width, then loops it linearly. Clones are `aria-hidden`.

```html
<div ngxMarquee [speed]="80">CRAFT OVER HYPE ·&nbsp;</div>
<div ngxMarquee [speed]="140" [direction]="-1">…</div>
```

| Input       | Type      | Default | Notes                           |
| ----------- | --------- | ------- | ------------------------------- |
| `speed`     | `number`  | `90`    | Pixels per second.              |
| `direction` | `1 \| -1` | `1`     | `1` leftwards, `-1` rightwards. |

## `ngxCountUp`

```html
<span [ngxCountUp]="70000" suffix="+" [duration]="2"></span>
```

| Input        | Type     | Default | Notes                                                          |
| ------------ | -------- | ------- | -------------------------------------------------------------- |
| `ngxCountUp` | `number` | —       | Required. Starts when the host hits 85% of the viewport, once. |
| `duration`   | `number` | `1.6`   | Seconds, eased with `power2.out`.                              |
| `suffix`     | `string` | `''`    | Appended to every frame — `+`, `%`, `k`.                       |

## `ngxSplitReveal`

```html
<h2 ngxSplitReveal mode="words" [stagger]="0.05">Every pixel is a promise</h2>
```

| Input      | Type                            | Default   | Notes                                             |
| ---------- | ------------------------------- | --------- | ------------------------------------------------- |
| `mode`     | `'lines' \| 'words' \| 'chars'` | `'words'` | See the warning below.                            |
| `scrubbed` | `boolean`                       | `true`    | `false` plays once on enter and reverses on exit. |
| `stagger`  | `number`                        | `0.03`    | Seconds between pieces.                           |
| `y`        | `number`                        | `28`      | Travel in pixels.                                 |

> ⚠️ **Never use `mode="chars"` on Devanagari or other Indic scripts** — conjunct
> ligatures break when text is split per character. `words` and `lines` are safe.

## `ngxScrub`

A scroll-scrubbed timeline bound to the host. Your callback runs inside a
`gsap.context()` scoped to the host, so plain selector strings only match inside that
section — and everything reverts automatically on destroy.

```ts
@Component({
  imports: [ScrubTimelineDirective],
  template: `
    <section ngxScrub [pin]="true" end="+=150%" (timelineReady)="build($event)">
      <div class="bar"></div>
    </section>
  `,
})
export class Chapter {
  protected build(tl: gsap.core.Timeline): void {
    tl.to('.bar', { width: '100%', ease: 'none' });
  }
}
```

| Input / Output  | Type                         | Default        | Notes                                     |
| --------------- | ---------------------------- | -------------- | ----------------------------------------- |
| `start`         | `string`                     | `'top bottom'` | ScrollTrigger start position.             |
| `end`           | `string`                     | `'bottom top'` | e.g. `'+=150%'`.                          |
| `scrub`         | `boolean \| number`          | `true`         | A number adds catch-up smoothing seconds. |
| `pin`           | `boolean`                    | `false`        | Pin the host for the timeline's duration. |
| `markers`       | `boolean`                    | `false`        | ScrollTrigger debug markers.              |
| `timelineReady` | `output<gsap.core.Timeline>` | —              | Populate the timeline synchronously.      |

Under reduced motion the timeline is created paused and jumped to `progress(1)` — the
final state, no scrubbing.

## `<ngx-frame-sequence>`

A scroll-scrubbed canvas image sequence. Frames are fetched and decoded to
`ImageBitmap`s about two viewports before arrival, then drawn at `devicePixelRatio`
capped at 2.

```html
<ngx-frame-sequence class="relative block h-screen" [frames]="frames" [pinLength]="150">
  <h3 class="absolute inset-0 grid place-items-center">{{ caption() }}</h3>
</ngx-frame-sequence>
```

| Input / Member   | Type                   | Default   | Notes                                                      |
| ---------------- | ---------------------- | --------- | ---------------------------------------------------------- |
| `frames`         | `string[]`             | —         | Required. Image URLs in order.                             |
| `pinLength`      | `number`               | `200`     | Viewport-heights of scroll the pin consumes. `0` = no pin. |
| `fit`            | `'cover' \| 'contain'` | `'cover'` | How each frame fills the canvas.                           |
| `external`       | `boolean`              | `false`   | No scroll trigger of its own — drive with `setProgress()`. |
| `progress`       | `Signal<number>`       | —         | 0–1 sequence progress; drive overlay swaps off it.         |
| `setProgress(p)` | `(number) => void`     | —         | External-drive entry point; clamps to 0–1.                 |

The host is **not** positioned for you — component styles are un-layered and would
outrank Tailwind utilities. Position it yourself (`relative h-screen`, `absolute inset-0`).

## `ScrollService`

```ts
export class App {
  private readonly scroll = inject(ScrollService);

  constructor() {
    afterNextRender(() => this.scroll.init()); // once, from the root component
  }

  protected readonly progress = this.scroll.progress; // a signal
}
```

| Member                      | Type                                        | Notes                                                       |
| --------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| `init()`                    | `() => void`                                | Idempotent, browser-only, skipped under reduced motion.     |
| `progress`                  | `Signal<number>`                            | 0–1 page scroll progress, updated outside change detection. |
| `scrollTo(target, offset?)` | `(string \| number \| HTMLElement, number)` | Falls back to `scrollIntoView` when Lenis is off.           |
| `stop()` / `start()`        | `() => void`                                | Pause and resume — useful behind a modal.                   |
| `destroy()`                 | `() => void`                                | Called automatically when the root injector is destroyed.   |

## Re-measuring

ScrollTrigger turns `start`/`end` into pixel positions the moment a trigger is created.
Plenty of things move the page _after_ that — `ngxMarquee` clones its track, `ngxSplitReveal`
lets SplitText rewrap every line, web fonts swap in, images finish decoding. A trigger
measured too early is then quietly wrong for the rest of the session: scrubbed timelines run
early, counters fire off-screen, and nothing points at the cause.

Every directive here handles that for you — after setup it schedules a debounced
`ScrollTrigger.refresh()`, arms one more for `document.fonts.ready`, and watches the document
height so late arrivals are caught too. If you change page height in a way nothing observes,
call `ScrollService.refresh()` (or the exported `scheduleScrollRefresh()`) yourself.

## `prefersReducedMotion()`

A small SSR-safe helper, exported for consumers building their own reduced-motion paths.

```ts
import { prefersReducedMotion } from '@codewithsachin/ngx-gsap';
if (!prefersReducedMotion()) {
  /* … */
}
```

## Licence

MIT © Sachin Singh
