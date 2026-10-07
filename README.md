# Fridge Check

Find recipes from the ingredients you already have. Fridge Check ranks recipes by how well they match
your fridge, shows exactly which of your ingredients each recipe uses and what is missing, and turns the
gaps into a shopping list. Fully bilingual: English and Arabic (right-to-left).

> Status: in active development, built in phases (see [docs/PLAN.md](docs/PLAN.md)).
> Phase 1 (foundation: tooling, CI, bilingual shell, theming) is complete.

## Requirements

- Node 24 (see `.nvmrc`)
- pnpm 10 (`corepack enable pnpm`; the version is pinned in `package.json`)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # optional — the app runs without any keys
pnpm dev                     # http://localhost:3000
```

## Scripts

| Command                             | What it does                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm dev`                          | Development server                                                                              |
| `pnpm build` / `pnpm start`         | Production build / server                                                                       |
| `pnpm lint`                         | ESLint (flat config, Next + TypeScript + TanStack Query rules)                                  |
| `pnpm typecheck`                    | Generates route types, then `tsc --noEmit`                                                      |
| `pnpm format` / `pnpm format:check` | Prettier (with Tailwind class sorting)                                                          |
| `pnpm test` / `pnpm test:coverage`  | Vitest unit + component tests (coverage gate: 90 % on `src/lib`)                                |
| `pnpm e2e`                          | Playwright end-to-end + axe accessibility tests against a production build (`pnpm build` first) |
| `pnpm check:css`                    | Fails on physical `left`/`right` utilities — only RTL-safe logical ones are allowed             |
| `pnpm check:bundle`                 | Fails if a server-only secret appears in the client bundle (after `pnpm build`)                 |

## Recipe data

The app ships with 195 real recipes from [TheMealDB](https://www.themealdb.com) in
`data/recipes.json` — nothing is invented, and quantities and steps are kept as published.

```bash
pnpm seed              # rebuild data/recipes.json from data/seed-allowlist.json (reproducible)
pnpm seed --reselect   # re-run the selection (cuisine quotas, quality gates, diet balance) first
pnpm validate:data     # also runs automatically before every `pnpm build`
```

- **Selection** (`src/lib/seed/select.ts`): per-cuisine quotas (more Egyptian, Saudi, British, American,
  Italian, French, Spanish, Chinese and Mexican recipes), quality gates and diet-balance targets.
- **Ingredients** are normalized to canonical names by the matching engine (`src/lib/matching`).
- **Diet tags** are estimated by a conservative classifier, then reviewed per recipe in
  `data/diet-overrides.json`; the build fails if any recipe is unreviewed.
- **Corrections** to TheMealDB's cuisine labels live in `data/cuisine-overrides.json`.
- **Arabic ingredient names** live in `data/i18n/ingredients.ar.json`; every displayed name can also be
  typed in as an ingredient.
- To add a recipe: add its TheMealDB id to `data/seed-allowlist.json`, run `pnpm seed`, review its
  diet tags in `data/diet-overrides.json`, then `pnpm seed` again.

## Languages and direction

- The language toggle (EN | AR) stores the choice in a `NEXT_LOCALE` cookie, so the server renders the
  right `lang`/`dir` on first paint, and mirrors it to `localStorage` (`fc:locale`).
- Layout uses only logical CSS (`ms-`/`me-`/`ps-`/`pe-`/`inset-s-`/`inset-e-`/`text-start`…), so Arabic
  mirrors without layout changes. `pnpm check:css` enforces this.
- Translations live in `messages/en.json` and `messages/ar.json`; a test fails if keys or placeholders differ.

## Credits

Recipe data and photos: [TheMealDB](https://www.themealdb.com).
