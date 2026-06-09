"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";

interface BudgetProgressCardProps {
  categoryName: string;
  color: string;
  spent: number;
  budget: number;
  percentage: number;
}

export function BudgetProgressCard({
  categoryName,
  color,
  spent,
  budget,
  percentage,
}: BudgetProgressCardProps) {
  const capped = Math.min(percentage, 100);

  const indicatorColor =
    percentage > 100
      ? "bg-red-500"
      : percentage > 80
        ? "bg-amber-400"
        : "bg-green-500";

  return (
    <Card data-testid="budget-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <span
            style={{ backgroundColor: color }}
            className="inline-block size-3 rounded-full shrink-0"
          />
          {categoryName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span>
            ${spent.toFixed(2)} / ${budget > 0 ? budget.toFixed(2) : "—"}
          </span>
          <span
            className={
              percentage > 100
                ? "text-red-500 font-semibold"
                : percentage > 80
                  ? "text-amber-500 font-semibold"
                  : "text-green-600 font-semibold"
            }
          >
            {budget > 0 ? `${percentage.toFixed(0)}%` : "No budget"}
          </span>
        </div>

        <ProgressTrack
          data-testid="budget-progress"
          className="h-2"
        >
          <ProgressIndicator
            className={indicatorColor}
            style={{ width: `${capped}%` }}
          />
        </ProgressTrack>
      </CardContent>
    </Card>
  );
}
