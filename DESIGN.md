---
name: RAVIRGO
description: Navy architecture, brass instruments, and a readable service catalogue.
colors:
  navy: "#08121e"
  surface: "#0c1927"
  surface-raised: "#152433"
  ink: "#f0f2f3"
  secondary: "#b4c0ca"
  gold: "#dfbd80"
  gold-ink: "#121c27"
  line: "#263541"
  control-bg: "#0b1825"
  filter-selected: "#17222e"
  filter-hover: "#24313b"
  footer: "#06101b"
  about-gold: "#d9b784"
  about-muted: "#929ca7"
  about-ink: "#f1f1ec"
  stone: "#142d46"
  edge-stone: "#0e2035"
  brass: "#d8b373"
  aged-brass: "#93723f"
  paper: "#e8dfcc"
typography:
  display:
    fontFamily: "Manrope Variable, Noto Sans KR Variable, sans-serif"
    fontSize: "clamp(34px,5vw,64px)"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-.03em"
  title:
    fontFamily: "Manrope Variable, Noto Sans KR Variable, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-.025em"
  body:
    fontFamily: "Manrope Variable, Noto Sans KR Variable, sans-serif"
    fontSize: "16px"
    lineHeight: 1.6
  label:
    fontFamily: "Manrope Variable, Noto Sans KR Variable, sans-serif"
    fontSize: "14px"
  brand:
    fontFamily: "Manrope Variable, Noto Sans KR Variable, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    letterSpacing: ".19em"
  about-display:
    fontFamily: "Manrope, Noto Sans KR, sans-serif"
    fontSize: "clamp(44px,6.4vw,106px)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: ".19em"
rounded:
  radius: "12px"
  control: "8px"
  pill: "100px"
  circle: "50%"
  mobile-image: "9px"
spacing:
  gutter: "clamp(22px,4vw,64px)"
  mobile-gutter: "22px"
  filter-gap: "9px"
  row-gap: "32px"
  row-padding: "22px 0"
  launch-padding: "12px 22px"
components:
  launch-link:
    textColor: "{colors.gold}"
    typography: "{typography.label}"
    rounded: "{rounded.radius}"
    padding: "{spacing.launch-padding}"
  launch-link-hover:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.gold-ink}"
  category-filter:
    backgroundColor: "{colors.control-bg}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
  category-filter-selected:
    backgroundColor: "{colors.filter-selected}"
    textColor: "{colors.gold}"
  search-field:
    backgroundColor: "{colors.control-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px 0 20px"
  scene-control:
    backgroundColor: "#0a1624e8"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 13px"
  service-row:
    padding: "{spacing.row-padding}"
  empty-state:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.radius}"
    padding: "40px 24px"
---

# Design System: RAVIRGO

## Overview

**Creative North Star: "The Orbital Workbench"**

The Orbital Workbench gives RAVIRGO a material identity: navy stone architecture, continuous brass connections, and legible instruments representing real services. Warm metal and cream paper punctuate the dark environment; clear Korean and Latin typography carries the practical interface.

The interface is calm and usable. Flat HTML controls and factual service information sit alongside spatial imagery. The supplied white RV symbol with its gold constellation anchors the identity. The introduction route preserves the existing Virgo narrative and corrected Spica position as its own cinematic expression.

**Key Characteristics:**
- Navy surfaces with restrained dawn-gold actions.
- Real spatial materials paired with flat, readable controls.
- Supplied white-and-gold RV identity and Manrope / Noto Sans KR typography.
- Responsive catalogue and keyboard-visible states.

This is a scan of the implemented system, grounded in `src/styles/home.css`, `src/styles/global.css`, `src/components/Brand.astro`, `src/pages/index.astro`, `src/scripts/orbital.ts`, `PRODUCT.md`, and `docs/home-brief.md`. The selected references are `.impeccable/mocks/3d/orbital-v2.png` and `atelier-v2.png`, combined intentionally. Review captures exist in `.impeccable/review/`; this document records the system and does not assert a passed pixel-comparison gate. The frontmatter owns token values; the sidecar owns extensions and live component previews. Its eight-step OKLCH tonal ramps are synthesized for panel visualization; they are not additional implemented runtime colors.

## Colors

The primary accent is warm dawn gold against cool navy neutrals, with related brass and cream materials in the spatial scene.

### Primary

- **Dawn Gold** (`gold`): launch outlines, active navigation, selected filters, focus outlines, and text selection.
- **Introduction Gold** (`about-gold`): the incumbent introduction route's separate gold tone; retain its scope rather than silently normalizing it to the directory accent.

### Neutral

- **Night Navy** (`navy`): the main document background and header; the introduction uses the same base color through its local `--bg` property.
- **Workbench Navy** (`surface`) and **Raised Navy** (`surface-raised`): the scene fallback, empty state, thumbnail beds, and search-action hover.
- **Cloud White** (`ink`) and **Cool Mist** (`secondary`): readable primary and secondary text.
- **Night Ink** (`gold-ink`): text over the filled gold launch state.
- **Slate Divider** (`line`): quiet separation between catalogue rows.
- **Control Navy** (`control-bg`), **Selected Navy** (`filter-selected`), and **Hover Slate** (`filter-hover`): visible control states without translucent glass panels.
- **Footer Navy** (`footer`): a subtly darker closing band.
- **Introduction Mist** (`about-muted`) and **Introduction White** (`about-ink`): preserve the existing introduction typography palette.
- **Mineral Stone** (`stone`), **Edge Stone** (`edge-stone`), **Polished Brass** (`brass`), **Aged Brass** (`aged-brass`), and **Receipt Cream** (`paper`): scene materials, not interchangeable CSS action colors. Lighting and tone mapping affect their rendered appearance.

**The Material Scope Rule.** Preserve the distinction between interface gold and physically lit brass; a material's base color is not its final rendered swatch.

## Typography

**Display Font:** Manrope with Noto Sans KR and sans-serif fallbacks.
**Body Font:** the same pairing, using locally bundled variable fonts on the directory and service detail routes.

The introduction retains its existing Google Fonts import. No distinct monospace font is implemented. Tabular numerals support service counts and scene progress.

### Hierarchy

- **Display:** the frontmatter display role belongs to service-detail headings; the main directory uses a visually hidden page heading and has no promotional display headline.
- **Title:** service names use the title role. At the tablet breakpoint they become (22px), and on phones (21px).
- **Body:** service descriptions use the body role. Tablet descriptions become (14px); phone descriptions return to the body size for readability.
- **Label:** navigation, filters, and launch actions use compact labels; category labels, domains, counts, and secondary links use (13px).
- **Brand:** the header wordmark uses the brand role; phone type becomes (16px) with (.15em) tracking. The supplied logo remains an image beside the wordmark.
- **Introduction display:** the separate about-display role preserves the widely tracked RAVIRGO reveal. The introductory Korean heading uses weight (300), line height (1.37), negative tracking (-.055em), and `clamp(44px,5.1vw,83px)`.

## Layout

The main header is (88px) high, becoming (76px) at the phone breakpoint. The fluid gutter is normative in the frontmatter and becomes the fixed mobile gutter below (600px).

The main surface's approved composition is a full-width workbench with search and wrapping category filters at upper left, scene controls at lower right, and the complete HTML catalogue immediately below. This composition is specific to the directory; it is not a requirement for every future page. The scene height is `clamp(480px,40vw,610px)`, (500px) below (900px), and (440px) below (600px). Search width is `clamp(290px,30vw,450px)`, then (350px) at tablet width, then the viewport width minus (44px) on phones.

Desktop catalogue rows have columns (220px), flexible content, and an automatic action column. At tablet width the thumbnail column becomes (160px) and gaps become (20px). At phone width the grid becomes (82px) plus flexible content, with (14px) gaps; actions occupy the second column, then both columns below (360px). Full rows continue vertically as services grow. A service title and its muted category share a wrapping baseline.

The introduction retains its own sticky, viewport-sized sky stage and scroll narrative. Its principal responsive breakpoint is (760px), with an additional wide-screen adjustment at (1800px). Keep this route's dramatic spatial pacing separate from the catalogue's practical density.

## Elevation & Depth

The directory UI uses tonal layering and thin borders, with no CSS box-shadow on its controls or rows. Depth belongs to the actual Three.js workbench: stepped round plinths, supported architecture, real ribbon thickness, metallic reflections, local warm light, and a cream folded receipt. The poster is a fallback and thumbnail source, not a replacement for runtime geometry. The introduction uses sky layers, masks, light beams, and restrained glow; its stylized receipt has ambient shadows.

**The Flat Controls Rule.** Keep discovery and catalogue controls visually flat; spatial depth belongs to the exhibited instruments and cinematic environment.

The scene renders on demand during view changes, rather than continuously rotating. Its controls provide left, right, reset, and 3D on/off actions. Reduced motion removes CSS transitions and rotation interpolation. Data saving, unavailable WebGL, and context loss preserve the poster and HTML directory. These are implemented behaviors, not performance certifications.

## Shapes

Controls use two related silhouettes: pill-shaped search and category buttons, and gently rounded rectangular launch actions, scene controls, thumbnails, and empty states. The frontmatter owns their radius values. Catalogue rows themselves are flat and unboxed with bottom dividers; avoid turning each row into a nested card. The scene's circles, rings, plinths, and continuous curved ribbons are its recurring spatial forms.

## Components

### Buttons

Launch links are outlined gold rectangles with generous horizontal space. Their default minimum height is (50px) and minimum width (228px); on phones the height becomes (44px) and the width becomes flexible. Hover fills with gold and switches the text to night ink; active compresses to scale (.98). Focus uses a gold outline (2px) with (5px) offset.

The empty-state reset is the existing filled action: gold background, navy text, (8px) corners, and padding (12px 20px). Scene controls are compact dark rectangles, with minimum dimensions (44px) on desktop and (40px) on phones. Disabled controls use opacity (.45).

### Chips

Category filters are pill buttons with (1px) muted borders. Selected state uses a gold border and gold text on selected navy; hover uses the hover surface, and active scales to (.97). `aria-pressed` identifies selection. Filters wrap rather than overflowing horizontally.

### Cards / Containers

The catalogue component is a semantic article row containing thumbnail, title, category, description, domain, launch link, and detail link. It uses a divider rather than an elevated card shell. Thumbnails crop the fallback workbench image; hover scales the image to (1.035) over (.7s). The empty-state container uses the surface background, rounded corners, and centered copy.

### Inputs / Fields

Search is an opaque navy pill with a muted border, a leading search icon, and a circular arrow submit action. Its minimum height is (58px), becoming (52px) on phones; input text remains (16px). Focus within changes the wrapper border to gold. The input deliberately suppresses its own outline, so preserve that wrapper treatment and the explicit accessible label. Search and filter controls are revealed by the directory script; the complete catalogue is present before JavaScript runs.

### Navigation

Header and footer use the supplied RV asset, a tracked plain RAVIRGO wordmark, and functional links. Active header navigation is gold; hover links become gold. Main header links have a (44px) minimum height. The footer wraps on phones. The introduction route shares the supplied logo asset while retaining its own header spacing and type scale.

### Orbital workbench

Only featured services with an exhibit are represented, capped at four in both service-data selection and scene mounting. The full catalogue has no corresponding four-service limit. Price bars and a compact dual-fan graphics card represent PricePulse; a curved cream document represents receipt OCR. Selection lights the matching plinth; filtering hides unmatched featured exhibits and ribbons. The scene is hidden from the accessibility tree and never replaces real service links. Wheel input over the canvas and horizontal dragging rotate the workbench, exhibits, ribbons and central fixture together through unrestricted 360° turns. Camera, building and access steps remain fixed. Controls and discovery retain page scrolling; the service-list shortcut provides a direct exit. Vertical touch scrolling and Ctrl+wheel zoom remain native.

## Do's and Don'ts

### Do:

- **Do** preserve the supplied RV symbol and the established navy, gold, and cream material relationship.
- **Do** use factual service descriptions, readable destinations, and semantic launch links.
- **Do** keep the entire catalogue usable independently of WebGL.
- **Do** preserve the corrected constellation and Spica placement on the introduction route.
- **Do** respect reduced-motion and data-saving preferences.

### Don't:

- **Don't** replace the supplied logo with a text glyph or newly invented symbol.
- **Don't** add generic promotional headlines, slogans, or footer promises to the main directory.
- **Don't** treat the two current services as a permanent capacity limit.
- **Don't** make the 3D scene the only path to a service.
- **Don't** claim image parity or performance results without measured review evidence.
