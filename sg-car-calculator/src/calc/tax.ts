import {
  ARF_TIERS,
  EEAI,
  EV_AFC_HALF_YEAR,
  EXCISE_DUTY_RATE,
  GST_RATE,
  MIN_ARF,
  MIN_ARF_EV,
  REGISTRATION_FEE,
  ROAD_TAX_FACTOR,
  VES,
  type Fuel,
  type VesBand,
} from './defaults';

/** Gross ARF on the tiered schedule, before VES and EEAI. */
export function grossArf(omv: number): number {
  let arf = 0;
  let lower = 0;
  for (const { upTo, rate } of ARF_TIERS) {
    if (omv <= lower) break;
    arf += (Math.min(omv, upTo) - lower) * rate;
    lower = upTo;
  }
  return Math.round(arf);
}

export interface ArfResult {
  gross: number;
  ves: number; // negative = rebate
  eeai: number; // positive amount taken off
  paid: number;
}

export function arfPayable(omv: number, fuel: Fuel, band: VesBand, regYear: number): ArfResult {
  const gross = grossArf(omv);
  const vesYear = regYear >= 2027 ? 2027 : 2026;
  const ves = VES[vesYear][band];
  const eeai = fuel === 'ev' && EEAI.years.includes(regYear) ? Math.min(gross * EEAI.rate, EEAI.cap) : 0;
  const floor = fuel === 'ev' ? MIN_ARF_EV : MIN_ARF;
  // Rebates can't take ARF below the floor; surcharges always apply in full.
  const afterRebates = Math.max(Math.min(floor, gross), gross - eeai + Math.min(ves, 0));
  const paid = afterRebates + Math.max(ves, 0);
  return { gross, ves, eeai: Math.round(eeai), paid: Math.round(paid) };
}

export interface PriceBreakdown {
  omv: number;
  exciseDuty: number;
  gst: number;
  arf: ArfResult;
  coe: number;
  registrationFee: number;
  /** Everything the government and COE system take. */
  taxesAndCoe: number;
  /** OMV + taxes + COE: what the car "should" cost before the dealer's cut. */
  baseCost: number;
  /** Dealer price minus baseCost: shipping, warranty, freebies, and profit. */
  dealerShare: number | null;
}

export function priceBreakdown(p: {
  omv: number;
  coe: number;
  fuel: Fuel;
  vesBand: VesBand;
  regYear: number;
  dealerPrice?: number;
}): PriceBreakdown {
  const exciseDuty = Math.round(p.omv * EXCISE_DUTY_RATE);
  const gst = Math.round((p.omv + exciseDuty) * GST_RATE);
  const arf = arfPayable(p.omv, p.fuel, p.vesBand, p.regYear);
  const taxesAndCoe = exciseDuty + gst + arf.paid + p.coe + REGISTRATION_FEE;
  const baseCost = p.omv + taxesAndCoe;
  return {
    omv: p.omv,
    exciseDuty,
    gst,
    arf,
    coe: p.coe,
    registrationFee: REGISTRATION_FEE,
    taxesAndCoe,
    baseCost,
    dealerShare: p.dealerPrice ? p.dealerPrice - baseCost : null,
  };
}

/** Annual road tax for a car under 10 years old. */
export function roadTaxPerYear(fuel: Fuel, engineCc: number, powerKW: number): number {
  let half: number;
  if (fuel === 'ev') {
    const kw = powerKW;
    if (kw <= 7.5) half = 200;
    else if (kw <= 30) half = 200 + 2 * (kw - 7.5);
    else if (kw <= 230) half = 250 + 3.75 * (kw - 30);
    else half = 1525 + 10 * (kw - 230);
    half = half * ROAD_TAX_FACTOR + EV_AFC_HALF_YEAR;
  } else {
    const cc = engineCc;
    if (cc <= 600) half = 200;
    else if (cc <= 1000) half = 200 + 0.125 * (cc - 600);
    else if (cc <= 1600) half = 250 + 0.375 * (cc - 1000);
    else if (cc <= 3000) half = 475 + 0.75 * (cc - 1600);
    else half = 1525 + (cc - 3000);
    half *= ROAD_TAX_FACTOR;
  }
  return Math.round(half * 2);
}
