import { describe, expect, it } from 'vitest';
import { arfPayable, grossArf, priceBreakdown, roadTaxPerYear } from './tax';
import { coeRebate, monthsBetween, parfRebate, parfRegimeFor } from './rebates';
import { earlySettlement, flatRateLoan, maxLoan } from './loan';
import { newCarDepreciation, usedCarDepreciation } from './depreciation';
import { estimateInsurance, runningCostsPerYear } from './running';
import { decodeDeal, type DealQuote } from './deal';

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
  it('estimates insurance with NCD', () => {
    expect(estimateInsurance({ category: 'A', ncdPct: 50, driverAge: 35, yearsLicensed: 10, carValue: 150_000 })).toBe(1_200);
    expect(estimateInsurance({ category: 'A', ncdPct: 0, driverAge: 23, yearsLicensed: 1, carValue: 150_000 })).toBe(4_210);
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
