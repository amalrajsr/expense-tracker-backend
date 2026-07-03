import { Request, Response } from "express";
import {
  CreateExpenseInput,
  createExpense,
  deleteExpense,
  getExpenseSummary,
  listCategories,
  listExpenses,
} from "./expense.service";

export async function createExpenseController(
  req: Request,
  res: Response,
): Promise<void> {
  const payload: CreateExpenseInput = {
    amount: req.body.amount,
    categoryId: req.body.categoryId,
    date: req.body.date,
    note: req.body.note,
  };
  const expense = await createExpense(payload);

  res.status(201).json({
    success: true,
    message: "Expense created successfully",
    data: { expense },
  });
}

export async function listExpensesController(
  req: Request,
  res: Response,
): Promise<void> {
  const expenses = await listExpenses(req.query);

  res.status(200).json({
    success: true,
    data: { expenses },
  });
}

export async function deleteExpenseController(
  req: Request,
  res: Response,
): Promise<void> {
  await deleteExpense(String(req.params.id));

  res.status(200).json({
    success: true,
    message: "Expense deleted successfully",
    data: null,
  });
}

export async function getExpenseSummaryController(
  _req: Request,
  res: Response,
): Promise<void> {
  const summary = await getExpenseSummary();

  res.status(200).json({
    success: true,
    data: { summary },
  });
}

export async function listCategoriesController(
  _req: Request,
  res: Response,
): Promise<void> {
  const categories = await listCategories();

  res.status(200).json({
    success: true,
    data: { categories },
  });
}
