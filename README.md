# Tourism Insight AI

A tourism analytics dashboard for Thai provinces. It charts monthly tourism income and visitor numbers (Thai and foreign), maps them by province, and shows model predictions for Sep-Dec 2025.

Built as a university project.

## Screenshots

Add screenshots to `docs/screenshots/` and link them here (dashboard, prediction page, heatmap).

## Features

| Route | Page | Status |
| --- | --- | --- |
| `/dashboard` | Summary cards, yearly and monthly trends, province rankings, YoY / MoM growth | Working |
| `/` | Prediction: pick province, month(s) and visitor type, view result on the map and in the detail charts | Working (precomputed, see below) |
| `/heatmap` | Province heatmap by volume or growth | Working, not linked in the sidebar |
| `/stats` | Per-province statistics and insights | Working, not linked in the sidebar |
| `/conditions` | Festival and high-season rules used by the model inputs | Working |
| `/dataset` | Browse the underlying dataset | Working |
| `/looker` | Embeds a Google Looker Studio report (set `NEXT_PUBLIC_LOOKER_STUDIO_URL` to your own) | Working |
| `/comparison-analysis`, `/smart-prediction` | Placeholder pages | Not implemented |

## Data and predictions

- `public/data/tourism-full.csv`: historical monthly data, 77 provinces x Thai/Foreign x Jan 2023 - Aug 2025 (4,928 rows) (one-hot encoded: province, month, year, tourism type, festivals).
- `public/data/predictions-2025-q4.csv`: predicted income and visitor counts for Sep-Dec 2025, same layout.
- `public/data/TourismData_ForMultiTarget.csv`: the multi-target training table, which includes a `HighSeason` column. Most columns match `tourism-full.csv`, but some income and visitor values differ (about 700 rows), so the two are not interchangeable. The `/dataset`, `/heatmap` and `/conditions` pages read this one.

The predictions come from a multi-output regression model (scikit-learn `MultiOutputRegressor` with `StandardScaler`) that predicts income and visitor count together. **The model code and its FastAPI service (`TID_API_2`) are not part of this repository.** The app therefore serves the precomputed CSV output, and the prediction page says so in the UI. Selections outside Sep-Dec 2025 return an error rather than an invented number.

The prediction API can be plugged back in: set `NEXT_PUBLIC_API_URL` and the app will `POST {url}/predict/` with the form input, falling back to the CSV if the API is unreachable. The request and response shapes are in `src/types/tourism.ts` (`PredictionInput`, `PredictionResult`) and the logic is in `src/lib/predictionService.ts`. The endpoint contract is inferred from the client code and has not been tested against a running backend.

## Tech stack

Next.js 15 (App Router), React 18, TypeScript (strict), Tailwind CSS, shadcn/ui (Radix), Recharts, react-simple-maps, TanStack Query, PapaParse, Vitest.

## Run locally

Requires Node 20+.

```sh
npm ci
cp .env.example .env.local   # optional
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests for the CSV parsers, season and festival rules, and prediction lookup |

## Project structure

```
src/
  app/            routes (App Router) and global styles
  components/
    dashboard/    page-level widgets (forms, maps, summary cards)
    charts/       Recharts components
    layout/       sidebar, providers, logo
    ui/           shadcn/ui primitives
  hooks/          use-toast, use-mobile
  lib/            CSV loaders, prediction service, festival and season rules, province data
  types/          shared TypeScript types
public/data/      CSV datasets served to the client
docs/screenshots/ README images
```

## Known limitations

- Data is loaded and aggregated in the browser from static CSV files; there is no database.
- Predictions are static output, not a live model (see above).
- Some province-name handling works around a misspelling in the dataset (`ศรีษะเกษ`).
- `npm audit` still reports advisories in build-time tooling (PostCSS bundled with Next.js, and braces/micromatch via Tailwind). Clearing them means moving to Next 16 and Tailwind 4.

## Team

- Pitchaya Hutajuta

Other contributors: add names and roles here.

## License

MIT, see [LICENSE](LICENSE).
