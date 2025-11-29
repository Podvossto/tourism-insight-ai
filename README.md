# Tourism Insight AI

An interactive tourism analytics dashboard rebuilt on [Next.js](https://nextjs.org/) with the App Router, Tailwind CSS, and shadcn/ui. It visualizes historical CSV data, runs mock AI predictions, and highlights province-level insights for decision makers.

## Getting Started

```sh
# Install dependencies
npm install

# Start the FastAPI service (from TID_API_2 folder)
# uvicorn app:app --reload --port 8000

# Start Next.js in development mode
npm run dev

# Run production build / preview
npm run build
npm start
```

Create a `.env.local` if you host the FastAPI service on a custom domain:

```
NEXT_PUBLIC_API_URL=https://your-fastapi-host
```

## Available Scripts

- `npm run dev` – start the Next.js dev server with hot reloading.
- `npm run build` – create an optimized production build.
- `npm start` – serve the production build.
- `npm run lint` – run ESLint against the entire project.

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- React 18 with TanStack Query
- Tailwind CSS + tailwindcss-animate
- shadcn/ui + Radix primitives
- Recharts, React Simple Maps, d3-geo

## Project Structure

- `src/app` – Next.js routes, layout, and global styles.
- `src/components` – dashboard widgets, UI kit, and shared providers.
- `src/data` / `src/utils` – static data and CSV loader helpers, including real CSV parsers.
- `public/data` – historical and predicted CSVs served at runtime.

## Data & Model Integration

- `public/data/tourism-full.csv` is the full training dataset (`TourismData_ForMultiTarget.csv`).
- `public/data/predictions-2025-q4.csv` provides the pre-generated predictions for Sep–Dec 2025.
- The `src/utils/csvLoader.ts` module aggregates these CSVs into province-level insights for the UI.
- Real-time predictions are powered by the FastAPI service in `TID_API_2/app.py` (MultiOutputRegressor + StandardScaler). Update the `.env.local` base URL if the API is not running on `http://127.0.0.1:8000`.

## Deployment

The project is compatible with any platform that supports Next.js (Vercel, Netlify, Render, etc.). Build with `npm run build` and deploy the `.next` output according to your platform’s instructions.
