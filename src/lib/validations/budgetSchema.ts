import { z } from "zod";

export const budgetSchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000),
  categoryId: z.string().min(1, "Category is required"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2040),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
