import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { aiRouter } from "./routes/ai.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { interviewRouter } from "./routes/interview.js";
import { practiceRouter } from "./routes/practice.js";
import { resumeRouter } from "./routes/resume.js";
import { userRouter } from "./routes/user.js";

export const app = express();
if (config.nodeEnv === "production") app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin === config.clientOrigin) return callback(null, true);
    if (config.nodeEnv === "development" && /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 160 }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "nexvora-api" }));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/ai", aiRouter);
app.use("/api/practice", practiceRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
