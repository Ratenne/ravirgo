> 이전 단일 통과 구현 기록입니다. 현재 동작은 [loop-showcase.md](loop-showcase.md)를 참조하세요.

# Open-route service showcase

2026-10-14. Current source and `.impeccable/review/open-path/` supersede the previous turntable and closed-orbit interaction records. The original stone architecture, deck, camera and luminous hub at world `(x: 0.2, z: 2.7)` remain fixed. Only the native service groups move.

## Route and timing

Each service follows a complete open route: left-rear cubic Bézier entry, one exact horizontal counterclockwise circle viewed from +Y, then a right-rear exit made from two joined cubic Béziers. Entry and exit share the circle's endpoint and tangent direction; the exit's second cubic continues its first cubic's tangent. Arc-length sampling smooths traversal inside the entry/exit phases. Default circle radius is 2.45, start angle 0.75π and model height 0.065. Phase ratios are entry 0.24, orbit 0.58, exit 0.18.

`modelGapWorld: 8` is orbital arc separation, converted into a normalized local-clock delay: `gap = 8 / (2π × radius) × orbit phase share`. Model i receives `global × (1 + (count − 1) × gap) − i × gap`. It is hidden before local 0 and after local 1. There is no modulo, repeat or elapsed-time orbit clock. Every model independently enters, completes its circle and leaves. Filtering changes visibility without reindexing or resetting these clocks. Reverse scroll retraces positions; stopped scrolling parks them. The 8-unit setting is not a constant Euclidean separation throughout the curved entry and exit.

The active section is 800vh. Its sticky stage starts below the header and fills the remaining viewport (`100svh − header height`, with `100vh` fallback); header heights are 88px desktop and 76px phone. ScrollTrigger maps the header-adjusted start through `bottom bottom` with linear easing and `scrub: true`. Desktop Lenis uses GSAP's ticker and ScrollTrigger update integration; coarse-pointer devices use native scroll. Wheel and touch input are not captured to rotate the set.

## Controls and fallbacks

`showcase-config.ts` exposes section height, fixed hub, radius/start angle, model height/gap, phase ratios, desktop/mobile entry starts, entry/exit controls and tangent lengths, maximum featured count, camera, DPR/Bloom and Lenis settings. `showcase-path.ts` owns curves and local timing. Development `/?pathDebug=1` shows line guides; they are off by default. `debugPath` is also an explicit configuration switch.

`3D 끄기` saves progress, disposes the scene and collapses the long runway to a static poster while keeping discovery and the HTML catalogue. Re-enabling restores saved progress. The off preference survives within the browser session; progress itself is held in memory. Initial reduced-motion, data-saving and disabled states bypass the 3D import. WebGL initialization failure retains a compact static surface and real service links. Motion/data-saving controls are disabled while their respective preference applies.

The list shortcut and skip link use native `#services` anchors. Lenis has `anchors: false`; there is no custom click handler for those links. Browser hash/history and the CSS header-aware scroll margin position the catalogue below the sticky header. Search submission separately applies search and scrolls to results.

## Models and rendering

`workbench.ts` authors PricePulse's five bars and receipt OCR's paper stack with two curled sheets. Replace its sculpture meshes to change models; no GLB loader or model URL integration exists in the current implementation. Scene input/rendering/lifecycle remain in `orbital.ts`; HTML loading/toggle/search are in `directory.ts`; `index.astro` and `home.css` define the stage and catalogue.

Native billboard Sprite labels use depth testing, stable screen size and horizontal margins and appear during the orbit phase. Guarded raycasting opens the existing URLs: `https://price-pulse.ravirgo.com` and `https://reciept-to-excel.ravirgo.com/`. Dragging, scrolling and long presses are excluded. The HTML links remain the accessible entry point.

Selective Bloom includes the fixed central emitter only, followed by OutputPass and FXAA. Mobile uses DPR 1 and quarter-resolution, lower-strength Bloom; desktop uses at most DPR 1.5 and half-resolution Bloom. Source includes scene cleanup and environment/composer recreation on context restoration; the current QA suite does not test context loss/restoration.

## Run and evidence

Run `npm install`, then `npm run dev`. In a second terminal, `npm test` runs `node qa-open-showcase.mjs` against port 4321 using installed macOS Google Chrome. `npm run build` produces static `dist/`; `npm run preview` serves the build.

The inspected current `open-path/results.json` records Chrome desktop and mobile-emulation passes for:

- Exact route joins, aligned tangents, near-uniform segment samples and nonoverlapping moving podiums; measured minimum separation about 4.89 world units.
- Counterclockwise one-circle traversal, independent full routes, no repeat, reverse retracing, parking, fixed set and filtering without clock changes.
- Desktop service link/drag guard, mobile service-label tap and no horizontal mobile overflow.
- Collapse/resume, native list-anchor hash/history/position, reduced-motion no-3D import, WebGL fallback and links without JavaScript. Recorded page errors are empty.

Captures in `.impeccable/review/open-path/` cover desktop start, approach, six circle positions, orbit completion, exit, finished and disabled states plus `mobile-orbit.png`; `reference.png` is the comparison reference. Context recovery, physical phone/Safari behavior, GPU/memory/thermal performance and exact reference pixel parity have not been verified. A separate focused Chrome mobile-emulation check also passed off/collapse, re-enable rendering and live reduced-motion canvas disposal/collapse.

