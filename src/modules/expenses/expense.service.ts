import { prisma } from "../../config/database";
import { Prisma } from "../../prisma/client";
import { generateAPIError } from "../../utils/apiError";

export type CreateExpenseInput = {
  amount: string;
  categoryId: string;
  date: string;
  note?: string | null;
};

export type ListExpenseFilters = {
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
};

type CategoryRecord = {
  id: bigint | number;
  name: string;
  slug: string;
};

type ExpenseRecord = {
  id: bigint | number;
  categoryId: bigint | number;
  amount: { toString(): string };
  expenseDate: Date;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: CategoryRecord;
};

function formatId(id: bigint | number): string {
  return id.toString();
}

function formatMoney(value: { toString(): string } | null | undefined): string {
  const amount = value?.toString() ?? "0";
  const [whole, fraction = ""] = amount.split(".");

  return `${whole}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

function formatCategory(category: CategoryRecord) {
  return {
    id: formatId(category.id),
    name: category.name,
    slug: category.slug,
  };
}

function formatExpense(expense: ExpenseRecord) {
  return {
    id: formatId(expense.id),
    categoryId: formatId(expense.categoryId),
    category: formatCategory(expense.category),
    amount: formatMoney(expense.amount),
    expenseDate: expense.expenseDate.toISOString(),
    note: expense.note,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

function parseExpenseDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  return new Date(value);
}

function parseDateBoundary(value: string, endOfDay: boolean): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  }

  return new Date(value);
}

async function resolveCategoryById(categoryId: string) {
  const category = await prisma.expenseCategory.findUnique({
    where: { id: BigInt(categoryId) },
  });

  if (!category) {
    throw generateAPIError("Expense category not found", 404);
  }

  return category;
}

function buildExpenseWhere(filters: ListExpenseFilters): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {};

  if (filters.categoryId) {
    where.categoryId = BigInt(filters.categoryId);
  }

  if (filters.search?.trim()) {
    where.note = { contains: filters.search.trim() };
  }

  if (filters.from || filters.to) {
    where.expenseDate = {};

    if (filters.from) {
      where.expenseDate.gte = parseDateBoundary(filters.from, false);
    }

    if (filters.to) {
      where.expenseDate.lte = parseDateBoundary(filters.to, true);
    }
  }

  return where;
}

export async function createExpense(input: CreateExpenseInput) {
  const category = await resolveCategoryById(input.categoryId);
  const expenseDate = parseExpenseDate(input.date);
  const note = input.note?.trim() ? input.note.trim() : null;

  const expense = await prisma.expense.create({
    data: {
      amount: input.amount,
      categoryId: category.id,
      expenseDate,
      note,
    },
    include: {
      category: true,
    },
  });

  return formatExpense(expense);
}

export async function listExpenses(filters: ListExpenseFilters) {
  const expenses = await prisma.expense.findMany({
    where: buildExpenseWhere(filters),
    include: {
      category: true,
    },
    orderBy: [{ expenseDate: "desc" }, { id: "desc" }],
  });

  return expenses.map(formatExpense);
}

export async function deleteExpense(id: string) {
  const result = await prisma.expense.deleteMany({
    where: { id: BigInt(id) },
    limit: 1,
  });

  if (result.count === 0) {
    throw generateAPIError("Expense not found", 404);
  }
}

export async function getExpenseSummary() {
  const [categories, totals] = await prisma.$transaction([
    prisma.expenseCategory.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const totalByCategoryId = new Map(
    totals.map((total) => [
      formatId(total.categoryId),
      {
        totalSpend: formatMoney(total._sum.amount),
        expenseCount: total._count._all,
      },
    ]),
  );

  return categories.map((category) => {
    const categoryTotal = totalByCategoryId.get(formatId(category.id));

    return {
      category: formatCategory(category),
      totalSpend: categoryTotal?.totalSpend ?? "0.00",
      expenseCount: categoryTotal?.expenseCount ?? 0,
    };
  });
}

export async function listCategories() {
  const categories = await prisma.expenseCategory.findMany({
    orderBy: { name: "asc" },
  });

  return categories.map(formatCategory);
}

