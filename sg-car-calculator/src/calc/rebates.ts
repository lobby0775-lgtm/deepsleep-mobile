import { PARF_REGIME_START, PARF_REGIMES, type ParfRegime } from './defaults';

/** Which PARF schedule applies, judged from the registration date (ISO yyyy-mm-dd). */
export function parfRegimeFor(regDate: string): ParfRegime {
  if (regDate >= PARF_REGIME_START.budget2026) return 'budget2026';
  if (regDate >= PARF_REGIME_START.cap60k) return 'cap60k';
  return 'pre2023';
}

/** PARF rebate for deregistering a car at `ageYears` old. Zero at >10 years or after COE renewal. */
export function parfRebate(arfPaid: number, ageYears: number, regime: ParfRegime): number {
  if (ageYears > 10) return 0;
  const { rates, cap } = PARF_REGIMES[regime];
  const idx = ageYears <= 5 ? 0 : Math.min(5, Math.ceil(ageYears) - 5);
  return Math.round(Math.min(arfPaid * rates[idx], cap));
}

/** Rebate on the unused part of the COE, pro-rated by whole months left. */
export function coeRebate(coePaid: number, monthsLeft: number, coeMonths = 120): number {
  if (monthsLeft <= 0) return 0;
  return Math.round((coePaid * Math.floor(monthsLeft)) / coeMonths);
}

export interface PaperValue {
  parf: number;
  coe: number;
  total: number;
}

/**
 * "Paper value": what the government pays you back if you deregister
 * (scrap or export) the car. This is the floor on what a car is worth.
 */
export function paperValue(p: {
  arfPaid: number;
  coePaid: number;
  ageYears: number;
  coeMonthsLeft: number;
  regime: ParfRegime;
  /** A car on a renewed COE has no PARF left. */
  coeRenewed?: boolean;
  coeMonths?: number;
}): PaperValue {
  const parf = p.coeRenewed ? 0 : parfRebate(p.arfPaid, p.ageYears, p.regime);
  const coe = coeRebate(p.coePaid, p.coeMonthsLeft, p.coeMonths);
  return { parf, coe, total: parf + coe };
}

/** Whole months between two ISO dates (b − a), never negative. */
export function monthsBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  let m = (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
  if (db.getDate() < da.getDate()) m -= 1;
  return Math.max(0, m);
}

export function addYears(iso: string, years: number): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}
