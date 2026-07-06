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

/**
 * Scroll-scrubbed canvas frame sequence (the Navarasa tiger / Drishti eyes).
 *
 * - Lazily preloads frames when the section approaches (~2 viewports away)
 * - Draws ImageBitmaps at devicePixelRatio (capped at 2)
 * - `pinLength` = how many viewport-heights of scroll the pin consumes
 *
 * Place inside a full-viewport sticky/pinned host section.
 */
@Component({
  selector: 'ngx-frame-sequence',
  template: `<canvas #cv style="display:block;width:100%;height:100%"></canvas>`,
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

  /** 0–1 sequence progress (drive overlay text swaps off this). */
  readonly progress = signal(0);

  private bitmaps: (ImageBitmap | HTMLImageElement)[] = [];
  private frameIndex = 0;

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const el = this.host.nativeElement;
      const triggers: ScrollTrigger[] = [];

      // Lazy preload ~2 viewports before arrival.
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top 200%',
          once: true,
          onEnter: () => void this.preload().then(() => this.draw(this.frameIndex)),
        }),
      );

      const state = { frame: 0 };
      const count = () => this.frames().length;

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
