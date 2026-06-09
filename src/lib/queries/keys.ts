export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  list: (page: number, limit: number) => [...expenseKeys.lists(), { page, limit }] as const,
  detail: (id: string) => [...expenseKeys.all, "detail", id] as const,
  export: () => [...expenseKeys.all, "export"] as const,
};

export const budgetKeys = {
  all: ["budgets"] as const,
  status: (month: number, year: number) => [...budgetKeys.all, "status", month, year] as const,
};

export const categoryKeys = {
  all: ["categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
};
