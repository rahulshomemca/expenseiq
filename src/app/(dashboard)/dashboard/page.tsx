import type { Metadata } from "next";
import { getBudgetStatus, getCategories } from "@/lib/actions/budgets";
import { getExpenses } from "@/lib/actions/expenses";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SpendingByCategoryChart } from "@/components/charts/SpendingByCategoryChart";

export const metadata: Metadata = { title: "Dashboard — ExpenseIQ" };

export default async function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [budgetResult, expensesResult] = await Promise.all([
    getBudgetStatus(month, year),
    getExpenses(1, 5),
  ]);

  if (!budgetResult.ok) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load budget data: {budgetResult.error}
      </div>
    );
  }

  if (!expensesResult.ok) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load expenses: {expensesResult.error}
      </div>
    );
  }

  const expenses = expensesResult.data.expenses;

  // Summary calculations
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const numExpenses = expensesResult.data.total;

  const categoryCounts = new Map<string, number>();
  for (const e of expenses) {
    categoryCounts.set(
      e.category.name,
      (categoryCounts.get(e.category.name) ?? 0) + e.amount,
    );
  }
  let topCategory = "—";
  let topAmount = 0;
  for (const [name, amount] of categoryCounts) {
    if (amount > topAmount) {
      topAmount = amount;
      topCategory = name;
    }
  }

  // Chart data
  const chartData = budgetResult.data.map((b) => ({
    category: b.categoryName,
    spent: b.spent,
    budget: b.budget,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Number of Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{numExpenses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{topCategory}</p>
          </CardContent>
        </Card>
      </div>

      {/* Spending chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendingByCategoryChart data={chartData} />
        </CardContent>
      </Card>

      {/* Recent expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No expenses yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="py-2 text-left font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="py-2 text-left font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="py-2 text-right font-medium text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b last:border-0">
                      <td className="py-2 text-muted-foreground">
                        {new Date(e.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2">{e.description}</td>
                      <td className="py-2">
                        <span
                          style={{ backgroundColor: e.category.color }}
                          className="px-2 py-0.5 rounded-full text-white text-xs"
                        >
                          {e.category.name}
                        </span>
                      </td>
                      <td className="py-2 text-right font-medium">
                        ${e.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
