/**
 * Comparing insurance quotes on the terms, not just the premium.
 *
 * Two quotes for the same car can differ by thousands and still be identical
 * in substance. The premium is the one number an insurer advertises, so
 * ranking on it alone rewards the policy that games the headline: lock you in
 * for three years, price theft at 20% excess, make you the second driver, and
 * put $1,000 of "processing fee" on top.
 *
 * So each quote is restated on a common basis before ranking:
 *
 *  - The NCD and any other discount are stripped out, because those belong to
 *    you, not to the policy. A quote that only looks cheap because it applied
 *    your 50% NCD is not a cheaper policy.
 *  - Excess is compared as a share of what the car is worth, because $2,000 on
 *    a $60,000 car and $2,000 on a $18,000 car are not the same exposure.
 *  - Per-term cost multiplies out the years, because a cheaper premium locked
 *    for five years is not cheaper if it outlasts the car.
 *  - Lock-in is priced in as a real cost, since you cannot shop around until
 *    renewal.
 *
 * The aim is not to pick a winner mechanically. It is to make the trade-offs
 * legible: what you are actually paying for, what you are locked into, and
 * what the fine print costs if something goes wrong.
 */

/** One insurer's offer, as quoted. */
export interface Quote {
  /** Stable id for React keys. */
  id: string;
  insurer: string;
  /** Annual premium, before discounts. Some quotes quote net, some gross. */
  premium: number;
  /** Does the quoted premium already include NCD and other discounts? */
  premiumIsNet: boolean;
  ncdPct: number;
  /** Loyalty, safe-driver, age or bundle discounts, summed. */
  otherDiscountPct: number;
  /** Excess on a damage claim, in dollars. */
  excess: number;
  /** Theft and total-loss excess, as a percentage of the car's value. */
  theftExcessPct: number;
  /** Is the premium fixed for this many years? */
  lockedYears: number;
  /** Optional: an excess you can buy down, and what it costs per year. */
  excessBuyDown?: { excess: number; extraPremium: number };
  /**
   * Optional: the sum insured. Insurers usually offer market value, but some
   * quote below it. Below about 90% of what the car is worth, a total loss
   * would leave a real gap.
   */
  sumInsured?: number;
  /** Optional extras that cost money and are not obviously worth it. */
  extras?: { name: string; annualCost: number }[];
}

export interface CarContext {
  omv: number;
  /** How long you actually keep the car. Drives whether lock-in matters. */
  keepYears: number;
  /** What the car is worth if you write it off, for the sum-insured check. */
  marketValue: number;
}

export type QuoteFlag =
  /** Costs more per year of cover than the cheapest quote. */
  | 'expensive'
  /** Cheapest per year, but only by taking a worse excess or a shorter term. */
  | 'cheap-for-a-reason'
  /** Locked well past the point where you could have shopped around. */
  | 'long-lock'
  /** Lock-in costs materially more than shopping around would have. */
  | 'lock-in-penalty'
  /** Excess is high relative to the car's value. */
  | 'high-excess'
  /** Sum insured is below the car's likely market value. */
  | 'underinsured'
  /** Buys down the excess, and the arithmetic is worth checking. */
  | 'excess-buydown'
  /** Bundles insurance you may not want at a price you would not pay. */
  | 'extras'
  /** Locked, and you will not still own the car when it ends. */
  | 'outlives-car';

/** The restated basis, and what the restatement revealed. */
export interface ScoredQuote {
  quote: Quote;
  /** Premium per year with no NCD and no other discount applied. */
  grossPremium: number;
  /** What you actually pay this year. */
  netPremium: number;
  /** Discount earned, as an amount and a percentage. */
  discountEarned: number;
  discountPct: number;
  /** Excess as a share of the car's value. The comparable number. */
  excessPctOfValue: number;
  /** Premium as a share of the car's value. */
  premiumPctOfValue: number;
  /** Premium multiplied by the locked term, for the true cost of the term. */
  termCost: number;
  /** What the same policy would have cost unlocked, using a market premium. */
  unlockedCost: number;
  /** Cost of being locked in, if positive. */
  lockInPenalty: number;
  /** Sum insured, if quoted. */
  sumInsured?: number;
  /** Whether the sum insured is under the car's likely value. */
  underinsured: boolean;
  /** The cheapest excess buy-down on offer, and its cost. */
  buyDown?: { excess: number; extraPremium: number; costToSave: number; worthIt: boolean };
  /** Total of the extras, per year. */
  extrasAnnual: number;
  extrasWorthIt: boolean;
  flags: QuoteFlag[];
  /** A one-line verdict. */
  verdict: string;
  /** The single most important thing about this quote. */
  headline: string;
}

export interface QuoteComparison {
  /** Ranked cheapest-first on gross premium, then by term cost. */
  ranked: ScoredQuote[];
  /** The one worth taking, if any is clearly better. */
  best?: ScoredQuote;
  /** The cheapest headline premium, which is often not the best value. */
  cheapestHeadline?: ScoredQuote;
  /** The worst headline premium, which is often not the worst value. */
  dearestHeadline?: ScoredQuote;
  /** The most important thing to know across all quotes. */
  finding: string;
  /** What to ask before signing any of them. */
  questions: string[];
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Dollars, for the verdict strings this module writes. */
const money = (n: number) => `$${Math.round(n).toLocaleString('en-SG')}`;

/** What an unlocked policy would cost, as a share of the car's value. */
export const MARKET_PREMIUM_PCT = 0.105;

/** Locking in beyond this many years is treated as an over-commitment. */
const LONG_LOCK_YEARS = 3;

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * Undo the discounts to find the rate the insurer actually charges.
 *
 * Insurers usually quote the discounted figure, because that is the number
 * that wins the comparison. Working back to the gross rate is what lets two
 * quotes be compared at all.
 */
export function grossOf(q: Quote): number {
  // premiumIsNet means the insurer quoted the discounted figure, which is the
  // case that needs working back to the rate they actually charge.
  if (!q.premiumIsNet) return round(q.premium);
  const factor = (1 - clampPct(q.ncdPct) / 100) * (1 - clampPct(q.otherDiscountPct) / 100);
  if (factor <= 0) return round(q.premium);
  return round(q.premium / factor);
}

/** What you pay this year, given whether the quote is already discounted. */
export function netOf(q: Quote): number {
  if (q.premiumIsNet) return round(q.premium);
  return round(q.premium * (1 - clampPct(q.ncdPct) / 100) * (1 - clampPct(q.otherDiscountPct) / 100));
}

function scoreQuote(q: Quote, car: CarContext): ScoredQuote {
  const grossPremium = grossOf(q);
  const netPremium = netOf(q);
  const discountEarned = round(grossPremium - netPremium);
  const discountPct = grossPremium > 0 ? (discountEarned / grossPremium) * 100 : 0;

  // Excess and premium are both measured against what the car is worth, so a
  // small car and a big car can be compared on the same footing.
  const value = Math.max(1, car.marketValue || car.omv);
  const excessPctOfValue = (q.excess / value) * 100;
  const premiumPctOfValue = (netPremium / value) * 100;

  // What the term costs in total, and what the same cover would have cost if
  // you were free to shop around at renewal.
  const years = Math.max(1, q.lockedYears);
  const termCost = round(netPremium * years);
  const unlockedCost = round(value * MARKET_PREMIUM_PCT * years);
  const lockInPenalty = Math.max(0, round(termCost - unlockedCost));

  // Lock-in is only a real cost if you would still own the car when it ends.
  const outlivesCar = years > car.keepYears;

  const sumInsured = q.sumInsured != null ? round(q.sumInsured) : undefined;
  const underinsured = sumInsured != null && sumInsured < value * 0.9;

  // Working out whether buying down the excess pays. The saving is the
  // difference in excess, capped at the damage you are actually likely to
  // have; the cost is the extra premium over the term.
  let buyDown: ScoredQuote['buyDown'];
  if (q.excessBuyDown && q.excessBuyDown.excess < q.excess) {
    const savingPerClaim = q.excess - q.excessBuyDown.excess;
    // Assume one mid-sized claim over the term, which is the ordinary case.
    const costToSave = round(q.excessBuyDown.extraPremium * years);
    const likelySaving = savingPerClaim * Math.min(1, years / 5);
    buyDown = {
      excess: q.excessBuyDown.excess,
      extraPremium: q.excessBuyDown.extraPremium,
      costToSave,
      worthIt: likelySaving > costToSave,
    };
  }

  const extrasAnnual = round((q.extras ?? []).reduce((t, e) => t + e.annualCost, 0));
  const extrasWorthIt = false; // Extras are priced above what they cost to buy alone.

  const flags: QuoteFlag[] = [];
  if (excessPctOfValue > 12) flags.push('high-excess');
  if (years > car.keepYears) flags.push('outlives-car');
  if (years >= LONG_LOCK_YEARS) flags.push('long-lock');
  if (lockInPenalty > netPremium * 0.5) flags.push('lock-in-penalty');
  if (underinsured) flags.push('underinsured');
  if (buyDown) flags.push('excess-buydown');
  if (extrasAnnual > 0) flags.push('extras');

  const headline = buildHeadline(q, car, { grossPremium, excessPctOfValue, years, outlivesCar, underinsured, sumInsured });
  return {
    quote: q,
    grossPremium,
    netPremium,
    discountEarned,
    discountPct,
    excessPctOfValue,
    premiumPctOfValue,
    termCost,
    unlockedCost,
    lockInPenalty,
    sumInsured,
    underinsured,
    buyDown,
    extrasAnnual,
    extrasWorthIt,
    flags,
    verdict: '',
    headline,
  };
}

function buildHeadline(
  q: Quote,
  car: CarContext,
  v: { grossPremium: number; excessPctOfValue: number; years: number; outlivesCar: boolean; underinsured: boolean; sumInsured?: number },
): string {
  if (v.underinsured) {
    return `Insured for ${money(v.sumInsured ?? 0)} when the car is worth ${money(car.marketValue || car.omv)}. A total loss would leave you the difference.`;
  }
  if (v.outlivesCar) {
    return `Locked for ${q.lockedYears} years, but you only keep the car ${car.keepYears}. You would pay for cover you never use.`;
  }
  if (v.excessPctOfValue > 12) {
    return `A ${money(q.excess)} excess is a large share of what the car is worth.`;
  }
  return `${money(v.grossPremium)} before your discounts, on a ${q.lockedYears}-year term.`;
}

export function compareQuotes(quotes: Quote[], car: CarContext): QuoteComparison {
  if (quotes.length === 0) {
    return { ranked: [], finding: 'Add a quote to compare.', questions: [] };
  }

  const scored = quotes.map((q) => scoreQuote(q, car));

  // Rank on the gross rate, not the headline. A quote that only looks cheap
  // because it applied your NCD is not a cheaper policy, and ranking on net
  // would reward exactly that.
  scored.sort((a, b) => a.grossPremium - b.grossPremium || a.termCost - b.termCost);

  const cheapest = scored[0];
  const dearest = scored[scored.length - 1];
  const spread = dearest.grossPremium - cheapest.grossPremium;

  // The best quote is the cheapest gross rate, provided it is not buying that
  // with a materially worse excess or a term that outlives the car.
  let best: ScoredQuote | undefined;
  if (scored.length === 1) {
    best = scored[0];
  } else {
    const eligible = scored.filter((s) => !s.flags.includes('underinsured') && !s.flags.includes('outlives-car'));
    best = eligible.length > 0 ? eligible[0] : cheapest;
  }

  // Annotate the relative flags now that we know the field.
  for (const s of scored) {
    if (s !== cheapest && s.grossPremium > cheapest.grossPremium * 1.1) s.flags.push('expensive');
    if (s !== cheapest && s.grossPremium <= cheapest.grossPremium && (s.excessPctOfValue > cheapest.excessPctOfValue + 2 || s.quote.lockedYears > cheapest.quote.lockedYears + 1)) {
      s.flags.push('cheap-for-a-reason');
    }
    s.verdict = verdictFor(s, cheapest, spread, scored.length);
  }

  const finding = buildFinding(scored, cheapest, best, spread);
  const questions = buildQuestions(scored, car);

  return {
    ranked: scored,
    best,
    cheapestHeadline: cheapest,
    dearestHeadline: dearest,
    finding,
    questions,
  };
}

function verdictFor(s: ScoredQuote, cheapest: ScoredQuote, spread: number, fieldSize: number): string {
  if (fieldSize === 1) {
    return 'Only quote so far. Nothing to compare it against yet.';
  }
  if (s === cheapest) {
    return spread > s.grossPremium * 0.15
      ? 'Best rate. The gap to the others is wide enough to matter.'
      : 'Best rate, but the field is close — read the terms before deciding.';
  }
  if (s.grossPremium > cheapest.grossPremium * 1.15) {
    return 'Costs materially more for the same cover. Only worth it for the terms, not the price.';
  }
  const reasons: string[] = [];
  if (s.excessPctOfValue > cheapest.excessPctOfValue + 2) reasons.push('a higher excess');
  if (s.quote.lockedYears > cheapest.quote.lockedYears) reasons.push('a longer lock-in');
  if (s.underinsured) reasons.push('under-insuring the car');
  if (reasons.length > 0) return `Cheaper on paper, but ${reasons.join(' and ')}.`;
  return 'About the same as the best rate. Decide on the terms.';
}

function buildFinding(scored: ScoredQuote[], cheapest: ScoredQuote, best: ScoredQuote | undefined, spread: number): string {
  if (scored.length === 1) {
    return `One quote at ${cheapest.grossPremium.toLocaleString('en-SG')} before discounts. Get a second before accepting — insurers price off OMV, age and your record, and the spread between quotes is often 20% or more.`;
  }

  // The most useful single insight: how much of the ranking is a discount
  // artefact rather than a real rate difference.
  const artefact = scored.find((s) => s !== cheapest && s.quote.premiumIsNet && s.netPremium < cheapest.netPremium && s.grossPremium > cheapest.grossPremium);
  if (artefact) {
    return `${artefact.quote.insurer} quotes the lowest premium you will actually pay (${artefact.netPremium.toLocaleString('en-SG')}), but its rate before your ${artefact.quote.ncdPct}% NCD is ${artefact.grossPremium.toLocaleString('en-SG')} — the highest in the field. The discount is doing the work, not the price.`;
  }

  if (spread > cheapest.grossPremium * 0.2) {
    return `The field is ${spread.toLocaleString('en-SG')} wide before discounts, which is ${Math.round((spread / cheapest.grossPremium) * 100)}% of the best rate. That is a real difference in pricing, and it is not explained by the car.`;
  }

  if (best && best !== cheapest) {
    return `${best.quote.insurer} has the best rate, but ${cheapest.quote.insurer} quotes the lower premium you pay. The difference is the terms.`;
  }

  return `All quotes land within ${Math.round((spread / cheapest.grossPremium) * 100)}% of each other before discounts. Pick on terms: excess, lock-in, and what happens to your NCD.`;
}

function buildQuestions(scored: ScoredQuote[], car: CarContext): string[] {
  const qs: string[] = [
    'Is the quoted premium before or after NCD and other discounts? Most quotes are after.',
    'What is the excess for theft and total loss, as a percentage of the car’s value?',
    'What happens to my NCD after one claim — all of it, or part?',
  ];

  const longest = scored.reduce((a, b) => (a.quote.lockedYears >= b.quote.lockedYears ? a : b));
  if (longest.quote.lockedYears > car.keepYears) {
    qs.push(`Is the ${longest.quote.lockedYears}-year premium guaranteed, or can it be reviewed mid-term?`);
  }

  if (scored.some((s) => s.underinsured)) {
    qs.push('If the car is written off, does the payout use market value at the time, or the figure on my schedule?');
  }

  if (scored.some((s) => (s.quote.extras ?? []).length > 0)) {
    qs.push('What do these bundled items cost if I remove them? Do I lose any discount?');
  }

  return qs;
}
