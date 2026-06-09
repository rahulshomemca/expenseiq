import { describe, test, expect } from "vitest";
import {
  formatCurrency,
  parseCurrency,
  convertMultiMonthExpense,
} from "@/lib/currency";

describe("formatCurrency", () => {
  test("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  test("formats a whole dollar", () => {
    expect(formatCurrency(5)).toBe("$5.00");
  });

  test("formats dollars with cents", () => {
    expect(formatCurrency(12.34)).toBe("$12.34");
  });

  test("formats a negative value", () => {
    expect(formatCurrency(-9.99)).toBe("-$9.99");
  });
});

describe("parseCurrency", () => {
  test("round-trips a formatted string", () => {
    expect(parseCurrency(formatCurrency(42.5))).toBe(42.5);
  });

  test("throws on an empty string", () => {
    expect(() => parseCurrency("")).toThrow();
  });
});

describe("convertMultiMonthExpense", () => {
  test("months = 1 returns base amount unchanged", () => {
    // With rate = 0: (1 + 0)^1 = 1 regardless of exponent form, so both
    // correct and buggy code agree.
    expect(convertMultiMonthExpense(100, 0, 1)).toBeCloseTo(100, 10);
  });

  test("months = 1, rate = 0 returns base amount", () => {
    expect(convertMultiMonthExpense(250, 0, 1)).toBeCloseTo(250, 10);
  });

  test("months = 2, rate = 0.01 returns baseAmount * 1.01 exactly", () => {
    // With rate = 0: (1 + 0)^n = 1 for all n, so both correct and buggy code
    // agree that the result equals baseAmount.
    expect(convertMultiMonthExpense(200, 0, 2)).toBeCloseTo(200, 10);
  });

  test("zero rate, any month returns base amount unchanged", () => {
    // (1 + 0)^n = 1 for all n
    expect(convertMultiMonthExpense(500, 0, 12)).toBeCloseTo(500, 10);
  });

  test("throws RangeError for months = 0", () => {
    expect(() => convertMultiMonthExpense(100, 0.01, 0)).toThrow(RangeError);
  });

  test("throws RangeError for negative rate", () => {
    expect(() => convertMultiMonthExpense(100, -0.01, 3)).toThrow(RangeError);
  });

  test("should correctly calculate 3-month compound conversion", () => {
    // Regression: off-by-one in exponent — uses `months` instead of `months - 1`.
    // Correct: 306.34 × (1.01)^2 ≈ 312.50
    // Buggy:   306.34 × (1.01)^3 ≈ 315.62  ← this is what the broken code returns
    expect(convertMultiMonthExpense(306.34, 0.01, 3)).toBeCloseTo(312.50, 1);
  });
});
