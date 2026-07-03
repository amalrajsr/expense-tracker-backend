import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createExpenseController,
  deleteExpenseController,
  getExpenseSummaryController,
  listCategoriesController,
  listExpensesController,
} from "./expense.controller";
import {
  createExpenseSchema,
  expenseIdParamSchema,
  listExpensesQuerySchema,
  validateRequest,
} from "./expense.validation";

const router = Router();

router.post(
  "/expenses",
  validateRequest(createExpenseSchema, "body"),
  asyncHandler(createExpenseController),
);

router.get(
  "/expenses",
  validateRequest(listExpensesQuerySchema, "query"),
  asyncHandler(listExpensesController),
);

router.delete(
  "/expenses/:id",
  validateRequest(expenseIdParamSchema, "params"),
  asyncHandler(deleteExpenseController),
);

router.get("/summary", asyncHandler(getExpenseSummaryController));
router.get("/categories", asyncHandler(listCategoriesController));

export default router;

