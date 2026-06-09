import { describe, test, expect } from "vitest";
import {
  formatCurrency,
  parseCurrency,
  convertMultiMonthExpense,
} from "./currency";

describe("formatCurrency", () => {
  test("formats a whole dollar amount", () => {
    expect(formatCurrency(100)).toBe("$100.00");
  });

  test("formats cents correctly", () => {
    expect(formatCurrency(9.5)).toBe("$9.50");
  });

  test("formats large amounts with commas", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });
});

describe("parseCurrency", () => {
  test("parses a formatted string back to a number", () => {
    expect(parseCurrency("$1,234.56")).toBe(1234.56);
  });

  test("throws on non-numeric input", () => {
    expect(() => parseCurrency("not-a-number")).toThrow();
  });
});

describe("convertMultiMonthExpense", () => {
  // Regression guard: the exponent must be (months − 1), not months.
  // Using `months` applies one extra period of compounding, inflating every
  // result by a factor of (1 + monthlyRate) and giving a wrong value even
  // for the trivial single-month case.

  test("month 1 with any rate returns the base amount unchanged", () => {
    // Exponent is (1 - 1) = 0 → (1 + r)^0 = 1 → result equals baseAmount
    expect(convertMultiMonthExpense(200, 0.01, 1)).toBeCloseTo(200, 10);
    expect(convertMultiMonthExpense(200, 0.05, 1)).toBeCloseTo(200, 10);
    expect(convertMultiMonthExpense(200, 0, 1)).toBeCloseTo(200, 10);
  });

  test("month 2 applies exactly one period of compounding", () => {
    // Exponent is (2 - 1) = 1 → 200 × 1.01^1 = 202
    expect(convertMultiMonthExpense(200, 0.01, 2)).toBeCloseTo(202, 10);
  });

  test("month 3 applies exactly two periods of compounding", () => {
    // Exponent is (3 - 1) = 2 → 200 × 1.01^2 = 204.02
    expect(convertMultiMonthExpense(200, 0.01, 3)).toBeCloseTo(204.02, 2);
  });

  test("zero rate returns base amount for any month", () => {
    // (1 + 0)^n = 1 for all n
    expect(convertMultiMonthExpense(500, 0, 12)).toBeCloseTo(500, 10);
  });

  test("throws when months < 1", () => {
    expect(() => convertMultiMonthExpense(100, 0.01, 0)).toThrow(RangeError);
  });

  test("throws when monthlyRate is negative", () => {
    expect(() => convertMultiMonthExpense(100, -0.01, 6)).toThrow(RangeError);
  });
});
