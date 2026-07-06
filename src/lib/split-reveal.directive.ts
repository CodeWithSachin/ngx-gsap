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
import { SplitText } from 'gsap/SplitText';

/**
 * Split-text reveal on scroll (GSAP SplitText 3.13).
 *
 * ⚠️ Devanagari/Sanskrit: NEVER use `mode="chars"` on Indic text —
 * conjunct ligatures break when split per character. Use `words` or `lines`
 * (default `words` is safe).
 */
@Directive({ selector: '[ngxSplitReveal]' })
export class SplitRevealDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly mode = input<'lines' | 'words' | 'chars'>('words');
  /** true = scrubbed with scroll; false = play once on enter. */
  readonly scrubbed = input(true);
  readonly stagger = input(0.03);
  readonly y = input(28);

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const host = this.el.nativeElement;
      const split = new SplitText(host, { type: this.mode() });
      const targets =
        this.mode() === 'chars'
          ? split.chars
          : this.mode() === 'lines'
            ? split.lines
            : split.words;

      const ctx = gsap.context(() => {
        gsap.from(targets, {
          autoAlpha: 0,
          y: this.y(),
          stagger: this.stagger(),
          ease: 'power3.out',
          duration: 0.8,
          scrollTrigger: this.scrubbed()
            ? { trigger: host, start: 'top 85%', end: 'top 35%', scrub: true }
            : { trigger: host, start: 'top 85%', toggleActions: 'play none none reverse' },
        });
      }, host);

      destroyRef.onDestroy(() => {
        ctx.revert();
        split.revert();
      });
    });
  }
}
