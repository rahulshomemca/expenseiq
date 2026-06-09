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
import { createExpense, deleteExpense, getExpenses } from "@/lib/actions/expenses";
import { getBudgetStatus, getCategories } from "@/lib/actions/budgets";

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
