import { vi, describe, test, expect, beforeEach } from "vitest";

// Hoist mocks — vi.mock is hoisted before imports
vi.mock("@/lib/db", () => ({
  db: {
    expense: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    budget: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));
vi.mock("@/lib/auth");
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenses,
  exportExpenses,
} from "@/lib/actions/expenses";
import { getBudgetStatus, upsertBudget, getCategories } from "@/lib/actions/budgets";

const mockAuth = vi.mocked(auth);
const mockDb = vi.mocked(db, true);

beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// createExpense
// ---------------------------------------------------------------------------
describe("createExpense", () => {
  test("returns err('Unauthorized') when auth returns null", async () => {
    mockAuth.mockResolvedValue(null as any);

    const result = await createExpense({ amount: 10, description: "test", categoryId: "cat-1" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Unauthorized");
  });

  test("returns err when Zod validation fails (negative amount)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", email: "test@test.com" } } as any);

    const result = await createExpense({ amount: -1, description: "bad", categoryId: "cat-1" });

    expect(result.ok).toBe(false);
  });

  test("creates expense and returns ok when input is valid", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", email: "test@test.com" } } as any);

    const now = new Date();
    const fakeExpense = {
      id: "exp-1",
      amount: 50,
      description: "Lunch",
      date: now,
      categoryId: "cat-1",
      category: { id: "cat-1", name: "Food", color: "#ff0000" },
      createdAt: now,
      userId: "user-1",
    };

    (db.expense.create as ReturnType<typeof vi.fn>).mockResolvedValue(fakeExpense);
    (db.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await createExpense({
      amount: 50,
      description: "Lunch",
      categoryId: "cat-1",
      date: now,
    });

    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateExpense
// ---------------------------------------------------------------------------
describe("updateExpense", () => {
  test("returns err('Unauthorized') when not signed in", async () => {
    mockAuth.mockResolvedValue(null as any);
    const result = await updateExpense("exp-1", { amount: 20, description: "x", categoryId: "c" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Unauthorized");
  });

  test("returns err('Not found') when expense belongs to another user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
    (db.expense.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "exp-1", userId: "other", amount: 10, description: "x", date: new Date(), categoryId: "c", createdAt: new Date(),
    });
    const result = await updateExpense("exp-1", { amount: 20, description: "x", categoryId: "c" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Not found");
  });

  test("updates and returns ok when input is valid", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
    const now = new Date();
    const existing = { id: "exp-1", userId: "user-1", amount: 10, description: "old", date: now, categoryId: "c", createdAt: now };
    const updated = { ...existing, amount: 20, description: "new", category: { id: "c", name: "Food", color: "#f00" } };
    (db.expense.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
    (db.expense.update as ReturnType<typeof vi.fn>).mockResolvedValue(updated);
    (db.auditLog.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const result = await updateExpense("exp-1", { amount: 20, description: "new", categoryId: "c" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.amount).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// exportExpenses
// ---------------------------------------------------------------------------
describe("exportExpenses", () => {
  test("returns err('Unauthorized') when not signed in", async () => {
    mockAuth.mockResolvedValue(null as any);
    const result = await exportExpenses();
    expect(result.ok).toBe(false);
  });

  test("returns CSV string with header row when user has expenses", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
    (db.expense.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "e1", date: new Date("2026-01-15"), description: "Coffee", amount: 5.5, categoryId: "c1", category: { id: "c1", name: "Food", color: "#f00" }, createdAt: new Date(), userId: "user-1" },
    ]);
    const result = await exportExpenses();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toContain("date,description,category,amount");
      expect(result.data).toContain("Coffee");
      expect(result.data).toContain("5.50");
    }
  });
});

// ---------------------------------------------------------------------------
// deleteExpense
// ---------------------------------------------------------------------------
describe("deleteExpense", () => {
  test("returns err('Not found') when expense belongs to another user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", email: "test@test.com" } } as any);

    // Expense owned by a different user
    (db.expense.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "exp-99",
      userId: "other-user",
      amount: 20,
      description: "Someone else's expense",
      date: new Date(),
      categoryId: "cat-1",
      createdAt: new Date(),
    });

    const result = await deleteExpense("exp-99");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Not found");
  });
});

// ---------------------------------------------------------------------------
// getExpenses
// ---------------------------------------------------------------------------
describe("getExpenses", () => {
  test("returns empty list when user has no expenses", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", email: "test@test.com" } } as any);

    (db.expense.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.expense.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const result = await getExpenses();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.expenses.length).toBe(0);
      expect(result.data.total).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// getBudgetStatus
// ---------------------------------------------------------------------------
describe("getBudgetStatus", () => {
  test("returns err('Unauthorized') when not signed in", async () => {
    mockAuth.mockResolvedValue(null as any);
    const result = await getBudgetStatus(6, 2026);
    expect(result.ok).toBe(false);
  });

  test("returns statuses for budgeted categories", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
    (db.budget.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "b1", userId: "user-1", categoryId: "c1", amount: 100, month: 6, year: 2026, createdAt: new Date(), updatedAt: new Date(), category: { id: "c1", name: "Food", color: "#f00" } },
    ]);
    (db.expense.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "e1", userId: "user-1", categoryId: "c1", amount: 60, date: new Date("2026-06-10"), description: "x", createdAt: new Date(), category: { id: "c1", name: "Food", color: "#f00" } },
    ]);
    const result = await getBudgetStatus(6, 2026);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].spent).toBe(60);
      expect(result.data[0].percentage).toBe(60);
    }
  });

  test("includes categories with spending but no budget (budget = 0)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
    (db.budget.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (db.expense.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "e1", userId: "user-1", categoryId: "c2", amount: 25, date: new Date("2026-06-05"), description: "y", createdAt: new Date(), category: { id: "c2", name: "Transport", color: "#00f" } },
    ]);
    const result = await getBudgetStatus(6, 2026);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].budget).toBe(0);
      expect(result.data[0].spent).toBe(25);
    }
  });
});

// ---------------------------------------------------------------------------
// upsertBudget
// ---------------------------------------------------------------------------
describe("upsertBudget", () => {
  test("returns err('Unauthorized') when not signed in", async () => {
    mockAuth.mockResolvedValue(null as any);
    const result = await upsertBudget({ amount: 100, categoryId: "c1", month: 6, year: 2026 });
    expect(result.ok).toBe(false);
  });

  test("returns err when schema validation fails (invalid month)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
    const result = await upsertBudget({ amount: 100, categoryId: "c1", month: 13, year: 2026 });
    expect(result.ok).toBe(false);
  });

  test("creates or updates budget and returns ok", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as any);
    const now = new Date();
    (db.budget.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "b1", amount: 200, categoryId: "c1", month: 6, year: 2026, userId: "user-1", createdAt: now, updatedAt: now,
    });
    const result = await upsertBudget({ amount: 200, categoryId: "c1", month: 6, year: 2026 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.amount).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// getCategories
// ---------------------------------------------------------------------------
describe("getCategories", () => {
  test("returns all categories ordered by name", async () => {
    const fakeCategories = [
      { id: "cat-1", name: "Food", color: "#ff0000", icon: null, createdAt: new Date() },
      { id: "cat-2", name: "Transport", color: "#0000ff", icon: null, createdAt: new Date() },
    ];

    (db.category.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(fakeCategories);

    const result = await getCategories();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe("Food");
      expect(result.data[1].name).toBe("Transport");
    }
  });
});
