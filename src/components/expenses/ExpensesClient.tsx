"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ExpenseRow } from "@/types";
import { getExpenses } from "@/lib/actions/expenses";
import { expenseKeys } from "@/lib/queries/keys";
import { Button } from "@/components/ui/button";
import { ExpenseTable } from "@/components/expenses/ExpenseTable";
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog";

type CategoryOption = { id: string; name: string; color: string };

interface ExpensesClientProps {
  initialExpenses: ExpenseRow[];
  categories: CategoryOption[];
}

export function ExpensesClient({
  initialExpenses,
  categories,
}: ExpensesClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data } = useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: async () => {
      const r = await getExpenses(1, 50);
      return r.ok ? r.data.expenses : [];
    },
    initialData: initialExpenses,
  });

  const expenses: ExpenseRow[] = Array.isArray(data) ? data : initialExpenses;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <Button
          onClick={() => setDialogOpen(true)}
          data-testid="add-expense-btn"
        >
          Add Expense
        </Button>
      </div>

      <ExpenseTable expenses={expenses} categories={categories} />

      <AddExpenseDialog
        categories={categories}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
