import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Receipt, Target } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/budget", label: "Budget", icon: Target },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <nav
        data-testid="sidebar"
        className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card"
      >
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-xl font-semibold tracking-tight">
            ExpenseIQ
          </span>
        </div>
        <div className="flex flex-col gap-1 p-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="ml-64 flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
