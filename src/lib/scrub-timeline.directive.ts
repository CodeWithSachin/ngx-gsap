import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';

/**
 * Declarative scroll-scrubbed timeline bound to the host element.
 * Emits the timeline via `timelineReady` so the section component can
 * populate it: `<section ngxScrub [pin]="true" (timelineReady)="build($event)">`.
 * Cleanup is automatic (gsap.context revert on destroy).
 */
@Directive({ selector: '[ngxScrub]' })
export class ScrubTimelineDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly start = input('top bottom');
  readonly end = input('bottom top');
  readonly scrub = input<boolean | number>(true);
  readonly pin = input(false);
  readonly markers = input(false);

  readonly timelineReady = output<gsap.core.Timeline>();

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: this.el.nativeElement,
            start: this.start(),
            end: this.end(),
            scrub: this.scrub(),
            pin: this.pin(),
            markers: this.markers(),
          },
        });
        this.timelineReady.emit(tl);
      }, this.el.nativeElement);

      destroyRef.onDestroy(() => ctx.revert());
    });
  }
}
