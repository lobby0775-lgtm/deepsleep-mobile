import {
  INSURANCE_CEILING,
  INSURANCE_ENGINE_BANDS,
  INSURANCE_FLOOR,
  INSURANCE_OMV_BANDS,
  INSURANCE_POWER_FACTOR,
  INSURANCE_POWER_THRESHOLD_KW,
  type Fuel,
} from './defaults';

export interface InsuranceProfile {
  /** Open Market Value — what insurers actually rate off. */
  omv: number;
  /** No-Claim Discount, 0–50%. */
  ncdPct: number;
  driverAge: number;
  yearsLicensed: number;
  engineCc: number;
  powerKW: number;
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
 * A rough comprehensive-insurance estimate: OMV × the rate band, loaded for
 * engine size, power and driver, then discounted for NCD and clamped to the
 * market floor and ceiling.
 *
 * Real quotes vary a lot by insurer, model and driving record. This only shows
 * the order of magnitude, which is why the UI always offers to take a real quote.
 */
export function estimateInsurance(p: InsuranceProfile): number {
  const omv = Math.max(0, p.omv);
  let premium = (omv * insuranceRatePct(omv)) / 100;
  premium *= engineFactor(p.engineCc);
  if (p.powerKW > INSURANCE_POWER_THRESHOLD_KW) premium *= INSURANCE_POWER_FACTOR;
  if (p.driverAge < 26) premium *= 1.35;
  else if (p.driverAge >= 70) premium *= 1.25;
  if (p.yearsLicensed < 2) premium *= 1.3;
  premium *= 1 - Math.min(50, Math.max(0, p.ncdPct)) / 100;
  return Math.round(Math.min(INSURANCE_CEILING, Math.max(INSURANCE_FLOOR, premium)) / 10) * 10;
}

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
