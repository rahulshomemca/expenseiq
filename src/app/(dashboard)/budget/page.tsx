import type { Metadata } from "next";
import { getBudgetStatus, getCategories } from "@/lib/actions/budgets";
import { BudgetProgressCard } from "@/components/budget/BudgetProgressCard";

export const metadata: Metadata = { title: "Budget — ExpenseIQ" };

export default async function BudgetPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [result, catResult] = await Promise.all([
    getBudgetStatus(month, year),
    getCategories(),
  ]);

  if (!result.ok) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load budget data: {result.error}
      </div>
    );
  }

  const budgetStatuses = result.data;
  const _categories = catResult.ok ? catResult.data : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Budget</h1>
        <button
          className="rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm hover:bg-muted transition-colors"
          disabled
          title="Coming soon"
        >
          Edit Budgets
        </button>
      </div>

      {budgetStatuses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No budget data yet. Add expenses or set budgets to see progress here.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgetStatuses.map((status) => (
            <BudgetProgressCard
              key={status.categoryId}
              categoryName={status.categoryName}
              color={status.color}
              spent={status.spent}
              budget={status.budget}
              percentage={status.percentage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
