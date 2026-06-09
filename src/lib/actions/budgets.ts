"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err } from "@/types";
import type { Result, BudgetStatus } from "@/types";
import { budgetSchema } from "@/lib/validations/budgetSchema";

export async function getBudgetStatus(
  month: number,
  year: number,
): Promise<Result<BudgetStatus[]>> {
  const session = await auth();
  if (!session?.user?.id) return err("Unauthorized");

  const userId = session.user.id;

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0, 23, 59, 59, 999);

  const [budgets, expenses] = await Promise.all([
    db.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    }),
    db.expense.findMany({
      where: {
        userId,
        date: { gte: firstDay, lte: lastDay },
      },
      include: { category: { select: { id: true, name: true, color: true } } },
    }),
  ]);

  // Map expenses by category
  const spendingByCategory = new Map<string, number>();
  for (const expense of expenses) {
    const current = spendingByCategory.get(expense.categoryId) ?? 0;
    spendingByCategory.set(expense.categoryId, current + Number(expense.amount));
  }

  const statuses: BudgetStatus[] = [];

  // Process budgets
  for (const budget of budgets) {
    const spent = spendingByCategory.get(budget.categoryId) ?? 0;
    const budgetAmount = Number(budget.amount);
    statuses.push({
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      color: budget.category.color,
      budget: budgetAmount,
      spent,
      percentage: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0,
    });
  }

  // Find categories with expenses but no budget
  const budgetCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const expenseCategories = new Map<string, { name: string; color: string }>();
  for (const expense of expenses) {
    if (!budgetCategoryIds.has(expense.categoryId)) {
      expenseCategories.set(expense.categoryId, {
        name: expense.category.name,
        color: expense.category.color,
      });
    }
  }

  for (const [categoryId, category] of expenseCategories) {
    const spent = spendingByCategory.get(categoryId) ?? 0;
    if (spent > 0) {
      statuses.push({
        categoryId,
        categoryName: category.name,
        color: category.color,
        budget: 0,
        spent,
        percentage: 0,
      });
    }
  }

  return ok(statuses);
}

export async function upsertBudget(input: unknown): Promise<Result<{
  id: string;
  amount: number;
  month: number;
  year: number;
  userId: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}>> {
  const session = await auth();
  if (!session?.user?.id) return err("Unauthorized");

  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return err(parsed.error.message);

  const { amount, categoryId, month, year } = parsed.data;
  const userId = session.user.id;

  const budget = await db.budget.upsert({
    where: {
      userId_categoryId_month_year: { userId, categoryId, month, year },
    },
    create: { amount, categoryId, month, year, userId },
    update: { amount },
  });

  revalidatePath("/budget");

  return ok({
    id: budget.id,
    amount: Number(budget.amount),
    month: budget.month,
    year: budget.year,
    userId: budget.userId,
    categoryId: budget.categoryId,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  });
}

export async function getCategories(): Promise<Result<{
  id: string;
  name: string;
  color: string;
  icon: string | null;
  createdAt: Date;
}[]>> {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  return ok(categories);
}
