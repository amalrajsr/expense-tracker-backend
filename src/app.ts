import express from "express";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import expenseRoutes from "./modules/expenses/expense.routes";
import "dotenv/config";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
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
