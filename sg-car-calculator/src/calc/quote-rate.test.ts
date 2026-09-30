import { describe, expect, it } from 'vitest';
import { compareQuotes, grossOf, netOf, MARKET_PREMIUM_PCT, type Quote, type CarContext } from './quote-rate';

/**
 * The real policy: $2,400/yr, 50% NCD, 5% safe-driver discount, $2,000 excess.
 * Its gross rate is $5,052.63, which is the number every other quote is
 * measured against.
 */
const CAR: CarContext = { omv: 22_000, keepYears: 5, marketValue: 22_000 };

const mine: Quote = {
  id: 'mine',
  insurer: 'My policy',
  premium: 2400,
  premiumIsNet: true,
  ncdPct: 50,
  otherDiscountPct: 5,
  excess: 2000,
  theftExcessPct: 10,
  lockedYears: 1,
  sumInsured: 22_000,
};

describe('restating a quote onto a common basis', () => {
  it('recovers the rate before discounts', () => {
    expect(grossOf(mine)).toBeCloseTo(5052.63, 2);
    expect(netOf(mine)).toBe(2400);
  });

  it('handles a quote that quotes the gross rate', () => {
    const gross = { ...mine, premium: 5052.63, premiumIsNet: false };
    // Same policy, quoted the other way round. It must score identically,
    // otherwise the ranking depends on how the insurer chose to write it.
    expect(netOf(gross)).toBeCloseTo(2400, 2);
    expect(grossOf(gross)).toBeCloseTo(5052.63, 2);
  });

  it('treats a zero NCD as no discount rather than dividing by zero', () => {
    const fresh = { ...mine, premium: 3000, ncdPct: 0, otherDiscountPct: 0 };
    expect(grossOf(fresh)).toBe(3000);
  });
});

describe('ranking does not reward a disguised quote', () => {
  // The trap: Quote B stacks the driver's NCD with a 30% loyalty discount and
  // quotes only the net figure, so it hands back the lowest premium in the
  // field. Worked back, its actual rate is the highest of the three: the
  // discount is doing all the work. Ranking on the quoted premium puts it first.
  const greedy: Quote = {
    id: 'b',
    insurer: 'Insurer B',
    premium: 1900,
    premiumIsNet: true,
    ncdPct: 50,
    otherDiscountPct: 30,
    excess: 2000,
    theftExcessPct: 10,
    lockedYears: 3,
    sumInsured: 22_000,
  };

  // A genuinely cheaper policy, priced on a thinner discount.
  const fair: Quote = {
    id: 'c',
    insurer: 'Insurer C',
    premium: 4200,
    premiumIsNet: false,
    ncdPct: 20,
    otherDiscountPct: 0,
    excess: 1500,
    theftExcessPct: 10,
    lockedYears: 1,
    sumInsured: 22_000,
  };

  it('ranks on the gross rate, not the premium you are handed', () => {
    const r = compareQuotes([greedy, fair, mine], CAR);
    // Greedy quotes the lowest net premium (1,900) but the highest gross.
    expect(netOf(greedy)).toBeLessThan(netOf(mine));
    // 1,900 / (0.50 x 0.70) = 5,428.57, the highest rate in the field.
    expect(grossOf(greedy)).toBeGreaterThan(grossOf(fair));
    expect(grossOf(greedy)).toBeGreaterThan(grossOf(mine));
    expect(r.ranked[0].quote.id).toBe('c');
    expect(r.ranked[r.ranked.length - 1].quote.id).toBe('b');
  });

  it('says why the cheapest-looking quote is not the cheapest', () => {
    const r = compareQuotes([greedy, fair, mine], CAR);
    const greedyScore = r.ranked.find((s) => s.quote.id === 'b')!;
    expect(greedyScore.flags).toContain('expensive');
    expect(r.finding).toMatch(/discount is doing the work|highest in the field/);
  });

  it('flags a quote that buys its low rate with a longer lock-in', () => {
    const r = compareQuotes([greedy, fair, mine], CAR);
    const greedyScore = r.ranked.find((s) => s.quote.id === 'b')!;
    expect(greedyScore.flags).toContain('long-lock');
    // Three years locked, but the car is kept for five: real lock-in exposure.
    expect(greedyScore.quote.lockedYears).toBeLessThan(CAR.keepYears);
  });

  it('prices lock-in against what shopping around would have cost', () => {
    const r = compareQuotes([greedy, fair, mine], CAR);
    const greedyScore = r.ranked.find((s) => s.quote.id === 'b')!;
    // 1,900 x 3 years, against 10.5% of 22,000 x 3 years if you were free
    // to shop at renewal.
    expect(greedyScore.termCost).toBe(5700);
    expect(greedyScore.unlockedCost).toBeCloseTo(CAR.marketValue * MARKET_PREMIUM_PCT * 3, 0);
  });
});

describe('excess compared as a share of value, not a raw number', () => {
  it('sees the same excess as very different on different cars', () => {
    const quote: Quote = { ...mine, excess: 2000 };
    const onSmallCar = compareQuotes([quote], { omv: 12_000, keepYears: 5, marketValue: 12_000 });
    const onBigCar = compareQuotes([quote], { omv: 60_000, keepYears: 5, marketValue: 60_000 });
    const small = onSmallCar.ranked[0].excessPctOfValue;
    const big = onBigCar.ranked[0].excessPctOfValue;
    expect(small).toBeCloseTo(2000 / 12_000 * 100, 0);
    expect(big).toBeCloseTo(2000 / 60_000 * 100, 0);
    // A $2,000 excess is 17% of a $12,000 car: genuinely high.
    expect(onSmallCar.ranked[0].flags).toContain('high-excess');
    // On a $60,000 car it is 3%: not worth flagging.
    expect(onBigCar.ranked[0].flags).not.toContain('high-excess');
  });
});

describe('term and lock-in', () => {
  it('flags a term that outlasts the car', () => {
    const longTerm: Quote = { ...mine, lockedYears: 7 };
    const r = compareQuotes([longTerm, mine], CAR);
    const s = r.ranked.find((x) => x.quote.id === 'mine' && x.quote.lockedYears === 7)!;
    expect(s.flags).toContain('outlives-car');
  });

  it('does not recommend a quote that under-insures the car', () => {
    const under: Quote = { ...mine, premium: 1500, sumInsured: 15_000 };
    const fair: Quote = { ...mine, premium: 3000, sumInsured: 22_000 };
    const r = compareQuotes([under, fair], CAR);
    const underScore = r.ranked.find((s) => s.quote.id === 'mine')!;
    expect(underScore.flags).toContain('underinsured');
    // Cheaper on premium, but it will not be the recommendation.
    expect(r.best!.quote.sumInsured).toBe(22_000);
  });

  it('treats cover within 10% of value as adequately insured', () => {
    const slightlyUnder: Quote = { ...mine, sumInsured: 20_500 }; // 93% of 22,000
    const r = compareQuotes([slightlyUnder], CAR);
    expect(r.ranked[0].flags).not.toContain('underinsured');
  });
});

describe('excess buy-down arithmetic', () => {
  it('rejects a buy-down that costs more than the excess it removes', () => {
    // $800 a year to halve a $2,000 excess is $4,000 over five years to save
    // $1,000. Not worth it.
    const pricey: Quote = {
      ...mine,
      lockedYears: 5,
      excessBuyDown: { excess: 1000, extraPremium: 800 },
    };
    const r = compareQuotes([pricey], CAR);
    expect(r.ranked[0].buyDown!.costToSave).toBe(4000);
    expect(r.ranked[0].buyDown!.worthIt).toBe(false);
  });

  it('accepts a cheap buy-down on a high excess', () => {
    const cheap: Quote = {
      ...mine,
      lockedYears: 5,
      excess: 6000,
      excessBuyDown: { excess: 1000, extraPremium: 150 },
    };
    const r = compareQuotes([cheap], CAR);
    // $750 over five years to remove $5,000 of exposure. Worth it.
    expect(r.ranked[0].buyDown!.worthIt).toBe(true);
  });
});

describe('questions to ask', () => {
  it('always asks the three that decide the price', () => {
    const r = compareQuotes([mine], CAR);
    expect(r.questions.length).toBeGreaterThanOrEqual(3);
    expect(r.questions[0]).toMatch(/before or after NCD/);
    expect(r.questions[1]).toMatch(/theft and total loss/);
    expect(r.questions[2]).toMatch(/NCD after one claim/);
  });

  it('adds a question when a term outlasts the car', () => {
    const longTerm: Quote = { ...mine, lockedYears: 7 };
    const r = compareQuotes([longTerm], CAR);
    expect(r.questions.some((q) => /guaranteed, or can it be reviewed/.test(q))).toBe(true);
  });

  it('adds a question when there are bundled extras', () => {
    const bundled: Quote = { ...mine, extras: [{ name: 'Roadside assistance', annualCost: 120 }] };
    const r = compareQuotes([bundled], CAR);
    expect(r.ranked[0].extrasAnnual).toBe(120);
    expect(r.questions.some((q) => /bundled items/.test(q))).toBe(true);
  });
});

describe('a single quote is never treated as a verdict', () => {
  it('tells you to get a second quote', () => {
    const r = compareQuotes([mine], CAR);
    expect(r.finding).toMatch(/get a second/i);
    expect(r.ranked[0].verdict).not.toMatch(/best/i);
  });
});
