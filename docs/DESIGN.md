# BiteDoneRight — design system

Direction: **"cold shelf, warm food."** The interface is the inside of a clean fridge — cool porcelain-mint canvas,
white enamel surfaces — so the food photography is the only warm thing on screen. Each screen has one bold element
(the fridge-door input on Find, the hero photo on Detail, the receipt on Shopping list); everything else stays quiet.
Sentence case everywhere, no all-caps eyebrows, no arrows appended to button labels.

Skills consulted: frontend-design, ui-ux-pro-max, design-system, ui-styling, react-best-practices, web-design-guidelines.
(ui-ux-pro-max's cream/terracotta claymorphism suggestion was rejected: generic, and its fonts have no Arabic glyphs.)

## Tokens

BiteDoneRight palette (owner, 2026-10-30): **Olive** `#6B705C`, **Sage Grey** `#A5A58D`, **Terracotta** `#CB997E`,
**Peach Cream** `#FFE8D6`, **Navy** `#3D405B`. Steps are derived from these five; every text pair ≥ 4.5:1 and every
boundary ≥ 3:1 (computed in the palette script; see the comment in `src/app/globals.css`).

| Token            | Light     | Dark      | Use                                              |
| ---------------- | --------- | --------- | ------------------------------------------------ |
| `bg`             | `#FFE8D6` | `#2A2C3F` | page canvas (Peach Cream), `theme-color`         |
| `surface`        | `#FFF6EE` | `#3D405B` | cards (a lighter cream; Navy in the dark)        |
| `surface-2`      | `#E2E1D0` | `#4A4D68` | wells, chips, tiles (a sage tint)                |
| `fg`             | `#3D405B` | `#FFE8D6` | body text (Navy)                                 |
| `fg-muted`       | `#5C5F6B` | `#D6CFC3` | secondary text                                   |
| `heading`        | `#555A48` | `#CDCFB6` | h1–h3 (Olive, a step darker for text)            |
| `primary`        | `#5E634F` | `#C8C8B0` | buttons, links, the selected tab (Olive)         |
| `primary-soft`   | `#E7E6D9` | `#464A60` | selected backgrounds, nav pill                   |
| `accent`         | `#8A4E33` | `#E3B89C` | BurnToReturn, chips with text (Terracotta, dark) |
| `highlight-soft` | `#F2D4BE` | `#5B4A42` | highlights and progress fills                    |
| `sage`           | `#A5A58D` | `#6E6F5E` | decorative Sage Grey (meters, bars)              |
| `have`           | `#555A48` | `#C8CCAC` | success, "You have"                              |
| `missing`        | `#8A4E33` | `#E8BFA4` | "You need"                                       |
| `danger`         | `#A4403A` | `#FF9C8C` | destructive only                                 |
| `line`           | `#D9CFC0` | `#4A4D68` | hairlines                                        |
| `line-strong`    | `#7A7D8C` | `#A0A3B3` | input and toggle boundaries (≥ 3:1)              |

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
| Chip remove              | instant — no view transition (see note below)                                                      |
| Results                  | cards rise in with a 40 ms stagger (CSS); re-ranking is instant (see note below)                   |
| Pantry meter fill        | segment hollow-dashed saffron → solid parsley, scaleX .4→1, 30 ms inline stagger                   |
| Heart save               | spring-pop + 6 hibiscus particles (360 ms); unsave = 140 ms fade                                   |
| List → detail            | shared-element photo morph (400 ms, 3 px mid-flight blur) + 60 px × `--dir` slide; header anchored |
| Tab indicator            | `view-transition-name: tab-indicator` morphs between tabs (280 ms)                                 |
| Count badges             | `key={count}` remount → spring-pop 1→1.2→1                                                         |
| Skeleton shimmer         | sweeps in reading direction; skeletons only after 150 ms                                           |
| Language switch          | root crossfade only (no slide — the layout itself mirrors)                                         |
| Theme switch             | instant                                                                                            |

**No view transitions for in-page updates.** React starts a document view transition for any
transition that touches a `<ViewTransition>`; keystrokes typed while one is in flight can be lost
(reproduced with fast typing after adding a chip). View transitions are therefore used only for
navigation (page slides, the photo morph, the tab indicator, the language crossfade); chips and
result cards animate with plain CSS that never blocks input.

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
