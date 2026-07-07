import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { prefersReducedMotion } from './reduced-motion';

/**
 * Infinite marquee. Wraps host content in a track, clones it until the row
 * is at least 2× the host width, then loops with a linear xPercent tween.
 * Used for the hero ribbons and the "उत्तिष्ठत जाग्रत" CTA rows.
 */
@Directive({ selector: '[ngxMarquee]' })
export class MarqueeDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Pixels per second. */
  readonly speed = input(90);
  /** 1 = leftwards, -1 = rightwards. */
  readonly direction = input<1 | -1>(1);

  private tween?: gsap.core.Tween;

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (prefersReducedMotion()) return; // static single row
      const host = this.el.nativeElement;
      host.style.overflow = 'hidden';
      host.style.display = 'flex';
      host.style.whiteSpace = 'nowrap';

      const track = document.createElement('div');
      track.style.cssText = 'display:inline-flex;align-items:center;flex-shrink:0;';
      while (host.firstChild) track.appendChild(host.firstChild);
      host.appendChild(track);

      const tracks: HTMLElement[] = [track];
      const hostWidth = host.getBoundingClientRect().width || 1;
      let total = track.getBoundingClientRect().width || 1;
      while (total < hostWidth * 2) {
        const clone = track.cloneNode(true) as HTMLElement;
        clone.setAttribute('aria-hidden', 'true');
        host.appendChild(clone);
        tracks.push(clone);
        total += clone.getBoundingClientRect().width || 1;
      }

      const width = track.getBoundingClientRect().width || 1;
      const duration = width / this.speed();
      const from = this.direction() === 1 ? 0 : -100;
      const to = this.direction() === 1 ? -100 : 0;

      this.tween = gsap.fromTo(
        tracks,
        { xPercent: from },
        { xPercent: to, duration, ease: 'none', repeat: -1 },
      );

      destroyRef.onDestroy(() => this.tween?.kill());
    });
  }
}
