import express from "express";
import { errorMiddleware } from "./middleware/error.middleware.js";
import cors from "cors"
import { env } from "./lib/env.js";
const app = express();

app.use(express.json());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

app.use("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use(errorMiddleware);

export default app;
