import { LOAN_RULES } from './defaults';
import { flatRateLoan, maxLoan } from './loan';

export interface Freebie {
  name: string;
  statedValue: number;
  /** Would you have paid for this yourself? */
  wanted: boolean;
}

export interface DealQuote {
  packagePrice: number;
  omv: number;
  coeGuaranteed: boolean;
  /** Non-guaranteed deals: number of bidding exercises the dealer will try. */
  bidsIncluded: number;
  /** The COE figure the package is priced on. */
  coeInPackage: number;
  /** Latest COE result for the category. */
  coeLatest: number;
  /** Who pays if COE goes above coeInPackage. */
  topUpPaidBy: 'dealer' | 'buyer';

  extraFees: number; // admin, handling, number plate, "processing"
  freebies: Freebie[];

  loanAmount: number;
  loanFlatRate: number;
  loanYears: number;
  /** Price discount that only applies if you take the dealer's loan. */
  loanTiedDiscount: number;
  marketFlatRate: number;

  insuranceRequired: boolean;
  insuranceYears: number;
  insurancePremium: number;
  insuranceEstimate: number;

  tradeInOffer: number;
  tradeInPaperValue: number;

  depositRefundable: boolean;
}

export type Severity = 'danger' | 'warn' | 'info' | 'good';
export interface Flag {
  severity: Severity;
  title: string;
  detail: string;
}

export interface DealResult {
  /** Cash you actually hand over for the car, before financing. */
  allInPrice: number;
  interest: number;
  eir: number;
  monthly: number;
  /** Price + fees + interest + insurance lock-in − trade-in. */
  totalOutlay: number;
  freebiesStated: number;
  freebiesUseful: number;
  flags: Flag[];
}

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-SG');

export function decodeDeal(q: DealQuote): DealResult {
  const flags: Flag[] = [];
  const price = q.packagePrice + q.extraFees;
  const loan = flatRateLoan(q.loanAmount, q.loanFlatRate, q.loanYears);
  const bank = flatRateLoan(q.loanAmount, q.marketFlatRate, q.loanYears);
  const cap = maxLoan(q.packagePrice, q.omv);

  // COE
  const coeGap = q.coeLatest - q.coeInPackage;
  if (!q.coeGuaranteed) {
    if (q.topUpPaidBy === 'buyer' && coeGap > 0) {
      flags.push({
        severity: 'danger',
        title: `COE top-up risk: about ${money(coeGap)}`,
        detail: `The package assumes a COE of ${money(q.coeInPackage)} but the latest result is ${money(q.coeLatest)}. If the dealer's bid fails, you pay the difference.`,
      });
    } else if (q.topUpPaidBy === 'buyer') {
      flags.push({
        severity: 'warn',
        title: 'You carry the COE risk',
        detail: 'The COE is not guaranteed and any top-up is on you. COE can move by $10k+ in a single exercise.',
      });
    }
    if (q.bidsIncluded > 0 && q.bidsIncluded < 3) {
      flags.push({
        severity: 'warn',
        title: `Only ${q.bidsIncluded} bid${q.bidsIncluded > 1 ? 's' : ''} included`,
        detail: 'If the dealer fails to secure COE in these exercises, check whether you get your deposit back or must top up.',
      });
    }
  } else {
    flags.push({ severity: 'good', title: 'Guaranteed COE', detail: 'The price is fixed no matter what COE does.' });
  }

  // Financing
  if (q.loanAmount > 0) {
    if (q.loanAmount > cap.amount) {
      flags.push({
        severity: 'danger',
        title: 'Loan is above the legal limit',
        detail: `MAS caps car loans at ${Math.round(cap.ltv * 100)}% of the price (${money(cap.amount)}) for this OMV. A bigger "loan" usually means a second, pricier personal loan hidden in the deal.`,
      });
    }
    if (q.loanYears > LOAN_RULES.maxTenureYears) {
      flags.push({
        severity: 'danger',
        title: 'Loan is longer than 7 years',
        detail: 'MAS limits car loans to 7 years. Ask what the extra years are really financed with.',
      });
    }
    flags.push({
      severity: 'info',
      title: `${q.loanFlatRate}% flat is really ${loan.eir.toFixed(2)}% a year`,
      detail: `Flat rates charge interest on the full amount for the whole loan. You'd pay ${money(loan.totalInterest)} in interest.`,
    });
    const extraInterest = loan.totalInterest - bank.totalInterest;
    if (q.loanTiedDiscount > 0) {
      if (extraInterest > q.loanTiedDiscount) {
        flags.push({
          severity: 'danger',
          title: 'The "loan discount" costs you more than it saves',
          detail: `You save ${money(q.loanTiedDiscount)} on price but pay ${money(extraInterest)} more interest than at ${q.marketFlatRate}% flat.`,
        });
      } else {
        flags.push({
          severity: 'good',
          title: 'The loan-tied discount is worth it',
          detail: `You save ${money(q.loanTiedDiscount)} and pay only ${money(Math.max(0, extraInterest))} extra interest. You can often settle the loan early, but check the penalty.`,
        });
      }
    } else if (extraInterest > 500) {
      flags.push({
        severity: 'warn',
        title: `Dealer loan costs ${money(extraInterest)} more than the market`,
        detail: `At a typical ${q.marketFlatRate}% flat you'd pay ${money(bank.totalInterest)} in interest instead.`,
      });
    }
  }

  // Insurance
  const insuranceTotal = q.insuranceRequired ? q.insurancePremium * q.insuranceYears : 0;
  if (q.insuranceRequired && q.insuranceEstimate > 0 && q.insurancePremium > q.insuranceEstimate * 1.2) {
    flags.push({
      severity: 'warn',
      title: 'Bundled insurance looks expensive',
      detail: `${money(q.insurancePremium)}/yr is well above the ~${money(q.insuranceEstimate)} estimate. Over ${q.insuranceYears} years that's ${money((q.insurancePremium - q.insuranceEstimate) * q.insuranceYears)} extra. Get your own quotes.`,
    });
  }

  // Freebies
  const freebiesStated = q.freebies.reduce((a, f) => a + f.statedValue, 0);
  const freebiesUseful = q.freebies.filter((f) => f.wanted).reduce((a, f) => a + f.statedValue, 0);
  if (freebiesStated - freebiesUseful > 1000) {
    flags.push({
      severity: 'warn',
      title: `${money(freebiesStated - freebiesUseful)} of "free" items you don't need`,
      detail: 'Freebies are priced into the package. Ask for a cash discount instead of items you would not buy.',
    });
  }

  // Fees
  if (q.extraFees > 1500) {
    flags.push({
      severity: 'warn',
      title: `${money(q.extraFees)} in extra fees`,
      detail: 'Admin, handling and processing fees are pure margin. Ask for them to be waived or included.',
    });
  }

  // Trade-in
  if (q.tradeInOffer > 0 && q.tradeInPaperValue > 0) {
    if (q.tradeInOffer < q.tradeInPaperValue) {
      flags.push({
        severity: 'danger',
        title: 'Trade-in offer is below paper value',
        detail: `Deregistering the car yourself would return ${money(q.tradeInPaperValue)} in PARF + COE rebates, ${money(q.tradeInPaperValue - q.tradeInOffer)} more than the offer.`,
      });
    } else {
      flags.push({
        severity: 'info',
        title: `Trade-in pays ${money(q.tradeInOffer - q.tradeInPaperValue)} above paper value`,
        detail: 'Compare with quotes from used-car dealers or a direct-to-buyer platform before accepting.',
      });
    }
  }

  if (!q.depositRefundable) {
    flags.push({
      severity: 'warn',
      title: 'Deposit is not refundable',
      detail: 'Get it in writing that the deposit is refunded if COE is not secured or your loan is not approved.',
    });
  }

  const totalOutlay = price + loan.totalInterest + insuranceTotal - q.tradeInOffer;
  return {
    allInPrice: price,
    interest: loan.totalInterest,
    eir: loan.eir,
    monthly: loan.monthly,
    totalOutlay,
    freebiesStated,
    freebiesUseful,
    flags,
  };
}
