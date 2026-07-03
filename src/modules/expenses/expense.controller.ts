import { Request, Response } from "express";
import {
  CreateExpenseInput,
  ListExpenseFilters,
  createExpense,
  deleteExpense,
  getExpenseSummary,
  listCategories,
  listExpenses,
} from "./expense.service";
import { getValidatedRequestData } from "./expense.validation";

type ExpenseIdParams = {
  id: string;
};

export async function createExpenseController(
  req: Request,
  res: Response,
): Promise<void> {
  const payload = getValidatedRequestData<CreateExpenseInput>(
    res,
    "body",
    req.body,
  );
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
  const filters = getValidatedRequestData<ListExpenseFilters>(
    res,
    "query",
    req.query,
  );
  const expenses = await listExpenses(filters);

  res.status(200).json({
    success: true,
    data: { expenses },
  });
}

export async function deleteExpenseController(
  req: Request,
  res: Response,
): Promise<void> {
  const params = getValidatedRequestData<ExpenseIdParams>(
    res,
    "params",
    req.params,
  );

  await deleteExpense(params.id);

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
