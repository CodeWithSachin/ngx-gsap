import {
  EnvironmentProviders,
  PLATFORM_ID,
  inject,
  provideEnvironmentInitializer,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

/**
 * Registers GSAP plugins exactly once, browser-only (SSR-safe).
 * Add to `appConfig.providers`.
 */
export function provideGsap(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      gsap.registerPlugin(ScrollTrigger, SplitText);
    }
  });
}
