import { disconnectDatabase, prisma } from "../src/config/database";

const expenseCategories = [
  { name: "Food", slug: "food" },
  { name: "Transport", slug: "transport" },
  { name: "Shopping", slug: "shopping" },
  { name: "Bills", slug: "bills" },
  { name: "Health", slug: "health" },
  { name: "Others", slug: "others" },
];

const expenseSeeds = [
  { categorySlug: "food", amount: "450.75", date: "2026-07-01", note: "Lunch with team" },
  { categorySlug: "food", amount: "120.00", date: "2026-07-02", note: null },
  { categorySlug: "food", amount: "980.25", date: "2026-07-03", note: "Monthly groceries" },
  { categorySlug: "transport", amount: "85.00", date: "2026-07-01", note: "Metro card recharge" },
  { categorySlug: "transport", amount: "340.00", date: "2026-07-02", note: null },
  { categorySlug: "transport", amount: "1250.00", date: "2026-07-03", note: "Cab to airport" },
  { categorySlug: "shopping", amount: "2199.00", date: "2026-07-01", note: "Office shoes" },
  { categorySlug: "shopping", amount: "799.50", date: "2026-07-02", note: null },
  { categorySlug: "bills", amount: "1800.00", date: "2026-07-01", note: "Electricity bill" },
  { categorySlug: "bills", amount: "999.00", date: "2026-07-02", note: "Internet bill" },
  { categorySlug: "bills", amount: "650.00", date: "2026-07-03", note: null },
  { categorySlug: "health", amount: "550.00", date: "2026-07-01", note: "Pharmacy" },
  { categorySlug: "health", amount: "1200.00", date: "2026-07-02", note: "Doctor consultation" },
  { categorySlug: "others", amount: "300.00", date: "2026-07-01", note: null },
  { categorySlug: "others", amount: "1500.00", date: "2026-07-03", note: "Gift purchase" },
];

function parseExpenseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

async function main(): Promise<void> {
  const categories = await Promise.all(
    expenseCategories.map((category) =>
      prisma.expenseCategory.upsert({
        where: { slug: category.slug },
        update: { name: category.name },
        create: category,
      }),
    ),
  );

  const categoryBySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );

  await prisma.expense.deleteMany();

  await prisma.expense.createMany({
    data: expenseSeeds.map((expense) => {
      const category = categoryBySlug.get(expense.categorySlug);

      if (!category) {
        throw new Error(`Missing expense category: ${expense.categorySlug}`);
      }

      return {
        categoryId: category.id,
        amount: expense.amount,
        expenseDate: parseExpenseDate(expense.date),
        note: expense.note,
      };
    }),
  });
}

main()
  .catch((error) => {
    console.error("Failed to seed expense data", error);
  })
  .finally(async () => {
    await disconnectDatabase();
  });
