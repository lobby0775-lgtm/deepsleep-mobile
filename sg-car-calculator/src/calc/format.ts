export const money = (n: number) =>
  (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-SG');

export const pct = (n: number, dp = 1) => `${n.toFixed(dp)}%`;

/** Plain formatted number, for putting inside an input the user can also edit. */
export const fmtMoney = (n: number) => Math.round(n).toLocaleString('en-SG');
