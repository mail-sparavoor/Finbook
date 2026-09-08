// ==========================================
// FINANCIAL UTILITIES & FORMATTING
// ==========================================

export function formatCurrency(amount: any, symbol: string = '₹'): string {
  if (amount === null || amount === undefined || amount === '') {
    return `${symbol}0`;
  }
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) {
    return `${symbol}0`;
  }
  const isNegative = num < 0;
  const absAmount = Math.abs(num);
  
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function round2(num: any): number {
  const n = typeof num === 'number' ? num : parseFloat(String(num || 0).replace(/[^0-9.-]+/g, ''));
  if (isNaN(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
