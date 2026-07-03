import express from "express";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import expenseRoutes from "./modules/expenses/expense.routes";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "DELETE"],
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", expenseRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
