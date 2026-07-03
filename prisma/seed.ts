import { disconnectDatabase, prisma } from "../src/config/database";

const expenseCategories = [
  { name: "Food", slug: "food" },
  { name: "Transport", slug: "transport" },
  { name: "Shopping", slug: "shopping" },
  { name: "Bills", slug: "bills" },
  { name: "Health", slug: "health" },
  { name: "Others", slug: "others" },
];

async function main(): Promise<void> {
  for (const category of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }
}

main()
  .catch((error) => {
    console.error("Failed to seed expense categories", error);
  })
  .finally(async () => {
    await disconnectDatabase();
  });