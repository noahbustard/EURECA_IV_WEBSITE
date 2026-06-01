# IV Medication Administration Simulation

Interactive web simulation for practicing timed IV push medication administration in a guided research workflow.

Presented at UGRCAF 2026 (Undergraduate Research and Creative Activities Forum) through the EURECA undergraduate research program at Midwestern State University.

## Research poster

![EURECA research poster: Enhancing Patient Safety - Development of an EMR-based IV Medication Administration Virtual Simulation](public/eureca-iv-poster.png)

## Why this project matters

Nursing IV push administration requires both dosage accuracy and timing compliance. This project provides a structured simulation where participants complete consent and demographics, administer medications in a controlled interface, and export timing/compliance data for analysis.

## Core capabilities

- Guided participant flow: consent, demographics, practice run, simulation, summary
- Interactive syringe trainer with room clock and elapsed-time tracking
- Medication order context: dose, route, frequency, instructions, and line details
- Optional additional drug-reference view per medication
- Automated compliance evaluation against required minimum administration time
- Persistent Supabase database collection with separate training and official study run types
- Admin-only Excel export with separate training and official study worksheets

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS v4
- Supabase Postgres for durable result storage
- ExcelJS for admin workbook exports
- ESLint (Next.js + TypeScript rules)

## Local development

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
git clone https://github.com/noahbustard/IV_SIMULATION_APP.git
cd IV_SIMULATION_APP
npm install
```

### Run

```bash
npm run dev
```

Open <http://localhost:3000>.

## Scripts

- `npm run dev`: start development server
- `npm run lint`: run ESLint across the repository
- `npm run typecheck`: run TypeScript type checking (`tsc --noEmit`)
- `npm run build`: create production build
- `npm run start`: run production build locally
- `npm run verify`: run lint + typecheck + build

## Environment configuration

Runtime configuration is provided through server-side environment variables.

Secrets must stay server-only and should not use the `NEXT_PUBLIC_` prefix.

## Supabase result collection

Completed medication sequences are saved through `src/app/api/results/route.ts` into the `simulation_results` Supabase table. The database is the source of truth.

The standalone practice screen is not logged. After practice, the participant selects either `Training Run` or `Official Study Run`; that selection is locked for the full medication sequence and determines how completed rows are saved. Duplicate medication rows are blocked by a unique database constraint on `(run_id, medication)`.

## Admin Excel export

Admins can download the database-backed workbook at:

```plaintext
/api/admin/results.xlsx?token=YOUR_RESULTS_ADMIN_TOKEN
```

The export creates two worksheets:

- `Training Runs`
- `Official Study Runs`

## Data captured

- Run ID
- Run Type
- Saved At
- Participant ID
- Age
- Gender
- Level of Nursing
- Area of Nursing
- Years of Nursing Experience
- Medication
- Administration Time (seconds)
- Required Minimum Administration Time (seconds)
- Compliance Status
- Viewed Additional Drug Information
- Completed At

## Project structure

```plaintext
src/
  app/
    layout.tsx            # App shell + metadata
    page.tsx              # Main simulation UI and screen flow
    api/results/route.ts  # Supabase save API route
    api/admin/results.xlsx/route.ts # Admin Excel export route
    lib/results-store.ts  # Supabase persistence helper
    lib/results-excel.ts  # Excel workbook export helper
    lib/simulation.ts     # Simulation domain types, constants, and pure helpers
supabase/
  migrations/
    20260531000000_create_simulation_results.sql
```

## Verification status

Use the following command before opening pull requests:

```bash
npm run verify
```

## Known limitations

- No automated test suite yet (lint, typecheck, and build checks are included).
- Supabase credentials are required before real result saves can be tested.
- Google Sheets sync is optional and non-authoritative; Supabase remains the source of truth.
- This is a research simulation, not a clinical decision support or production EMR integration.

## Academic context

Research collaboration between the Wilson School of Nursing and Department of Computer Science, Midwestern State University.

## License

Developed for academic research and educational use.
