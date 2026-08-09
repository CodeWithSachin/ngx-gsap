import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/**
 * Lenis smooth-scroll + ScrollTrigger sync.
 * Call `init()` once from the root component inside `afterNextRender()`.
 * Zoneless-friendly: the rAF loop runs on gsap.ticker and never touches CD;
 * consume `progress` (signal) for reactive UI like the top progress bar.
 */
@Injectable({ providedIn: 'root' })
export class ScrollService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private lenis?: Lenis;

  /** 0–1 page scroll progress. */
  readonly progress = signal(0);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destroy());
  }

  init(): void {
    if (!this.isBrowser || this.lenis) return;
    // Reduced motion: keep native scrolling; ScrollTrigger listens natively.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.lenis = new Lenis({ lerp: 0.12 });
    document.documentElement.classList.add('lenis', 'lenis-smooth');

    this.lenis.on('scroll', (l: Lenis) => {
      this.progress.set(l.progress ?? 0);
      ScrollTrigger.update();
    });

    gsap.ticker.add(this.tick);
    gsap.ticker.lagSmoothing(0);
  }

  private readonly tick = (time: number): void => {
    this.lenis?.raf(time * 1000);
  };

  /**
   * Re-measure every ScrollTrigger.
   *
   * `provideGsap()` already does this once web fonts settle. Call it yourself
   * after anything else that changes page height late — a lazy-loaded image
   * without reserved space, an accordion opening, a route-level view swap.
   */
  refresh(): void {
    if (this.isBrowser) ScrollTrigger.refresh();
  }

  scrollTo(target: string | number | HTMLElement, offset = 0): void {
    if (this.lenis) {
      this.lenis.scrollTo(target as never, { offset });
    } else if (this.isBrowser && typeof target === 'string') {
      document.querySelector(target)?.scrollIntoView();
    }
  }

  stop(): void {
    this.lenis?.stop();
  }

  start(): void {
    this.lenis?.start();
  }

  destroy(): void {
    if (!this.isBrowser) return;
    gsap.ticker.remove(this.tick);
    this.lenis?.destroy();
    this.lenis = undefined;
    document.documentElement.classList.remove('lenis', 'lenis-smooth');
  }
}
