"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

type CategoryOption = { id: string; name: string; color: string };

interface AddExpenseDialogProps {
  categories: CategoryOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddExpenseDialog({
  categories,
  open,
  onOpenChange,
}: AddExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => onOpenChange(val)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <ExpenseForm
          categories={categories}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
