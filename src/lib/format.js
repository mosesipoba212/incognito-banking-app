export function fmtGBP(n, hide) {
  if (hide) return "••••••";
  const neg = n < 0;
  const v = Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (neg ? "-£" : "£") + v;
}
