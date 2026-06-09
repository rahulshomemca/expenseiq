import { describe, test, expect } from "vitest";
import {
  calculateBudgetPercentage,
  getBudgetStatusLabel,
  isOverBudget,
  projectMonthlySpend,
} from "@/lib/budget";

describe("budget utilities", () => {
  test("calculateBudgetPercentage returns 0 for a zero budget", () => {
    expect(calculateBudgetPercentage(50, 0)).toBe(0);
  });

  test("calculateBudgetPercentage returns 75 for spent=75, budget=100", () => {
    expect(calculateBudgetPercentage(75, 100)).toBe(75);
  });

  test.each([
    [50, "safe"],
    [79.9, "safe"],
    [80, "warning"],
    [99.9, "warning"],
    [100, "critical"],
    [150, "critical"],
  ] as [number, "safe" | "warning" | "critical"][])(
    "getBudgetStatusLabel(%s%) → %s",
    (percentage, expected) => {
      expect(getBudgetStatusLabel(percentage)).toBe(expected);
    },
  );

  test("isOverBudget returns true when spent exceeds budget, false otherwise", () => {
    expect(isOverBudget(101, 100)).toBe(true);
    expect(isOverBudget(100, 100)).toBe(false);
    expect(isOverBudget(50, 100)).toBe(false);
  });

  test("projectMonthlySpend projects correctly: spent=200, day=10, daysInMonth=30 → 600", () => {
    expect(projectMonthlySpend(200, 10, 30)).toBe(600);
  });
});
