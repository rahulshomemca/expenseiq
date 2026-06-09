"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createExpense } from "@/lib/actions/expenses";
import { expenseKeys } from "@/lib/queries/keys";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Form-level schema with string inputs (pre-coercion)
const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required").max(200),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type CategoryOption = { id: string; name: string; color: string };

interface ExpenseFormProps {
  categories: CategoryOption[];
  onSuccess: () => void;
  defaultValues?: Partial<FormValues>;
}

export function ExpenseForm({
  categories,
  onSuccess,
  defaultValues,
}: ExpenseFormProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: defaultValues?.date ?? today,
      amount: defaultValues?.amount ?? "",
      description: defaultValues?.description ?? "",
      categoryId: defaultValues?.categoryId ?? "",
    },
  });

  async function onSubmit(data: FormValues) {
    setServerError(null);
    const payload = {
      amount: parseFloat(data.amount),
      description: data.description,
      categoryId: data.categoryId,
      date: data.date ? new Date(data.date) : new Date(),
    };
    const result = await createExpense(payload);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    onSuccess();
  }

  return (
    <form
      data-testid="expense-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          data-testid="expense-amount-input"
          {...register("amount")}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          type="text"
          placeholder="Coffee, groceries..."
          data-testid="expense-description-input"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          data-testid="expense-category-select"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          {...register("categoryId")}
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-xs text-destructive">
            {errors.categoryId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          defaultValue={today}
          data-testid="expense-date-input"
          {...register("date")}
        />
        {errors.date && (
          <p className="text-xs text-destructive">{errors.date.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        data-testid="expense-submit-btn"
        className="w-full"
      >
        {isSubmitting ? "Saving…" : "Save Expense"}
      </Button>
    </form>
  );
}
