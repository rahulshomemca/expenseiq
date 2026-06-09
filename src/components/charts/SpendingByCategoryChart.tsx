"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartData = { category: string; spent: number; budget: number };

export function SpendingByCategoryChart({ data }: { data: ChartData[] }) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        No spending data yet
      </p>
    );
  }
  return (
    <div
      aria-label="Spending by category chart"
      role="img"
      data-testid="spending-chart"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="category" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(v) =>
              typeof v === "number" ? [`$${v.toFixed(2)}`, ""] : [`${v}`, ""]
            }
          />
          <Bar
            dataKey="spent"
            fill="hsl(var(--chart-1))"
            name="Spent"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="budget"
            fill="hsl(var(--chart-2))"
            name="Budget"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
