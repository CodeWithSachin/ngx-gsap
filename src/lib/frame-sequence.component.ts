import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './reduced-motion';

/**
 * Scroll-scrubbed canvas frame sequence (the Navarasa tiger / Drishti eyes).
 *
 * - Lazily preloads frames when the section approaches (~2 viewports away)
 * - Draws ImageBitmaps at devicePixelRatio (capped at 2)
 * - `pinLength` = how many viewport-heights of scroll the pin consumes
 *
 * Projected content (`<ng-content>`) is rendered above the canvas and rides
 * along while pinned — use it for overlay text driven by `progress()`.
 */
@Component({
  selector: 'ngx-frame-sequence',
  template: `
    <canvas #cv style="position:absolute;inset:0;display:block;width:100%;height:100%"></canvas>
    <ng-content />
  `,
  // :host (not inline style) so consumer classes like `absolute inset-0`
  // can override the default positioning.
  styles: ':host{position:relative;display:block}',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrameSequenceComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');

  /** Frame image URLs, in order. */
  readonly frames = input.required<string[]>();
  /** Pin the host and scrub across this many viewport-heights. 0 = no pin. */
  readonly pinLength = input(200);
  readonly fit = input<'cover' | 'contain'>('cover');
  /**
   * External-drive mode: creates NO pin/scrub of its own — the parent (e.g.
   * an already-pinned stage's timeline) calls `setProgress()` each update.
   * Lazy preload still happens automatically.
   */
  readonly external = input(false);

  /** 0–1 sequence progress (drive overlay text swaps off this). */
  readonly progress = signal(0);

  /** Drive the sequence from an external timeline (requires `external`). */
  setProgress(p: number): void {
    const count = this.frames().length;
    const clamped = Math.min(1, Math.max(0, p));
    this.progress.set(clamped);
    const next = Math.min(count - 1, Math.floor(clamped * count));
    if (next !== this.frameIndex) this.draw(next);
  }

  private bitmaps: (ImageBitmap | HTMLImageElement)[] = [];
  private frameIndex = 0;

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const el = this.host.nativeElement;
      const triggers: ScrollTrigger[] = [];
      const reduced = prefersReducedMotion();

      // Lazy preload before arrival (wider margin in external mode, since the
      // host usually sits inside a tall pinned section); reduced motion shows
      // the final frame and completes overlays immediately (no pin, no scrub).
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: this.external() ? 'top 300%' : 'top 200%',
          once: true,
          onEnter: () =>
            void this.preload().then(() => {
              if (reduced) {
                this.frameIndex = this.frames().length - 1;
                this.progress.set(1);
              }
              this.draw(this.frameIndex);
            }),
        }),
      );

      const state = { frame: 0 };
      const count = () => this.frames().length;

      if (!reduced && !this.external()) {
        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            start: 'top top',
            end: () => `+=${(this.pinLength() / 100) * window.innerHeight}`,
            pin: this.pinLength() > 0,
            scrub: 0.5,
            onUpdate: (st) => {
              this.progress.set(st.progress);
              const next = Math.min(count() - 1, Math.floor(st.progress * count()));
              if (next !== state.frame) {
                state.frame = next;
                this.draw(next);
              }
            },
          }),
        );
      }

      const onResize = () => {
        this.resizeCanvas();
        this.draw(this.frameIndex);
      };
      this.resizeCanvas();
      window.addEventListener('resize', onResize, { passive: true });

      destroyRef.onDestroy(() => {
        window.removeEventListener('resize', onResize);
        triggers.forEach((t) => t.kill());
        this.bitmaps.forEach((b) => 'close' in b && b.close());
        this.bitmaps = [];
      });
    });
  }

  private async preload(): Promise<void> {
    if (this.bitmaps.length) return;
    this.bitmaps = await Promise.all(
      this.frames().map(async (url) => {
        try {
          const blob = await (await fetch(url)).blob();
          return await createImageBitmap(blob);
        } catch {
          const img = new Image();
          img.src = url;
          await img.decode().catch(() => undefined);
          return img;
        }
      }),
    );
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef().nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
  }

  private draw(index: number): void {
    const bmp = this.bitmaps[index];
    if (!bmp) return;
    this.frameIndex = index;

    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const iw = 'width' in bmp ? bmp.width : 0;
    const ih = 'height' in bmp ? bmp.height : 0;
    if (!iw || !ih) return;

    const scale =
      this.fit() === 'cover'
        ? Math.max(canvas.width / iw, canvas.height / ih)
        : Math.min(canvas.width / iw, canvas.height / ih);
    const dw = iw * scale;
    const dh = ih * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  }
}
