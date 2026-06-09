import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const db = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: "Food", color: "#ef4444", icon: "🍔" },
  { name: "Transport", color: "#3b82f6", icon: "🚗" },
  { name: "Housing", color: "#8b5cf6", icon: "🏠" },
  { name: "Entertainment", color: "#f59e0b", icon: "🎬" },
  { name: "Healthcare", color: "#10b981", icon: "💊" },
];

const USERS = [
  { name: "Alice Chen", email: "alice@example.com" },
  { name: "Bob Smith", email: "bob@example.com" },
  { name: "Carol Williams", email: "carol@example.com" },
];

// Helper: random between min and max
function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function main() {
  // Seed categories
  const categories: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const c = await db.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categories[cat.name] = c.id;
  }
  console.log("✓ Categories seeded");

  // Seed users
  const users: Record<string, string> = {};
  for (const u of USERS) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    users[u.email] = user.id;
  }
  console.log("✓ Users seeded");

  // Seed 50 expenses for alice and bob (25 each) — March, April, May 2026
  const expenseTemplates: Array<{ desc: string; cat: string; min: number; max: number }> = [
    { desc: "Grocery shopping", cat: "Food", min: 30, max: 150 },
    { desc: "Restaurant dinner", cat: "Food", min: 20, max: 80 },
    { desc: "Coffee shop", cat: "Food", min: 5, max: 15 },
    { desc: "Uber ride", cat: "Transport", min: 8, max: 35 },
    { desc: "Gas station", cat: "Transport", min: 40, max: 90 },
    { desc: "Monthly rent", cat: "Housing", min: 1200, max: 1200 },
    { desc: "Electric bill", cat: "Housing", min: 60, max: 120 },
    { desc: "Movie tickets", cat: "Entertainment", min: 15, max: 40 },
    { desc: "Streaming subscription", cat: "Entertainment", min: 10, max: 20 },
    { desc: "Doctor visit", cat: "Healthcare", min: 30, max: 200 },
    { desc: "Pharmacy", cat: "Healthcare", min: 15, max: 60 },
  ];

  const months = [
    { m: 3, y: 2026 }, // March
    { m: 4, y: 2026 }, // April
    { m: 5, y: 2026 }, // May
  ];

  let count = 0;
  for (const email of ["alice@example.com", "bob@example.com"]) {
    const userId = users[email];
    for (let i = 0; i < 25; i++) {
      const template = expenseTemplates[i % expenseTemplates.length];
      const { m, y } = months[i % 3];
      const day = Math.floor(Math.random() * 28) + 1;
      await db.expense.create({
        data: {
          description: template.desc,
          amount: rand(template.min, template.max),
          categoryId: categories[template.cat],
          userId,
          date: new Date(y, m - 1, day),
        },
      });
      count++;
    }
  }
  console.log(`✓ ${count} expenses seeded`);

  // Seed budgets for alice (current month May 2026)
  const aliceId = users["alice@example.com"];
  const budgetAmounts: Record<string, number> = {
    Food: 400, Transport: 200, Housing: 1500, Entertainment: 100, Healthcare: 150,
  };
  for (const [catName, amount] of Object.entries(budgetAmounts)) {
    await db.budget.upsert({
      where: { userId_categoryId_month_year: { userId: aliceId, categoryId: categories[catName], month: 5, year: 2026 } },
      update: { amount },
      create: { userId: aliceId, categoryId: categories[catName], month: 5, year: 2026, amount },
    });
  }
  console.log("✓ Budgets seeded for alice");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
