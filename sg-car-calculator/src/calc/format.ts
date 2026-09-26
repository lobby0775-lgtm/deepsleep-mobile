export const money = (n: number) =>
  (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-SG');

export const pct = (n: number, dp = 1) => `${n.toFixed(dp)}%`;
