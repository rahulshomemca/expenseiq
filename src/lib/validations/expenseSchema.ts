import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000),
  description: z.string().min(1, "Description is required").max(200),
  categoryId: z.string().min(1, "Category is required"),
  date: z.coerce.date().optional().default(() => new Date()),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
