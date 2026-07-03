import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import app from "./app";
import * as expenseService from "./modules/expenses/expense.service";
import { generateAPIError } from "./utils/apiError";

vi.mock("./modules/expenses/expense.service", () => ({
  createExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getExpenseSummary: vi.fn(),
  listCategories: vi.fn(),
  listExpenses: vi.fn(),
}));

const mockedExpenseService = vi.mocked(expenseService);

const mockCategory = {
  id: "1",
  name: "Food",
  slug: "food",
};

const mockExpense = {
  id: "10",
  categoryId: mockCategory.id,
  category: mockCategory,
  amount: "12.50",
  expenseDate: "2026-07-03T00:00:00.000Z",
  note: "Coffee",
  createdAt: "2026-07-03T10:00:00.000Z",
  updatedAt: "2026-07-03T10:00:00.000Z",
};

describe("app routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns a standard 404 response for unknown routes", async () => {
    const response = await request(app).get("/missing-route");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Route not found: GET /missing-route",
    });
  });

  it("creates an expense with a validated payload", async () => {
    mockedExpenseService.createExpense.mockResolvedValue(mockExpense);

    const response = await request(app).post("/api/expenses").send({
      amount: "12.50",
      categoryId: "1",
      date: "2026-07-03",
      note: "  Coffee  ",
    });

    expect(response.status).toBe(201);
    expect(mockedExpenseService.createExpense).toHaveBeenCalledWith({
      amount: "12.5",
      categoryId: "1",
      date: "2026-07-03",
      note: "Coffee",
    });
    expect(response.body).toEqual({
      success: true,
      message: "Expense created successfully",
      data: { expense: mockExpense },
    });
  });

  it("rejects an invalid create expense payload", async () => {
    const response = await request(app).post("/api/expenses").send({
      amount: "-1",
      categoryId: "0",
      date: "2026-02-30",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "amount" }),
        expect.objectContaining({ field: "categoryId" }),
        expect.objectContaining({ field: "date" }),
      ]),
    );
    expect(mockedExpenseService.createExpense).not.toHaveBeenCalled();
  });

  it("rejects an amount of exactly zero", async () => {
    const response = await request(app).post("/api/expenses").send({
      amount: "0",
      categoryId: "1",
      date: "2026-07-03",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "amount" })]),
    );
    expect(mockedExpenseService.createExpense).not.toHaveBeenCalled();
  });

  it("enforces the note max length", async () => {
    const response = await request(app).post("/api/expenses").send({
      amount: "12.50",
      categoryId: "1",
      date: "2026-07-03",
      note: "x".repeat(501),
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "note" })]),
    );
    expect(mockedExpenseService.createExpense).not.toHaveBeenCalled();
  });

  it("lists expenses with validated query filters", async () => {
    mockedExpenseService.listExpenses.mockResolvedValue([mockExpense]);

    const response = await request(app).get("/api/expenses").query({
      categoryId: "1",
      from: "2026-07-01",
      to: "2026-07-03",
      search: " coffee ",
    });

    expect(response.status).toBe(200);
    expect(mockedExpenseService.listExpenses).toHaveBeenCalledWith({
      categoryId: "1",
      from: "2026-07-01",
      to: "2026-07-03",
      search: "coffee",
    });
    expect(response.body).toEqual({
      success: true,
      data: { expenses: [mockExpense] },
    });
  });

  it("returns an empty array when no expenses match the filters", async () => {
    mockedExpenseService.listExpenses.mockResolvedValue([]);

    const response = await request(app).get("/api/expenses").query({
      categoryId: "1",
      search: "does-not-exist",
    });

    expect(response.status).toBe(200);
    expect(mockedExpenseService.listExpenses).toHaveBeenCalledWith({
      categoryId: "1",
      search: "does-not-exist",
    });
    expect(response.body).toEqual({
      success: true,
      data: { expenses: [] },
    });
  });

  it("accepts a date range where from equals to", async () => {
    mockedExpenseService.listExpenses.mockResolvedValue([mockExpense]);

    const response = await request(app).get("/api/expenses").query({
      from: "2026-07-03",
      to: "2026-07-03",
    });

    expect(response.status).toBe(200);
    expect(mockedExpenseService.listExpenses).toHaveBeenCalledWith({
      from: "2026-07-03",
      to: "2026-07-03",
    });
    expect(response.body).toEqual({
      success: true,
      data: { expenses: [mockExpense] },
    });
  });

  it("rejects an invalid expenses date range", async () => {
    const response = await request(app).get("/api/expenses").query({
      from: "2026-07-03",
      to: "2026-07-01",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.details).toEqual([
      {
        field: "",
        message: "from must be earlier than or equal to to",
      },
    ]);
    expect(mockedExpenseService.listExpenses).not.toHaveBeenCalled();
  });

  it("rejects conflicting duplicate categoryId query params", async () => {
    const response = await request(app).get("/api/expenses?categoryId=1&categoryId=2");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "categoryId" })]),
    );
    expect(mockedExpenseService.listExpenses).not.toHaveBeenCalled();
  });

  it("deletes an expense by id", async () => {
    mockedExpenseService.deleteExpense.mockResolvedValue(undefined);

    const response = await request(app).delete("/api/expenses/10");

    expect(response.status).toBe(200);
    expect(mockedExpenseService.deleteExpense).toHaveBeenCalledWith("10");
    expect(response.body).toEqual({
      success: true,
      message: "Expense deleted successfully",
      data: null,
    });
  });

  it("rejects an invalid expense id", async () => {
    const response = await request(app).delete("/api/expenses/abc");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.details).toEqual([
      expect.objectContaining({ field: "id" }),
    ]);
    expect(mockedExpenseService.deleteExpense).not.toHaveBeenCalled();
  });

  it("returns 404 when deleting a valid-format id that does not exist", async () => {
    mockedExpenseService.deleteExpense.mockRejectedValue(
      generateAPIError("Expense not found", 404),
    );

    const response = await request(app).delete("/api/expenses/99999");

    expect(response.status).toBe(404);
    expect(mockedExpenseService.deleteExpense).toHaveBeenCalledWith("99999");
    expect(response.body).toEqual({
      success: false,
      message: "Expense not found",
    });
  });

  it("returns expense summary", async () => {
    const summary = [
      {
        category: mockCategory,
        totalSpend: "12.50",
        expenseCount: 1,
      },
    ];
    mockedExpenseService.getExpenseSummary.mockResolvedValue(summary);

    const response = await request(app).get("/api/summary");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { summary },
    });
  });

  it("returns categories", async () => {
    mockedExpenseService.listCategories.mockResolvedValue([mockCategory]);

    const response = await request(app).get("/api/categories");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { categories: [mockCategory] },
    });
  });

  it("returns API errors thrown by mocked services", async () => {
    mockedExpenseService.createExpense.mockRejectedValue(
      generateAPIError("Expense category not found", 404),
    );

    const response = await request(app).post("/api/expenses").send({
      amount: "12.50",
      categoryId: "999",
      date: "2026-07-03",
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Expense category not found",
    });
  });
});

