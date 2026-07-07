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
 * Counts the host's text from 0 to `ngxCountUp` when scrolled into view.
 * `<span [ngxCountUp]="50" suffix="+"></span>` → "50+"
 */
@Directive({ selector: '[ngxCountUp]' })
export class CountUpDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly ngxCountUp = input.required<number>();
  readonly duration = input(1.6);
  readonly suffix = input('');

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const host = this.el.nativeElement;
      if (prefersReducedMotion()) {
        host.textContent = `${this.ngxCountUp()}${this.suffix()}`;
        return;
      }
      const state = { value: 0 };

      const tween = gsap.to(state, {
        value: this.ngxCountUp(),
        duration: this.duration(),
        ease: 'power2.out',
        scrollTrigger: { trigger: host, start: 'top 85%', once: true },
        onUpdate: () => {
          host.textContent = `${Math.round(state.value)}${this.suffix()}`;
        },
      });

      destroyRef.onDestroy(() => {
        tween.scrollTrigger?.kill();
        tween.kill();
      });
    });
  }
}
