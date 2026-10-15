# Orbital-v2 fidelity correction

2026-10-14. Scope: an ordinary correction within the approved orbital-v2 visual world and atelier catalogue composition. The supplied RV identity, navy/brass/cream relationship, factual service copy and semantic HTML catalogue remain the contract. This record supplements the incumbent design files; it does not approve a new system.

## Runtime construction

`src/scripts/workbench.ts` owns the scene construction; `src/scripts/orbital.ts` owns view input, demand-driven rendering, filtering, context recovery and disposal.

- Architecture: a substantial round stone drum and inset deck, broad perimeter walkway, radial panel joints, fixed four-step access with thick cheeks, low segmented rear parapet, one monumental rectangular pier and a partial overhead lintel. Concealed warm strip lighting and grazing area lights articulate the perimeter.
- PricePulse: exactly five ascending rectangular bars, progressing from dark silver through silver to brass, on a layered circular plinth. The former graphics-card prop is absent.
- Receipt OCR: nine slightly offset sheets below two separately curved, double-sided cream paper surfaces. Edge tubes and modeled print strokes supply thickness cues and receipt detail.
- Connections: swept bevelled rectangular brass bands link both service plinths to the layered luminous central fixture. These are thick geometry rather than painted paths.
- Motion: the camera and building, outer walkway and access steps stay fixed. Only the inset deck, exhibits, ribbons and central fixture rotate together. Canvas wheel and horizontal drag allow unrestricted turns; search, controls and catalogue retain page scrolling.

Stone uses seeded multiscale 512px procedural albedo, roughness and bump maps with mineral variation, veins and fine pores. Brass uses a procedural brushed roughness/bump map with physical metalness, anisotropy and environment reflections. Paper reuses a subtle height map. These are material inputs, not measured scans or a GPU-performance claim.

The generated distant landscape is `public/assets/orbital-dusk.webp`: layered mountain ridges and a narrow lake beneath a navy-to-amber dusk sky. It supplies the scene background only; the architecture, paper, bars and ribbons remain live WebGL geometry. Image-generation records are kept locally and excluded from the repository. The separate orbital poster remains the fallback; the incumbent `sky.webp` serves the introduction route.

## Evidence and limits

The documentation pass inspected PRODUCT.md, docs/home-brief.md, DESIGN.md, .impeccable/design.json, both scene modules, the QA scripts and all six current `.impeccable/review/fidelity-*.png` captures: default, quarter, half, three-quarter, 768 and 390. The captures show the fixed architecture across rotating exhibits and the responsive discovery/catalogue composition.

Reported execution results supplied by the implementation handoff:

| Check | Result and scope |
| --- | --- |
| `qa-fidelity.mjs` | Pass: default/90°/180°/270° visual captures, 768px/390px without horizontal document overflow, no JavaScript page errors. |
| `qa-wheel.mjs` | Pass: rotation beyond 360°, reverse, reset, service-list escape, scrolling with 3D disabled, no JavaScript page errors. |
| `qa-home.mjs` | Pass: WebGL, search/category filtering, empty-state recovery, view/3D controls, context loss/restoration, desktop/tablet/mobile layout, HTML links without JavaScript, reduced-motion page availability, introduction constellation count and static route responses. |

The documenter inspected evidence and test coverage; it did not rerun those scripts. Headless Chrome with SwiftShader does not establish physical phone/Safari GPU, memory or thermal behavior. These checks do not establish exact pixel parity with the approved comp. Review disposition remains **ship (scoped scene correction verdict)** until the parent records the independent reviewer result.

## Incumbent-system boundary

DESIGN.md and .impeccable/design.json are preserved. The inherited DESIGN.md still describes a dual-fan graphics-card prop and records earlier scene material colors; the implemented correction uses five bars and adjusted physical material values. The pre-existing sidecar drift reported in context is also left intact. Repairing or regenerating those system files is outside this correction's authorization. This scoped record and README describe the current runtime without silently rewriting the incumbent system.
