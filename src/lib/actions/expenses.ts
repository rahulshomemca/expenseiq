"use server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err } from "@/types";
import type { Result, ExpenseRow } from "@/types";
import { expenseSchema } from "@/lib/validations/expenseSchema";

export async function createExpense(input: unknown): Promise<Result<ExpenseRow>> {
  const session = await auth();
  if (!session?.user?.id) return err("Unauthorized");

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return err(parsed.error.message);

  const { amount, description, categoryId, date } = parsed.data;

  const expense = await db.expense.create({
    data: {
      amount,
      description,
      categoryId,
      date,
      userId: session.user.id,
    },
    include: {
      category: { select: { id: true, name: true, color: true } },
    },
  });

  await db.auditLog.create({
    data: {
      action: "CREATE",
      entityType: "Expense",
      entityId: expense.id,
      userId: session.user.id,
      after: { amount: Number(expense.amount), description: expense.description },
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return ok({
    id: expense.id,
    amount: Number(expense.amount),
    description: expense.description,
    date: expense.date,
    categoryId: expense.categoryId,
    category: expense.category,
    createdAt: expense.createdAt,
  });
}

export async function updateExpense(id: string, input: unknown): Promise<Result<ExpenseRow>> {
  const session = await auth();
  if (!session?.user?.id) return err("Unauthorized");

  const old = await db.expense.findUnique({ where: { id } });
  if (!old || old.userId !== session.user.id) return err("Not found");

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return err(parsed.error.message);

  const { amount, description, categoryId, date } = parsed.data;

  const updated = await db.expense.update({
    where: { id },
    data: { amount, description, categoryId, date },
    include: {
      category: { select: { id: true, name: true, color: true } },
    },
  });

  await db.auditLog.create({
    data: {
      action: "UPDATE",
      entityType: "Expense",
      entityId: updated.id,
      userId: session.user.id,
      before: { amount: Number(old.amount) },
      after: { amount: Number(updated.amount) },
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return ok({
    id: updated.id,
    amount: Number(updated.amount),
    description: updated.description,
    date: updated.date,
    categoryId: updated.categoryId,
    category: updated.category,
    createdAt: updated.createdAt,
  });
}

export async function deleteExpense(id: string): Promise<Result<undefined>> {
  const session = await auth();
  if (!session?.user?.id) return err("Unauthorized");

  const expense = await db.expense.findUnique({ where: { id } });
  if (!expense || expense.userId !== session.user.id) return err("Not found");

  await db.expense.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      action: "DELETE",
      entityType: "Expense",
      entityId: id,
      userId: session.user.id,
      before: { amount: Number(expense.amount), description: expense.description },
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return ok(undefined);
}

export async function getExpenses(
  page = 1,
  limit = 20,
): Promise<Result<{ expenses: ExpenseRow[]; total: number; page: number; limit: number }>> {
  const session = await auth();
  if (!session?.user?.id) return err("Unauthorized");

  const [rows, total] = await Promise.all([
    db.expense.findMany({
      where: { userId: session.user.id },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.expense.count({ where: { userId: session.user.id } }),
  ]);

  const expenses: ExpenseRow[] = rows.map((e) => ({
    id: e.id,
    amount: Number(e.amount),
    description: e.description,
    date: e.date,
    categoryId: e.categoryId,
    category: e.category,
    createdAt: e.createdAt,
  }));

  return ok({ expenses, total, page, limit });
}

export async function exportExpenses(): Promise<Result<string>> {
  const session = await auth();
  if (!session?.user?.id) return err("Unauthorized");

  const rows = await db.expense.findMany({
    where: { userId: session.user.id },
    include: { category: { select: { id: true, name: true, color: true } } },
    orderBy: { date: "desc" },
  });

  const header = "date,description,category,amount";
  const lines = rows.map(
    (e) =>
      `${e.date.toISOString().split("T")[0]},"${e.description}","${e.category.name}",${Number(e.amount).toFixed(2)}`,
  );

  const csvString = [header, ...lines].join("\n");
  return ok(csvString);
}
