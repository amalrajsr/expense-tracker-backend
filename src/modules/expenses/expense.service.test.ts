import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteManyMock } = vi.hoisted(() => ({
  deleteManyMock: vi.fn(),
}));

vi.mock("../../config/database", () => ({
  prisma: {
    expense: {
      deleteMany: deleteManyMock,
    },
  },
}));

import { deleteExpense } from "./expense.service";

describe("expense service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws a 404 API error when deleting a valid-format id that does not exist", async () => {
    deleteManyMock.mockResolvedValue({ count: 0 });

    await expect(deleteExpense("99999")).rejects.toMatchObject({
      statusCode: 404,
      message: "Expense not found",
    });
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { id: BigInt("99999") },
      limit: 1,
    });
  });
});
