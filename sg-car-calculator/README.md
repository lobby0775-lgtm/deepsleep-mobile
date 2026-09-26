# OpenBonnet: Singapore car cost calculator

A static web app that shows what a car in Singapore really costs: taxes, COE, loan interest, insurance, running costs, depreciation and trade-in value.

## Pages

- **True cost calculator** (`#/calculator`): price breakdown (OMV, excise, GST, ARF with VES/EEAI, COE, dealer share), MAS loan limits, flat rate → EIR, insurance estimate, running costs, and total cost of ownership for 1–10 years.
- **Deal decoder** (`#/deal`): enter a dealer quote line by line (COE guarantee, bids, fees, freebies, tied loan/insurance, trade-in). Returns the all-in cost and red flags.
- **Depreciation** (`#/depreciation`): yearly depreciation for new and used cars, with market value and paper value by year. Handles renewed COEs and all three PARF regimes (pre-2023, $60k cap, Budget 2026).
- **Trade-in checker** (`#/trade-in`): PARF + COE rebate paper value compared with a dealer's offer.
- **Guide** (`#/guides`): plain-English explanations of each term.

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests for the calculation engine
npm run build      # type-check and build to dist/
```

All rules and market figures live in `src/calc/defaults.ts`, with the date they were checked. Update them when LTA or MAS change the rules, or after each COE bidding exercise. The calculation logic is in `src/calc/`, as pure functions with tests in `calc.test.ts`.

## Deploying

Import the repo into Vercel and set **Root Directory** to `sg-car-calculator`. `vercel.json` sets up the Vite build. Any static host that serves `dist/` also works.
