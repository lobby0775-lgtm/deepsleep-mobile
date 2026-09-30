import { describe, expect, it } from 'vitest';
import { arfPayable, grossArf, priceBreakdown, roadTaxPerYear } from './tax';
import { coeRebate, monthsBetween, parfRebate, parfRegimeFor } from './rebates';
import { earlySettlement, flatRateLoan, maxLoan } from './loan';
import { newCarDepreciation, usedCarDepreciation } from './depreciation';
import { estimateInsurance, insuranceRatePct, runningCostsPerYear, grossPremium, premiumWithoutNcd, premiumAtNcd, costOfClaim, breakdownOfExcess } from './running';
import { decodeDeal, type DealQuote } from './deal';
import { INSURANCE_CEILING, INSURANCE_FLOOR } from './defaults';
import { CALC_DEFAULTS, resolveLoan, type CalcState } from '../pages/Calculator';

describe('ARF', () => {
  it('applies the tiered rates', () => {
    expect(grossArf(20_000)).toBe(20_000);
    expect(grossArf(40_000)).toBe(48_000);
    expect(grossArf(50_000)).toBe(67_000);
    expect(grossArf(100_000)).toBe(200_000);
  });

  it('adds VES surcharges and takes off rebates down to the floor', () => {
    expect(arfPayable(30_000, 'petrol', 'B', 2026).paid).toBe(34_000);
    expect(arfPayable(30_000, 'petrol', 'C2', 2026).paid).toBe(56_500);
    // Petrol cars can't go below the $5,000 minimum ARF
    expect(arfPayable(20_000, 'petrol', 'A', 2026).paid).toBe(5_000);
  });

  it('gives EVs the EEAI in 2026 and a $0 floor', () => {
    const r = arfPayable(30_000, 'ev', 'A', 2026);
    expect(r.eeai).toBe(7_500);
    expect(r.paid).toBe(4_000);
    expect(arfPayable(20_000, 'ev', 'A', 2026).paid).toBe(0);
    // No EEAI in 2027, and the band A rebate drops to $20k
    expect(arfPayable(30_000, 'ev', 'A', 2027).paid).toBe(14_000);
  });
});

describe('price breakdown', () => {
  it('adds up OMV, duties, ARF, COE and fees', () => {
    const b = priceBreakdown({ omv: 30_000, coe: 131_890, fuel: 'petrol', vesBand: 'B', regYear: 2026, dealerPrice: 230_000 });
    expect(b.exciseDuty).toBe(6_000);
    expect(b.gst).toBe(3_240);
    expect(b.taxesAndCoe).toBe(175_480);
    expect(b.baseCost).toBe(205_480);
    expect(b.dealerShare).toBe(24_520);
  });
});

describe('road tax', () => {
  it('uses the engine-capacity formula for petrol cars', () => {
    expect(roadTaxPerYear('petrol', 1496, 0)).toBe(682);
    expect(roadTaxPerYear('petrol', 1598, 0)).toBe(742);
  });
  it('uses power plus the flat component for EVs', () => {
    expect(roadTaxPerYear('ev', 0, 150)).toBe(1795);
  });
});

describe('PARF and COE rebates', () => {
  it('follows the age bands', () => {
    expect(parfRebate(34_000, 3, 'cap60k')).toBe(25_500);
    expect(parfRebate(34_000, 5.5, 'cap60k')).toBe(23_800);
    expect(parfRebate(34_000, 10, 'cap60k')).toBe(17_000);
    expect(parfRebate(34_000, 10.1, 'cap60k')).toBe(0);
  });
  it('uses the Budget 2026 schedule and caps', () => {
    expect(parfRebate(34_000, 3, 'budget2026')).toBe(10_200);
    expect(parfRebate(34_000, 10, 'budget2026')).toBe(1_700);
    expect(parfRebate(200_000, 3, 'pre2023')).toBe(150_000);
    expect(parfRebate(200_000, 3, 'cap60k')).toBe(60_000);
    expect(parfRebate(200_000, 3, 'budget2026')).toBe(30_000);
  });
  it('picks the regime from the registration date', () => {
    expect(parfRegimeFor('2020-01-01')).toBe('pre2023');
    expect(parfRegimeFor('2024-06-01')).toBe('cap60k');
    expect(parfRegimeFor('2026-06-01')).toBe('budget2026');
  });
  it('pro-rates the COE rebate by months left', () => {
    expect(coeRebate(120_000, 60)).toBe(60_000);
    expect(coeRebate(120_000, 0)).toBe(0);
    expect(monthsBetween('2019-06-01', '2026-05-31')).toBe(83);
  });
});

describe('loans', () => {
  it('applies the MAS loan-to-value limits', () => {
    expect(maxLoan(100_000, 20_000).amount).toBe(70_000);
    expect(maxLoan(100_000, 20_001).amount).toBe(60_000);
  });
  it('converts a flat rate to its effective rate', () => {
    const l = flatRateLoan(100_000, 2.5, 7);
    expect(l.totalInterest).toBe(17_500);
    expect(l.monthly).toBeCloseTo(1398.81, 2);
    expect(l.eir).toBeCloseTo(4.79, 2);
  });
  it('front-loads interest when settling early (Rule of 78)', () => {
    const l = flatRateLoan(84_000, 2.5, 7);
    const half = earlySettlement(l, 42, 0);
    // Rule of 78 keeps more than half the interest after half the term
    expect(half.interestPaid).toBeGreaterThan(l.totalInterest / 2);
    expect(earlySettlement(l, 84).settleAmount).toBe(0);
  });
});

describe('depreciation', () => {
  it('uses the value at COE expiry for new cars', () => {
    const d = newCarDepreciation({ price: 150_000, arfPaid: 34_000, coePaid: 131_890, regime: 'budget2026' });
    expect(d.residual).toBe(1_700);
    expect(d.annual).toBe(14_830);
    expect(d.schedule).toHaveLength(10);
    expect(d.schedule[9].marketValue).toBe(1_700);
    expect(d.schedule[4].paperValue).toBe(10_200 + 65_945);
  });
  it('matches the listing-site formula for used cars', () => {
    const u = usedCarDepreciation({
      price: 60_000,
      regDate: '2019-06-01',
      coeExpiry: '2029-06-01',
      arfPaid: 30_000,
      coePaid: 40_000,
      coeRenewed: false,
      today: '2026-06-01',
    });
    expect(u.residual).toBe(15_000);
    expect(u.annual).toBe(15_000);
    expect(u.paperValueToday).toBe(19_500 + 12_000);
    expect(u.premiumOverPaper).toBe(28_500);
    expect(u.schedule).toHaveLength(3);
    expect(u.schedule[2].marketValue).toBe(15_000);
  });
  it('treats renewed-COE cars as worth nothing at expiry', () => {
    const u = usedCarDepreciation({
      price: 30_000,
      regDate: '2014-01-01',
      coeExpiry: '2029-01-01',
      arfPaid: 30_000,
      coePaid: 50_000,
      coeRenewed: true,
      renewalYears: 5,
      today: '2026-01-01',
    });
    expect(u.residual).toBe(0);
    expect(u.annual).toBe(10_000);
    expect(u.paperValueToday).toBe(30_000); // 36 of 60 months of $50k left
  });
});

describe('running costs', () => {
  const prof = { ncdPct: 0, driverAge: 35, yearsLicensed: 10, engineCc: 0, powerKW: 0 };
  it('rates off OMV, with the rate falling as the car gets dearer', () => {
    expect(insuranceRatePct(12_000)).toBe(12);
    expect(insuranceRatePct(22_000)).toBe(10.5);
    expect(insuranceRatePct(35_000)).toBe(9);
    expect(insuranceRatePct(50_000)).toBe(8);
    expect(insuranceRatePct(120_000)).toBe(7);
    // Cheap car, high percentage: 12% of a $10k OMV falls below the floor
    expect(estimateInsurance({ ...prof, omv: 10_000 })).toBe(INSURANCE_FLOOR);
    // Straight percentage: 10.5% of a $22k OMV
    expect(estimateInsurance({ ...prof, omv: 22_000 })).toBe(2_310);
    // Dear car, low percentage: 7% of a $100k OMV is far more in absolute terms
    expect(estimateInsurance({ ...prof, omv: 100_000 })).toBe(INSURANCE_CEILING);
  });
  it('loads for engine size, power and driver, then discounts for NCD', () => {
    const base = estimateInsurance({ ...prof, omv: 30_000 });
    expect(estimateInsurance({ ...prof, omv: 30_000, engineCc: 2_400 })).toBeGreaterThan(base);
    expect(estimateInsurance({ ...prof, omv: 30_000, powerKW: 200 })).toBeGreaterThan(base);
    expect(estimateInsurance({ ...prof, omv: 30_000, driverAge: 23 })).toBeGreaterThan(base);
    expect(estimateInsurance({ ...prof, omv: 30_000, yearsLicensed: 1 })).toBeGreaterThan(base);
    expect(estimateInsurance({ ...prof, omv: 30_000, ncdPct: 50 })).toBeLessThan(base);
  });
  it('clamps to the market floor and ceiling', () => {
    // A $1 OMV with a 50% NCD would otherwise fall through the floor
    expect(estimateInsurance({ ...prof, omv: 1_000, ncdPct: 50 })).toBe(INSURANCE_FLOOR);
    // A supercar OMV is still capped
    expect(estimateInsurance({ ...prof, omv: 400_000, engineCc: 6_000, powerKW: 500 })).toBe(INSURANCE_CEILING);
  });
  it('totals yearly running costs', () => {
    const r = runningCostsPerYear({
      fuel: 'petrol', kmPerYear: 10_000, litresPer100km: 7, petrolPerLitre: 3,
      kWhPer100km: 15, electricityPerKWh: 0.5, parkingPerMonth: 100, erpPerMonth: 50,
      servicingPerYear: 1_000, insurancePerYear: 1_500, roadTaxPerYear: 742,
    });
    expect(r.energy).toBe(2_100);
    expect(r.total).toBe(2_100 + 1_200 + 600 + 1_000 + 1_500 + 742);
  });
});

describe('insurance, worked from a real policy', () => {
  // A real quote: $2,400/yr, 50% NCD, 5% safe-driver discount, $2,000 excess.
  const REAL = { premium: 2400, ncdPct: 50, otherDiscountPct: 5 };

  it('recovers the premium before NCD and other discounts', () => {
    const gross = grossPremium(REAL);
    // 2400 / (0.50 x 0.95)
    expect(gross).toBeCloseTo(5052.63, 2);
    // Re-pricing the gross at each NCD band, with the 5% discount, lands on
    // the quoted premium and doubles it at 0% NCD.
    expect(premiumAtNcd(gross, 50) * 0.95).toBeCloseTo(2400, 1);
    expect(premiumAtNcd(gross, 40) * 0.95).toBeCloseTo(2880, 1);
    expect(premiumAtNcd(gross, 0) * 0.95).toBeCloseTo(4800, 1);
  });

  it('shows what losing the NCD would cost each year, permanently', () => {
    expect(premiumWithoutNcd(REAL)).toBe(4800);
    // 50% -> 40% is a 480/yr rise, forever.
    const lost = grossPremium(REAL) * 0.10 * 0.95;
    expect(lost).toBeCloseTo(480, 2);
  });

  it('prices a claim as excess plus the permanent loss of the NCD', () => {
    const c = costOfClaim({
      damage: 8000,
      excess: 2000,
      premium: 2400,
      ncdPct: 50,
      otherDiscountPct: 5,
      ncdLostPct: 50,
      yearsOwned: 5,
    });
    // You hand over the $2,000 excess once.
    expect(c.excessPaid).toBe(2000);
    // The NCD loss is $2,400/yr for 5 years.
    expect(c.annualNcdCost).toBeCloseTo(2400, 1);
    expect(c.ncdCostOverYears).toBeCloseTo(12000, 0);
    // Fixing it yourself: $8,000, and you keep the NCD.
    expect(c.selfPayCost).toBe(8000);
    // Claiming: $2,000 excess + $12,000 of lost NCD = $14,000. You pay $6,000
    // MORE to hand a claim you did not need to make.
    expect(c.claimCost).toBeCloseTo(14000, 0);
    expect(c.claimOverhead).toBeCloseTo(6000, 0);
    expect(c.multiplesOfDamage).toBeCloseTo(1.75, 2);
    expect(c.worthClaiming).toBe(false);
  });

  it('rewards a claim when the damage is large and the NCD loss is modest', () => {
    // Damage well above the excess, on a car insured at $4,800/yr with 20% NCD.
    const c = costOfClaim({
      damage: 8000, excess: 2000, premium: 4800, ncdPct: 20,
      otherDiscountPct: 5, ncdLostPct: 10, yearsOwned: 5,
    });
    // Gross is 4,800 / (0.80 x 0.95) = 6,315.79; losing 10 points costs $600/yr.
    expect(c.annualNcdCost).toBeCloseTo(600, 0);
    // Claim: $2,000 excess + $3,000 lost NCD = $5,000, against $8,000 to fix it
    // yourself. Worth claiming, and $3,000 better than paying the shop.
    expect(c.claimCost).toBeCloseTo(5000, 0);
    expect(c.claimOverhead).toBeCloseTo(-3000, 0);
    expect(c.worthClaiming).toBe(true);
  });

  it('refuses to encourage a claim that costs more than the damage', () => {
    // A $900 scrape on a car with a full 50% NCD. Claiming costs the excess
    // plus five years of lost discount, so paying the shop is cheaper. The
    // function must report that rather than assuming a claim is free money.
    const c = costOfClaim({
      damage: 900, excess: 2000, premium: 2400, ncdPct: 50,
      otherDiscountPct: 5, ncdLostPct: 20, yearsOwned: 5,
    });
    expect(c.excessPaid).toBe(900);
    expect(c.annualNcdCost).toBeCloseTo(960, 0);
    expect(c.ncdCostOverYears).toBeCloseTo(4800, 0);
    expect(c.claimCost).toBeCloseTo(5700, 0);
    expect(c.claimOverhead).toBeCloseTo(4800, 0);
    expect(c.worthClaiming).toBe(false);
  });

  it('never charges more excess than the damage', () => {
    const c = costOfClaim({ damage: 500, excess: 2000, premium: 2400, ncdPct: 50, ncdLostPct: 50, yearsOwned: 5 });
    expect(c.excessPaid).toBe(500);
  });

  it('handles a car with no NCD gracefully', () => {
    const c = costOfClaim({ damage: 5000, excess: 2000, premium: 5000, ncdPct: 0, ncdLostPct: 0, yearsOwned: 5 });
    expect(c.annualNcdCost).toBe(0);
    expect(c.claimCost).toBe(2000);
    expect(c.worthClaiming).toBe(true);
    expect(grossPremium({ premium: 5000, ncdPct: 0 })).toBe(5000);
  });

  it('defaults the theft excess to 10% of value, which is usually the bigger number', () => {
    const b = breakdownOfExcess({ damageExcess: 2000, omv: 22000 });
    expect(b.theftExcess).toBe(2200);
    expect(b.worstCaseExcess).toBe(2200);
    expect(b.worstCasePctOfValue).toBe(10);
    expect(b.totalLossPayout).toBe(19800);
  });

  it('uses whichever excess is larger, and can be told a higher theft rate', () => {
    const b = breakdownOfExcess({ damageExcess: 5000, omv: 10000, theftPct: 0.2 });
    expect(b.theftExcess).toBe(2000);
    expect(b.worstCaseExcess).toBe(5000);
  });
});

describe('loan amount input', () => {
  const cap = (omv: number) => maxLoan(200_000, omv);
  const withLoan = (over: Partial<CalcState>) => ({ ...CALC_DEFAULTS, dealerPrice: 200_000, ...over });

  it('derives the loan from the percentage when that is the active input', () => {
    const s = withLoan({ loanInput: 'pct', loanPct: 60 });
    const r = resolveLoan(s, cap(30_000)); // OMV > 20k, so 60% LTV
    expect(r.loanAmount).toBe(120_000);
    expect(r.loanPct).toBe(60);
    expect(r.overCap).toBe(false);
  });

  it('uses the dollar amount when that is the active input', () => {
    const s = withLoan({ loanInput: 'amount', loanPct: 60, loanAmountOverride: 95_000 });
    const r = resolveLoan(s, cap(30_000));
    expect(r.loanAmount).toBe(95_000);
    // Reported back as the percentage it works out to
    expect(r.loanPct).toBe(48);
  });

  it('never lends more than MAS allows, and says so', () => {
    // 70% LTV for OMV under $20k = $140,000 cap
    const s = withLoan({ loanInput: 'amount', loanAmountOverride: 175_000 });
    const r = resolveLoan(s, cap(15_000));
    expect(r.loanAmount).toBe(140_000);
    expect(r.overCap).toBe(true);
  });

  it('caps a percentage dragged past the LTV limit', () => {
    const s = withLoan({ loanInput: 'pct', loanPct: 95 });
    const r = resolveLoan(s, cap(15_000));
    expect(r.loanAmount).toBe(140_000);
    expect(r.overCap).toBe(false); // the slider can't exceed the cap, so nothing to flag
  });

  it('handles zero and negative amounts without producing a negative loan', () => {
    expect(resolveLoan(withLoan({ loanInput: 'amount', loanAmountOverride: 0 }), cap(30_000)).loanAmount).toBe(0);
    expect(resolveLoan(withLoan({ loanInput: 'amount', loanAmountOverride: -5_000 }), cap(30_000)).loanAmount).toBe(0);
  });
});

describe('deal decoder', () => {
  const base: DealQuote = {
    packagePrice: 150_000, omv: 30_000, coeGuaranteed: false, bidsIncluded: 2,
    coeInPackage: 120_000, coeLatest: 131_890, topUpPaidBy: 'buyer', extraFees: 2_000,
    freebies: [{ name: 'Tint', statedValue: 1_500, wanted: false }],
    loanAmount: 100_000, loanFlatRate: 3.28, loanYears: 7, loanTiedDiscount: 2_000, marketFlatRate: 2.5,
    insuranceRequired: true, insuranceYears: 3, insurancePremium: 2_400, insuranceEstimate: 1_500,
    tradeInOffer: 20_000, tradeInPaperValue: 25_000, depositRefundable: false,
  };
  it('flags the classic traps', () => {
    const titles = decodeDeal(base).flags.map((f) => f.title);
    expect(titles.some((t) => t.startsWith('COE top-up risk'))).toBe(true);
    expect(titles).toContain('Loan is above the legal limit');
    expect(titles).toContain('The "loan discount" costs you more than it saves');
    expect(titles).toContain('Bundled insurance looks expensive');
    expect(titles).toContain('Trade-in offer is below paper value');
    expect(titles).toContain('Deposit is not refundable');
  });
  it('totals the real outlay', () => {
    const r = decodeDeal(base);
    expect(r.allInPrice).toBe(152_000);
    expect(r.interest).toBe(22_960);
    expect(r.totalOutlay).toBe(152_000 + 22_960 + 7_200 - 20_000);
  });
});
