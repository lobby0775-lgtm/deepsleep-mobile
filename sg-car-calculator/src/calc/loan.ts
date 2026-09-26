import { LOAN_RULES } from './defaults';

/** Largest loan MAS allows for this car. */
export function maxLoan(price: number, omv: number): { ltv: number; amount: number; maxYears: number } {
  const ltv = omv <= LOAN_RULES.omvThreshold ? LOAN_RULES.ltvLowOmv : LOAN_RULES.ltvHighOmv;
  return { ltv, amount: Math.floor(price * ltv), maxYears: LOAN_RULES.maxTenureYears };
}

export interface LoanResult {
  principal: number;
  months: number;
  monthly: number;
  totalInterest: number;
  totalRepaid: number;
  /** True yearly cost of the loan, with monthly compounding. */
  eir: number;
}

/**
 * Car loans in Singapore are quoted as a *flat* rate: interest is charged on the
 * full original amount for the whole term, even as you pay it down. The EIR
 * shows what that really costs.
 */
export function flatRateLoan(principal: number, flatRatePct: number, years: number): LoanResult {
  const months = Math.round(years * 12);
  if (principal <= 0 || months <= 0) {
    return { principal: 0, months, monthly: 0, totalInterest: 0, totalRepaid: 0, eir: 0 };
  }
  const totalInterest = principal * (flatRatePct / 100) * years;
  const totalRepaid = principal + totalInterest;
  const monthly = totalRepaid / months;
  const i = monthlyRate(principal, monthly, months);
  return {
    principal,
    months,
    monthly: Math.round(monthly * 100) / 100,
    totalInterest: Math.round(totalInterest),
    totalRepaid: Math.round(totalRepaid),
    eir: (Math.pow(1 + i, 12) - 1) * 100,
  };
}

/** Solve for the monthly rate i where an n-month annuity of `payment` repays `principal`. */
function monthlyRate(principal: number, payment: number, n: number): number {
  if (payment * n <= principal) return 0;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const pv = (payment * (1 - Math.pow(1 + mid, -n))) / mid;
    if (pv > principal) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Settling a flat-rate loan early: lenders refund unearned interest by the
 * Rule of 78, which front-loads interest, and usually add a penalty (often 20%
 * of the refund is kept). Returns the interest you still pay.
 */
export function earlySettlement(loan: LoanResult, monthsPaid: number, penaltyPct = 20) {
  const n = loan.months;
  const k = Math.min(Math.max(0, monthsPaid), n);
  const remaining = n - k;
  const rebateFraction = (remaining * (remaining + 1)) / (n * (n + 1));
  const interestRebate = loan.totalInterest * rebateFraction * (1 - penaltyPct / 100);
  const principalLeft = loan.principal * (remaining / n);
  return {
    settleAmount: Math.round(principalLeft + loan.totalInterest * (remaining / n) - interestRebate),
    interestPaid: Math.round(loan.totalInterest - interestRebate),
  };
}
