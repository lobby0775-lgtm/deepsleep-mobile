/**
 * What comprehensive insurance actually costs.
 *
 * The premium is the small, visible part. The expensive parts are the
 * conditions attached to it, and none of those are what you compare quotes on:
 *
 *   1. The No-Claim Discount is earned, not granted. Lose it once and the
 *      premium rises permanently — often by more than the claim cost.
 *   2. The excess is what you keep paying on every claim.
 *   3. The excess is usually a percentage of the car's value for theft and
 *      total loss, not the flat number quoted for third-party damage.
 *   4. Some policies are locked in for years, so a bad rate cannot be escaped.
 *   5. Premiums rise with age even with a perfect record, because insurers
 *      re-rate the whole book.
 *
 * The functions here turn a quote into the number that actually matters: the
 * cost of keeping the car insured over the period you intend to own it.
 */

import {
  INSURANCE_CEILING,
  INSURANCE_ENGINE_BANDS,
  INSURANCE_FLOOR,
  INSURANCE_OMV_BANDS,
  INSURANCE_POWER_FACTOR,
  INSURANCE_POWER_THRESHOLD_KW,
  type Fuel,
} from './defaults';

/* ------------------------------------------------------------------ *
 * Estimating a premium
 * ------------------------------------------------------------------ */

export interface InsuranceProfile {
  /** Open Market Value — what insurers actually rate off. */
  omv: number;
  /** No-Claim Discount, 0–50%. */
  ncdPct: number;
  driverAge: number;
  yearsLicensed: number;
  engineCc: number;
  powerKW: number;
  /** Loading applied to the premium for the make and model. */
  modelFactor?: number;
  /** Offsets: safe driver, age-based, loyalty, etc. Never negative. */
  otherDiscountPct?: number;
}

/** The rate band this OMV falls into, as a percentage of OMV. */
export function insuranceRatePct(omv: number): number {
  const band = INSURANCE_OMV_BANDS.find((b) => omv <= b.upTo) ?? INSURANCE_OMV_BANDS[INSURANCE_OMV_BANDS.length - 1];
  return band.ratePct;
}

function engineFactor(cc: number): number {
  return (INSURANCE_ENGINE_BANDS.find((b) => cc > b.overCc) ?? INSURANCE_ENGINE_BANDS[INSURANCE_ENGINE_BANDS.length - 1]).factor;
}

/**
 * A rough comprehensive premium: OMV × the rate band, loaded for engine size,
 * power, model and driver, then discounted for NCD and any other credits.
 *
 * These are the order-of-magnitude numbers, not a quote. Anything that
 * depends on your own history — NCD, claims, discounts — cannot be estimated
 * from a car, and the calculator always offers to take your real figures.
 */
export function estimateInsurance(p: InsuranceProfile): number {
  const omv = Math.max(0, p.omv);
  let premium = (omv * insuranceRatePct(omv)) / 100;
  premium *= engineFactor(p.engineCc);
  if (p.powerKW > INSURANCE_POWER_THRESHOLD_KW) premium *= INSURANCE_POWER_FACTOR;
  if (p.modelFactor) premium *= p.modelFactor;
  if (p.driverAge < 26) premium *= 1.35;
  else if (p.driverAge >= 70) premium *= 1.25;
  if (p.yearsLicensed < 2) premium *= 1.3;
  premium *= 1 - clampPct(p.ncdPct) / 100;
  premium *= 1 - clampPct(p.otherDiscountPct ?? 0) / 100;
  return roundTo10(clamp(premium, INSURANCE_FLOOR, INSURANCE_CEILING));
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const clampPct = (n: number) => clamp(n, 0, 50);
const roundTo10 = (n: number) => Math.round(n / 10) * 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ *
 * Working back from a real quote
 * ------------------------------------------------------------------ */

export interface QuoteInputs {
  /** The premium you are quoted or actually paying, per year. */
  premium: number;
  /** Your No-Claim Discount. 50 = 50%. */
  ncdPct: number;
  /** Any discount beyond NCD, as a percentage: safe driver, loyalty, age. */
  otherDiscountPct?: number;
}

/**
 * The premium before any no-claim discount.
 *
 * NCD is a reward for a claim-free year, so it is applied to the full premium
 * and the discounted figure is what you pay. Undoing it tells you what a driver
 * with a spotty record would be charged for the identical car — which is the
 * real cost of losing it.
 */
export function grossPremium(q: QuoteInputs): number {
  const factor = (1 - clampPct(q.ncdPct) / 100) * (1 - clampPct(q.otherDiscountPct ?? 0) / 100);
  if (factor <= 0) return q.premium;
  return round2(q.premium / factor);
}

/** What the policy costs with no no-claim discount at all. */
export function premiumWithoutNcd(q: QuoteInputs): number {
  return round2(q.premium / (1 - clampPct(q.ncdPct) / 100));
}

/**
 * What one claim costs, including the permanent loss of NCD.
 *
 * The damage is the excess you pay on that single claim. The lasting cost is
 * the NCD you never earn again, for as long as you keep the car.
 *
 * `ncdLostPct` is the discount forfeited. Insurers commonly void the whole
 * NCD for a single at-fault claim, though some only reduce it.
 */
export interface ClaimCostInputs {
  /** The excess, or the damage, whichever is larger. */
  damage: number;
  excess: number;
  /** What the premium was before the claim. */
  premium: number;
  ncdPct: number;
  otherDiscountPct?: number;
  /** How much NCD the claim forfeits, 0–50. */
  ncdLostPct: number;
  /** How long you keep the car afterwards. */
  yearsOwned: number;
  /** Expected claims of this size over that period, for the frequency case. */
  claimsPerYear?: number;
}

export interface ClaimCost {
  /** What you hand over at the counter, once, if you claim. */
  excessPaid: number;
  /** The single-claim damage, for comparison. */
  claimDamage: number;
  /** Premium rise caused by losing the NCD, every year. */
  annualNcdCost: number;
  /** The NCD loss over the whole ownership period. */
  ncdCostOverYears: number;
  /** Your share of the damage if you settle it yourself. */
  selfPayCost: number;
  /** Your total cost if you claim: excess, plus the NCD you never get back. */
  claimCost: number;
  /** What claiming costs you beyond just fixing the car yourself. */
  claimOverhead: number;
  /** Cost of keeping the NCD, over the period: never claiming. */
  cleanRecordCost: number;
  cleanRecordPerYear: number;
  /** How many times over the damage is the real cost of claiming. */
  multiplesOfDamage: number;
  /** Claim only if this is true. */
  worthClaiming: boolean;
}

export function costOfClaim(c: ClaimCostInputs): ClaimCost {
  // Work from the premium *before* NCD. Re-pricing the discounted figure at a
  // lower NCD would compound the discount and understate the loss.
  const gross = grossPremium({ premium: c.premium, ncdPct: c.ncdPct, otherDiscountPct: c.otherDiscountPct });
  const other = 1 - clampPct(c.otherDiscountPct ?? 0) / 100;
  const clean = premiumAtNcd(gross, c.ncdPct) * other;
  const after = premiumAtNcd(gross, Math.max(0, c.ncdPct - clampPct(c.ncdLostPct))) * other;
  const annualNcdCost = after - clean;
  const ncdCostOverYears = annualNcdCost * c.yearsOwned;
  // You only ever hand over the excess, and never more than the damage.
  const excessPaid = Math.min(c.damage, c.excess);

  // The comparison that actually matters. You pay the excess either way, so the
  // choice is between: pay the whole damage and keep your NCD, or pay the
  // excess and lose the NCD for good.
  const selfPayCost = c.damage;
  const claimCost = excessPaid + ncdCostOverYears;

  return {
    excessPaid: round2(excessPaid),
    claimDamage: c.damage,
    annualNcdCost: round2(annualNcdCost),
    ncdCostOverYears: round2(ncdCostOverYears),
    selfPayCost: round2(selfPayCost),
    claimCost: round2(claimCost),
    claimOverhead: round2(claimCost - selfPayCost),
    cleanRecordCost: round2(clean * c.yearsOwned),
    cleanRecordPerYear: round2(clean),
    multiplesOfDamage: c.damage > 0 ? round2(claimCost / c.damage) : 0,
    worthClaiming: claimCost < selfPayCost,
  };
}

/** Re-price a *gross* premium at a given NCD. */
export function premiumAtNcd(gross: number, ncdPct: number): number {
  return round2(gross * (1 - clampPct(ncdPct) / 100));
}

/* ------------------------------------------------------------------ *
 * Excess
 * ------------------------------------------------------------------ */

/**
 * What the excess really is, for each kind of claim.
 *
 * Almost every Singapore policy quotes the damage excess as a fixed number
 * while setting the theft and total-loss excess as a *percentage of the car's
 * value*, typically 10–20%. On a $22,000 car that percentage is the bigger
 * number, and it is the one people are surprised by.
 */
export interface ExcessBreakdown {
  /** Third-party or own-damage excess, as quoted. */
  damageExcess: number;
  /** Excess on theft and total loss, as a share of the car's value. */
  theftPct: number;
  /** The resulting theft / total-loss excess in dollars. */
  theftExcess: number;
  /** The largest excess any single claim could leave you with. */
  worstCaseExcess: number;
  /** Share of the car's value you still pay after a total loss. */
  worstCasePctOfValue: number;
  /** Your share of a total-loss payout on this car. */
  totalLossPayout: number;
}

export function breakdownOfExcess(opts: {
  damageExcess: number;
  omv: number;
  /** Percentage of value, as a fraction. Defaults to 10%. */
  theftPct?: number;
}): ExcessBreakdown {
  const theftPct = opts.theftPct ?? 0.1;
  const theftExcess = round2(opts.omv * theftPct);
  const worstCaseExcess = round2(Math.max(opts.damageExcess, theftExcess));
  return {
    damageExcess: round2(opts.damageExcess),
    theftPct,
    theftExcess,
    worstCaseExcess,
    worstCasePctOfValue: opts.omv > 0 ? round2((worstCaseExcess / opts.omv) * 100) : 0,
    totalLossPayout: round2(Math.max(0, opts.omv - worstCaseExcess)),
  };
}

/* ------------------------------------------------------------------ *
 * Running costs
 * ------------------------------------------------------------------ */

export interface RunningInputs {
  fuel: Fuel;
  kmPerYear: number;
  litresPer100km: number;
  petrolPerLitre: number;
  kWhPer100km: number;
  electricityPerKWh: number;
  parkingPerMonth: number;
  erpPerMonth: number;
  servicingPerYear: number;
  insurancePerYear: number;
  roadTaxPerYear: number;
}

export interface RunningCosts {
  energy: number;
  parking: number;
  erp: number;
  servicing: number;
  insurance: number;
  roadTax: number;
  total: number;
}

export function runningCostsPerYear(r: RunningInputs): RunningCosts {
  const energy =
    r.fuel === 'ev'
      ? (r.kmPerYear / 100) * r.kWhPer100km * r.electricityPerKWh
      : (r.kmPerYear / 100) * r.litresPer100km * r.petrolPerLitre;
  const parts = {
    energy: Math.round(energy),
    parking: Math.round(r.parkingPerMonth * 12),
    erp: Math.round(r.erpPerMonth * 12),
    servicing: Math.round(r.servicingPerYear),
    insurance: Math.round(r.insurancePerYear),
    roadTax: Math.round(r.roadTaxPerYear),
  };
  return { ...parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
}
