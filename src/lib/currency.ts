/**
 * Currency and expense conversion utilities for ExpenseIQ.
 */

/** Format a number as a USD currency string. */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Parse a currency string such as "$1,234.56" to a plain number. */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) throw new Error(`Cannot parse currency value: "${value}"`);
  return parsed;
}

/**
 * Convert a base monthly expense to its inflation-adjusted value after
 * compound growth over the given number of months.
 *
 * Formula: baseAmount × (1 + monthlyRate)^(months − 1)
 *
 * Rationale for the (months − 1) exponent:
 *   - In month 1 the expense has not yet grown → exponent 0 → value = baseAmount
 *   - In month 2 one period of growth has elapsed → exponent 1
 *   - In month N, (N − 1) periods have elapsed → exponent N − 1
 *
 * @param baseAmount   The expense amount in the first month.
 * @param monthlyRate  Monthly growth/inflation rate as a decimal (e.g. 0.005 for 0.5 %).
 * @param months       Total number of months (must be ≥ 1).
 */
export function convertMultiMonthExpense(
  baseAmount: number,
  monthlyRate: number,
  months: number,
): number {
  if (months < 1) throw new RangeError("months must be at least 1");
  if (monthlyRate < 0) throw new RangeError("monthlyRate must be non-negative");
  return baseAmount * Math.pow(1 + monthlyRate, months);
}
