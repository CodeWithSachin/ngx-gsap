# ngx-gsap

Angular directives for GSAP + Lenis — scrub timelines, split-text reveals, marquees, counters and canvas frame sequences. Published as
[`@code_with_sachin/ngx-gsap`](https://www.npmjs.com/package/@code_with_sachin/ngx-gsap).

**Usage docs:** [projects/ngx-gsap/README.md](projects/ngx-gsap/README.md) ·
**Live demo:** https://sachinsingh.me/packages/gsap ·
**Changes:** [CHANGELOG](projects/ngx-gsap/CHANGELOG.md)

```bash
npm i @code_with_sachin/ngx-gsap
```

## Development

This is an Angular workspace with one library project.

```bash
npm ci
npm test          # Vitest + jsdom
npm run build     # ng-packagr → dist/ngx-gsap
npm run pack      # build, then a tarball to try in another app
```

## Releasing

1. Bump `version` in `projects/ngx-gsap/package.json` and add a CHANGELOG entry.
2. `npm run release` — builds, runs the tests, and publishes `dist/ngx-gsap`.
   npm asks for a two-factor confirmation in the browser.
3. Tag the commit: `git tag v<version> && git push --tags`.

## Licence

MIT © [Sachin Singh](https://sachinsingh.me)
