import express from "express";
import cors from "cors";

const app = express();

const getFrontendOrigin = () => process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: getFrontendOrigin(),
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "mithai-world backend is running"
  });
});

export default app;
