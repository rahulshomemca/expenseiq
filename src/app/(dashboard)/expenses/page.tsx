import type { Metadata } from "next";
import { getExpenses } from "@/lib/actions/expenses";
import { getCategories } from "@/lib/actions/budgets";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";

export const metadata: Metadata = { title: "Expenses — ExpenseIQ" };

export default async function ExpensesPage() {
  const [result, catResult] = await Promise.all([
    getExpenses(1, 50),
    getCategories(),
  ]);

  const initialExpenses = result.ok ? result.data.expenses : [];
  const categories = catResult.ok ? catResult.data : [];

  return (
    <ExpensesClient initialExpenses={initialExpenses} categories={categories} />
  );
}
