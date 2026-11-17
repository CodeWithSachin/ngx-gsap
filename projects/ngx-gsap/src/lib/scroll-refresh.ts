import { ScrollTrigger } from 'gsap/ScrollTrigger';

let timer: ReturnType<typeof setTimeout> | undefined;
let observer: ResizeObserver | undefined;
let lastHeight = -1;
let refreshing = false;

/** Coalesce bursts of layout change into one refresh. */
function debouncedRefresh(): void {
  clearTimeout(timer);
  timer = setTimeout(() => ScrollTrigger.refresh(), 120);
}

/**
 * Keep every ScrollTrigger measured against the *current* layout.
 *
 * ScrollTrigger resolves `start`/`end` into pixel positions the moment a trigger
 * is created. Everything in this package sets up inside `afterNextRender`, and
 * plenty of things move the page afterwards:
 *
 * - `ngxMarquee` clones its track until the row is twice the host width.
 * - `ngxSplitReveal` hands the element to SplitText, which rewraps every line.
 * - Web fonts swap in and reflow every paragraph above the trigger.
 * - Images without reserved space finish decoding.
 *
 * A trigger measured before all that is quietly wrong for the rest of the
 * session — scrubbed timelines run early, counters fire off-screen — and nothing
 * points at the cause. Measured on the docs page: a scrub configured
 * `top 90%` → `top 15%` had its start cached 156px above where the element
 * actually sat, so it was already 43% complete at the moment it should have
 * been 0%.
 *
 * Directives call this after their own setup. It debounces, arms a font-swap
 * refresh, and watches the document height so late arrivals are caught too.
 */
export function scheduleScrollRefresh(): void {
  if (typeof window === 'undefined') return;

  debouncedRefresh();

  if (observer || typeof ResizeObserver === 'undefined') return;

  // Optional-chained: jsdom and older browsers have no FontFaceSet, and a
  // missing refresh is a nuisance, not a crash.
  void document.fonts?.ready.then(debouncedRefresh);

  // `refresh()` resizes pin-spacers, which resizes the document, which would
  // wake the observer below and refresh again — forever. These two listeners are
  // the loop guard: ignore height changes while a refresh is in flight, and
  // stamp the height it settled on so its own echo is not treated as news.
  ScrollTrigger.addEventListener('refreshInit', () => (refreshing = true));
  ScrollTrigger.addEventListener('refresh', () => {
    refreshing = false;
    lastHeight = document.documentElement.scrollHeight;
  });

  // A height change is the signal that something above a trigger re-laid-out.
  observer = new ResizeObserver(() => {
    const height = document.documentElement.scrollHeight;
    if (refreshing || height === lastHeight) return;
    lastHeight = height;
    debouncedRefresh();
  });
  observer.observe(document.body);
}
