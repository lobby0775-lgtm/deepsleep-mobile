import type { ParfRegime } from './defaults';
import { coeRebate, monthsBetween, paperValue, parfRebate, parfRegimeFor } from './rebates';

export interface DepreciationYear {
  year: number;
  /** Straight-line estimate, the way Singapore dealers and listings price cars. */
  marketValue: number;
  /** What you'd get back from LTA if you deregistered at the end of this year. */
  paperValue: number;
  parf: number;
  coeRebate: number;
  /** Value lost during this year (market estimate). */
  lost: number;
  cumulativeLost: number;
}

export interface DepreciationResult {
  /** The headline "depreciation per year" figure: (price − value at COE expiry) / years left. */
  annual: number;
  /** What's left when the COE runs out (PARF only; COE rebate is nil). */
  residual: number;
  yearsLeft: number;
  schedule: DepreciationYear[];
}

/** Depreciation for a new car, year by year until its 10-year COE ends. */
export function newCarDepreciation(p: {
  price: number;
  arfPaid: number;
  coePaid: number;
  regime: ParfRegime;
  years?: number;
}): DepreciationResult {
  const years = p.years ?? 10;
  const residual = parfRebate(p.arfPaid, years, p.regime);
  const annual = (p.price - residual) / years;
  const schedule: DepreciationYear[] = [];
  let prev = p.price;
  for (let y = 1; y <= years; y++) {
    const pv = paperValue({
      arfPaid: p.arfPaid,
      coePaid: p.coePaid,
      ageYears: y,
      coeMonthsLeft: (years - y) * 12,
      regime: p.regime,
    });
    const marketValue = Math.round(p.price - annual * y);
    schedule.push({
      year: y,
      marketValue,
      paperValue: pv.total,
      parf: pv.parf,
      coeRebate: pv.coe,
      lost: prev - marketValue,
      cumulativeLost: p.price - marketValue,
    });
    prev = marketValue;
  }
  return { annual: Math.round(annual), residual, yearsLeft: years, schedule };
}

export interface UsedCarResult extends DepreciationResult {
  ageYears: number;
  paperValueToday: number;
  /** How much you pay above what the car is worth on paper today. */
  premiumOverPaper: number;
}

/** The standard used-car depreciation figure, plus the year-by-year run-down. */
export function usedCarDepreciation(p: {
  price: number;
  regDate: string;
  coeExpiry: string;
  arfPaid: number;
  coePaid: number;
  coeRenewed: boolean;
  /** Length of the renewed COE (5 or 10 years); the COE rebate is pro-rated over it. */
  renewalYears?: 5 | 10;
  today: string;
  regime?: ParfRegime;
}): UsedCarResult {
  const regime = p.regime ?? parfRegimeFor(p.regDate);
  const ageMonths = monthsBetween(p.regDate, p.today);
  const monthsLeft = monthsBetween(p.today, p.coeExpiry);
  const totalCoeMonths = Math.max(1, monthsBetween(p.regDate, p.coeExpiry));
  const coeMonths = p.coeRenewed ? (p.renewalYears ?? 10) * 12 : totalCoeMonths;
  const ageAtExpiry = monthsBetween(p.regDate, p.coeExpiry) / 12;
  const residual = p.coeRenewed ? 0 : parfRebate(p.arfPaid, ageAtExpiry, regime);
  const yearsLeft = monthsLeft / 12;
  const annual = yearsLeft > 0 ? (p.price - residual) / yearsLeft : 0;

  const today = paperValue({
    arfPaid: p.arfPaid,
    coePaid: p.coePaid,
    ageYears: ageMonths / 12,
    coeMonthsLeft: monthsLeft,
    regime,
    coeRenewed: p.coeRenewed,
    coeMonths,
  });

  const schedule: DepreciationYear[] = [];
  const wholeYears = Math.ceil(yearsLeft);
  let prev = p.price;
  for (let y = 1; y <= wholeYears; y++) {
    const t = Math.min(y, yearsLeft);
    const left = monthsLeft - Math.round(t * 12);
    const parf = p.coeRenewed ? 0 : parfRebate(p.arfPaid, ageMonths / 12 + t, regime);
    const coe = coeRebate(p.coePaid, left, coeMonths);
    const marketValue = Math.round(p.price - annual * t);
    schedule.push({
      year: y,
      marketValue,
      paperValue: parf + coe,
      parf,
      coeRebate: coe,
      lost: prev - marketValue,
      cumulativeLost: p.price - marketValue,
    });
    prev = marketValue;
  }

  return {
    annual: Math.round(annual),
    residual,
    yearsLeft,
    schedule,
    ageYears: ageMonths / 12,
    paperValueToday: today.total,
    premiumOverPaper: p.price - today.total,
  };
}
