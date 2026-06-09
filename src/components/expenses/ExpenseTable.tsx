"use client";
import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import type { ExpenseRow } from "@/types";
import { deleteExpense } from "@/lib/actions/expenses";
import { expenseKeys } from "@/lib/queries/keys";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type CategoryOption = { id: string; name: string; color: string };

interface ExpenseTableProps {
  expenses: ExpenseRow[];
  categories: CategoryOption[];
}

const columnHelper = createColumnHelper<ExpenseRow>();

export function ExpenseTable({ expenses, categories: _categories }: ExpenseTableProps) {
  const queryClient = useQueryClient();
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("date", {
        header: "Date",
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        enableSorting: true,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => info.getValue(),
        enableGlobalFilter: true,
      }),
      columnHelper.accessor("category", {
        header: "Category",
        cell: (info) => {
          const cat = info.getValue();
          return (
            <span
              style={{ backgroundColor: cat.color }}
              className="px-2 py-0.5 rounded-full text-white text-xs"
            >
              {cat.name}
            </span>
          );
        },
      }),
      columnHelper.accessor("amount", {
        header: () => <span className="block text-right">Amount</span>,
        cell: (info) => (
          <span className="block text-right">${info.getValue().toFixed(2)}</span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ActionCell
            expense={row.original}
            onDelete={async () => {
              await deleteExpense(row.original.id);
              await queryClient.invalidateQueries({
                queryKey: expenseKeys.lists(),
              });
            }}
          />
        ),
      }),
    ],
    [queryClient],
  );

  const table = useReactTable({
    data: expenses,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue: string) =>
      row.original.description
        .toLowerCase()
        .includes(filterValue.toLowerCase()),
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search expenses..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        data-testid="expense-search"
        className="max-w-xs"
      />
      <Table data-testid="expense-table">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  onClick={
                    header.column.getCanSort()
                      ? header.column.getToggleSortingHandler()
                      : undefined
                  }
                  className={
                    header.column.getCanSort() ? "cursor-pointer select-none" : ""
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  {header.column.getCanSort() && (
                    <span className="ml-1 text-muted-foreground">
                      {header.column.getIsSorted() === "asc"
                        ? "↑"
                        : header.column.getIsSorted() === "desc"
                          ? "↓"
                          : "↕"}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground py-8"
              >
                No expenses found
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ActionCell({
  expense: _expense,
  onDelete,
}: {
  expense: ExpenseRow;
  onDelete: () => Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Actions" className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted">
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            /* edit placeholder */
          }}
        >
          <Pencil className="size-3.5" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => void onDelete()}
        >
          <Trash2 className="size-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
