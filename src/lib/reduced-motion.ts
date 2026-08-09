/**
 * SSR-safe prefers-reduced-motion check (plan §8).
 * When true: Lenis stays off (native scroll), scrub timelines jump to their
 * final state, marquees freeze, counters print final values, and frame
 * sequences draw their last frame.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
