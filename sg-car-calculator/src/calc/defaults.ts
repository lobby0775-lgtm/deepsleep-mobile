// Every rule and market number the calculators use lives here, so it can be
// checked against its source in one place. Users can override most of these
// in the UI; these are only the starting values.

export const DATA_AS_OF = '26 Sep 2026';

export type CoeCategory = 'A' | 'B';
export type Fuel = 'petrol' | 'hybrid' | 'ev';
export type VesBand = 'A' | 'B' | 'C1' | 'C2' | 'C3';

/** Latest COE quota premiums (Sep 2026, 2nd bidding exercise). */
export const COE_LATEST: Record<CoeCategory, number> = { A: 131_890, B: 133_000 };
export const COE_LATEST_LABEL = 'Sep 2026, 2nd bidding';

/** Cat A: engine ≤1,600cc and ≤97kW (130bhp); EVs ≤110kW. Everything else is Cat B. */
export const CAT_A_LIMITS = { cc: 1600, kW: 97, evKW: 110 };

/** ARF tiers on OMV, in force since the 2nd COE bidding exercise of Feb 2023. */
export const ARF_TIERS: { upTo: number; rate: number }[] = [
  { upTo: 20_000, rate: 1.0 },
  { upTo: 40_000, rate: 1.4 },
  { upTo: 60_000, rate: 1.9 },
  { upTo: 80_000, rate: 2.5 },
  { upTo: Infinity, rate: 3.2 },
];

/** ARF can't be reduced below this by VES rebates / EEAI. EVs: $0 until end-2027. */
export const MIN_ARF = 5_000;
export const MIN_ARF_EV = 0;

export const EXCISE_DUTY_RATE = 0.2; // of OMV
export const GST_RATE = 0.09; // on OMV + excise duty
export const REGISTRATION_FEE = 350;

/** Vehicular Emissions Scheme: negative = rebate, positive = surcharge (added to ARF). */
export const VES: Record<2026 | 2027, Record<VesBand, number>> = {
  2026: { A: -22_500, B: 0, C1: 7_500, C2: 22_500, C3: 35_000 },
  2027: { A: -20_000, B: 0, C1: 15_000, C2: 30_000, C3: 45_000 },
};

/** EV Early Adoption Incentive: 45% of ARF, capped. Registrations in 2026 only. */
export const EEAI = { rate: 0.45, cap: 7_500, years: [2026] };

/**
 * PARF rebate schedules, as % of ARF paid, by age at deregistration.
 * index 0 = ≤5 years, 1 = >5–6 years, ... 5 = >9–10 years. Nothing after 10 years.
 */
export type ParfRegime = 'pre2023' | 'cap60k' | 'budget2026';
export const PARF_REGIMES: Record<ParfRegime, { label: string; rates: number[]; cap: number }> = {
  pre2023: {
    label: 'COE before Feb 2023 (75%→50%, no cap)',
    rates: [0.75, 0.7, 0.65, 0.6, 0.55, 0.5],
    cap: Infinity,
  },
  cap60k: {
    label: 'COE Feb 2023 – Feb 2026 (75%→50%, cap $60k)',
    rates: [0.75, 0.7, 0.65, 0.6, 0.55, 0.5],
    cap: 60_000,
  },
  budget2026: {
    label: 'COE from Feb 2026 2nd bidding (30%→5%, cap $30k)',
    rates: [0.3, 0.25, 0.2, 0.15, 0.1, 0.05],
    cap: 30_000,
  },
};
/** Approximate registration dates at which each PARF regime starts. */
export const PARF_REGIME_START = { cap60k: '2023-02-15', budget2026: '2026-02-13' };

/** MAS motor-vehicle loan limits. */
export const LOAN_RULES = {
  omvThreshold: 20_000,
  ltvLowOmv: 0.7, // OMV ≤ $20k
  ltvHighOmv: 0.6, // OMV > $20k
  maxTenureYears: 7,
};
export const MARKET_FLAT_RATE = 2.5; // % p.a. flat, typical bank/finance-house rate

/** Road tax (6-monthly) = formula × 0.782. EVs also pay an Additional Flat Component. */
export const ROAD_TAX_FACTOR = 0.782;
export const EV_AFC_HALF_YEAR = 350;

/** Very rough running-cost defaults — every one is editable. */
export const RUNNING_DEFAULTS = {
  kmPerYear: 15_000,
  petrolPerLitre: 2.85,
  litresPer100km: { petrol: 7.0, hybrid: 4.5, ev: 0 },
  kWhPer100km: 15,
  electricityPerKWh: 0.55,
  parkingPerMonth: 110,
  erpPerMonth: 40,
  servicingPerYear: 1_000,
};

/** Comprehensive premium before No-Claim Discount, experienced driver. Rough market level. */
export const INSURANCE_BASE: Record<CoeCategory, number> = { A: 2_400, B: 3_600 };
