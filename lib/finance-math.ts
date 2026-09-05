// ==========================================
// FINANCIAL UTILITIES & FORMATTING
// ==========================================

export function formatCurrency(amount: number, symbol: string = '₹'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
