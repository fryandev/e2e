---
"e2e": patch
"@e2e-dev/core": patch
"@e2e-dev/web": patch
"@e2e-dev/mobile": patch
---

Add `expect(locator).toBeInViewport({ ratio })`, which waits for part of the
match, or that share of its box, to be inside the viewport without scrolling.
No match counts as outside, so `.not` passes once nothing matches. The web
engine measures with the page's `IntersectionObserver`, the check Playwright
makes, so scrolling and `overflow` ancestors and frames clip the box. The mobile engine
reports only whether the node is on screen, since a device reports bounds
already clipped, so `ratio` there fails with `UNSUPPORTED_CAPABILITY`.
Engines implement the optional `viewportIntersection` method for the new
`viewport-intersection` capability. `@e2e-dev/web` and `@e2e-dev/mobile` now
need `@e2e-dev/core` 0.24.1 or later.
