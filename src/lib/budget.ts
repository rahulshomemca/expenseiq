/**
 * Pure budget utility functions for ExpenseIQ.
 * No DB or auth imports — safe to use on client or server.
 */

/**
 * Returns what percentage of the budget has been spent.
 * Returns 0 when budget is 0 to avoid division by zero.
 */
export function calculateBudgetPercentage(spent: number, budget: number): number {
  if (budget === 0) return 0;
  return (spent / budget) * 100;
}

/**
 * Returns a human-readable status label based on a budget percentage.
 *  - < 80  → "safe"
 *  - 80–99 → "warning"
 *  - ≥ 100 → "critical"
 */
export function getBudgetStatusLabel(percentage: number): "safe" | "warning" | "critical" {
  if (percentage >= 100) return "critical";
  if (percentage >= 80) return "warning";
  return "safe";
}

/** Returns true when spent exceeds the budget amount. */
export function isOverBudget(spent: number, budget: number): boolean {
  return spent > budget;
}

/**
 * Returns how much budget remains (budget − spent).
 * Can be negative when the user has gone over budget.
 */
export function getRemainingBudget(spent: number, budget: number): number {
  return budget - spent;
}

/**
 * Projects the total monthly spend using a linear extrapolation.
 *   projection = (spentSoFar / dayOfMonth) × daysInMonth
 *
 * Returns spentSoFar unchanged when dayOfMonth ≤ 0 to avoid division by zero.
 */
export function projectMonthlySpend(
  spentSoFar: number,
  dayOfMonth: number,
  daysInMonth: number,
): number {
  if (dayOfMonth <= 0) return spentSoFar;
  return (spentSoFar / dayOfMonth) * daysInMonth;
}
