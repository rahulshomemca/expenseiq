export type Ok<T> = { ok: true; data: T };
export type Err<E = string> = { ok: false; error: E };
export type Result<T, E = string> = Ok<T> | Err<E>;

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

export function err<E = string>(error: E): Err<E> {
  return { ok: false, error };
}

// Convenience: expense with amount as number (for client display)
export type ExpenseRow = {
  id: string;
  amount: number;
  description: string;
  date: Date;
  categoryId: string;
  category: { id: string; name: string; color: string };
  createdAt: Date;
};

export type BudgetStatus = {
  categoryId: string;
  categoryName: string;
  color: string;
  budget: number;
  spent: number;
  percentage: number;
};
