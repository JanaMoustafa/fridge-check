# Fridge Check — design system

Direction: **"cold shelf, warm food."** The interface is the inside of a clean fridge — cool porcelain-mint canvas,
white enamel surfaces — so the food photography is the only warm thing on screen. Each screen has one bold element
(the fridge-door input on Find, the hero photo on Detail, the receipt on Shopping list); everything else stays quiet.
Sentence case everywhere, no all-caps eyebrows, no arrows appended to button labels.

Skills consulted: frontend-design, ui-ux-pro-max, design-system, ui-styling, react-best-practices, web-design-guidelines.
(ui-ux-pro-max's cream/terracotta claymorphism suggestion was rejected: generic, and its fonts have no Arabic glyphs.)

## Tokens

Three layers: primitives (named after ingredients) → semantic tokens (below) → component aliases
(`--chip-bg`, `--meter-have`, `--meter-missing`). Components never use raw hex.
All text pairs ≥ 4.5:1 and UI boundaries/focus rings ≥ 3:1 (80 pairs computed with the WCAG formula, 0 failures).

| Token              | Light                | Dark      | Use                                                      |
| ------------------ | -------------------- | --------- | -------------------------------------------------------- |
| `bg`               | `#EDF2EF` porcelain  | `#121916` | page canvas, `theme-color`                               |
| `surface`          | `#FFFFFF` enamel     | `#1A231F` | cards, input panel, receipt                              |
| `surface-2`        | `#E1E9E4`            | `#24302B` | magnet chips, skeletons, wells                           |
| `text`             | `#14211B` herb-black | `#E9F0EC` | body                                                     |
| `text-muted`       | `#4E5D56`            | `#A3B1AA` | secondary — solid hex, never opacity                     |
| `primary`          | `#5A2D82` aubergine  | `#CFB2EC` | buttons, links, selected toggles, focus ring             |
| `primary-contrast` | `#FFFFFF`            | `#26113A` | label on primary                                         |
| `primary-soft`     | `#ECE3F4`            | `#33264A` | selected toggle background, active nav pill              |
| `accent`           | `#B8124F` hibiscus   | `#FF8DB3` | saved heart, saved count                                 |
| `accent-contrast`  | `#FFFFFF`            | `#3D0A1C` | label on accent                                          |
| `have`             | `#1B6B3A` parsley    | `#7DD89C` | "You have", filled meter segments (+ check icon + words) |
| `have-soft`        | `#DDF0E3`            | `#173A26` | have-chip tint                                           |
| `missing`          | `#8A4B00` saffron    | `#F4BE6A` | "You need", dashed hollow segments (+ plus icon + words) |
| `missing-soft`     | `#FCEBD2`            | `#3D2C12` | missing tint                                             |
| `danger`           | `#B3261E` chili      | `#FF968C` | destructive only                                         |
| `danger-contrast`  | `#FFFFFF`            | `#410E0A` | label on danger                                          |
| `ring`             | `#5A2D82`            | `#CFB2EC` | 2 px focus outline, 2 px offset                          |
| `border`           | `#D3DDD7`            | `#2E3B35` | decorative hairlines only                                |
| `border-strong`    | `#6E7E76`            | `#728379` | boundaries of inputs/toggles (≥ 3:1)                     |

Theme switching: `:root` = light; `@media (prefers-color-scheme: dark) { :root:not([data-theme=light]) {…dark} }`;
`:root[data-theme=dark] {…dark}`. `color-scheme` follows the theme.

Radii signal role: chips 12 px "fridge magnet" tiles with a 2 px inset bottom lip, cards 20 px, buttons 12 px,
full pills only for segmented toggles (EN | AR, sort). No grey drop shadows: depth = surface tint + 1 px enamel highlight.

## Type

- Latin: **Bricolage Grotesque** (variable wght; 400 body, 600 labels/buttons, 800 display). Preloaded.
- Arabic: **Fustat** (variable wght 200–800, Egyptian-designed; display weight 700). `preload: false`.
- Stack is ordered per language with `:lang()` — the next/font fallback (Arial) covers Arabic, so a single shared stack
  would render Arabic in Arial.
- Scale 1.25 (12/14/16/20/25/31/39 px); h1 `clamp(2rem, 1.25rem + 3.2vw, 3.25rem)`. Arabic: `--script-scale: 1.125`,
  body line-height 1.75, headings 1.35, **letter-spacing 0** (tracking breaks letter joins). English headings −0.02em.
- `tabular-nums` for counts and times; `text-wrap: balance` on headings; instructions max 68ch.

## Motion

Tokens: `--dur-press 90ms`, `--dur-exit 140ms`, `--dur-enter 220ms`, `--dur-move 400ms`;
`--ease-out cubic-bezier(.2,.8,.2,1)`, `--ease-in cubic-bezier(.4,0,1,1)`, `--ease-move cubic-bezier(.65,0,.35,1)`;
springs as `linear()` curves: `--spring-snappy` (2.4 % overshoot, 370 ms), `--spring-pop` (23.7 %, 560 ms),
`--spring-soft` (no overshoot, 480 ms).

Rules: animate transform/opacity only (+ colors for state); never `transition: all`; state is set first, animation
only decorates it; every horizontal offset is `calc(var(--dir) * Npx)` with `--dir: 1 | -1`; transform-origin uses
`var(--origin-start)`; `::view-transition { pointer-events: none }`.

| Moment                   | Technique                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Chip add — "magnet snap" | `@starting-style` drop −6 px + scale .92 → spring-snappy; paste cascades 30 ms (cap 10)            |
| Chip remove              | `<ViewTransition exit="chip-out" update="chip-move">`, 4° tilt toward inline-end, 140 ms           |
| Results re-rank          | first 24 cards named; `update="card-move"` spring-soft; enter rise 8 px after 140 ms               |
| Pantry meter fill        | segment hollow-dashed saffron → solid parsley, scaleX .4→1, 30 ms inline stagger                   |
| Heart save               | spring-pop + 6 hibiscus particles (360 ms); unsave = 140 ms fade                                   |
| List → detail            | shared-element photo morph (400 ms, 3 px mid-flight blur) + 60 px × `--dir` slide; header anchored |
| Tab indicator            | `view-transition-name: tab-indicator` morphs between tabs (280 ms)                                 |
| Count badges             | `key={count}` remount → spring-pop 1→1.2→1                                                         |
| Skeleton shimmer         | sweeps in reading direction; skeletons only after 150 ms                                           |
| Language switch          | root crossfade only (no slide — the layout itself mirrors)                                         |
| Theme switch             | instant                                                                                            |

`prefers-reduced-motion: reduce`: no translate/scale/rotate, particles, staggers or shimmer; view-transition
durations 0 except a ≤ 120 ms opacity crossfade; every transform utility sits behind `motion-safe:`.

## RTL rules

- Logical utilities only: `ms/me/ps/pe/inset-s/inset-e/text-start/text-end/rounded-s/rounded-e/border-s/border-e`.
  `scripts/check-logical-css.ts` fails CI on physical classes. `rtl:`/`ltr:` variants only for transforms,
  gradients and icon mirroring.
- Mirror: arrows, chevrons, undo/redo, external-link, list/text-direction icons (`rtl:-scale-x-100` on a wrapper).
  Never mirror: heart, check, x, plus, minus, search, clock, printer, copy, share, settings, sun/moon.
- Radix: app wrapped in `<Direction.Provider dir>`; toast swipe direction flips in RTL.
- English recipe content inside Arabic UI: `lang="en" dir="ltr"` (or `<bdi>`); user-typed text `dir="auto"`;
  interpolated values in translated strings wrapped in `<bdi>`.
- Numerals: Western digits (`numberingSystem: 'latn'`) in both locales.

## Layout

Mobile-first; verified at 320, 375, 768, 1024, 1280, 1440, 1536.

| Width  | Layout                                                                                      |
| ------ | ------------------------------------------------------------------------------------------- |
| < 640  | 1 column; header = wordmark + EN \| AR + settings; fixed bottom tab bar (64 px + safe area) |
| ≥ 640  | 2 columns                                                                                   |
| ≥ 768  | header nav replaces the bottom bar (`<nav>` links, `aria-current="page"`)                   |
| ≥ 1024 | 3 columns; detail = hero + steps at inline-start, sticky have/need panel at inline-end      |
| ≥ 1280 | sticky 320 px pantry rail at inline-start (input, quick add, filters, staples) + 3 columns  |
| ≥ 1536 | 4 columns; content max 1440 px                                                              |

Touch targets ≥ 44 × 44 px (chip remove looks 28 px, hit area 44 px via `::before`); `min-h-dvh`, never `100vh`;
no horizontal scroll at 320 px or 200 % zoom.

## Components

Radix (`radix-ui`): Direction, ToggleGroup (EN | AR, sort, saved sort, list mode; diet filters as `multiple`),
RadioGroup (theme, units), Switch (staples), Dialog (settings: bottom sheet < md, inline-end panel ≥ md),
AlertDialog, Toast, Tooltip, Collapsible, DropdownMenu, VisuallyHidden, Slot.
Not used: Tabs (navigation is routes), Popover/Select, Checkbox (native), Progress (pantry meter is custom).

Custom: IngredientCombobox (WAI-ARIA APG combobox), Chip/ChipList, QuickAddRow, PantryRail, RecipeCard (@container),
PantryMeter, HeartButton, ResultsGrid, SkeletonCard, state blocks, RecipeHero, HaveNeedPanel, StepsList, AllergyNote,
ShareButton, ReceiptList, HeaderNav, BottomTabBar, CountBadge, LanguageToggle, SkipLink, LiveRegion, Icon.
