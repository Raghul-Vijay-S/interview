import { Router } from "express";
import { z } from "zod";
import { AiConfigurationError, generateCodingQuestion } from "../services/ai.js";
import { store } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthedRequest } from "../types.js";
import { fail, ok } from "../utils/http.js";

export const practiceRouter = Router();
practiceRouter.use(requireAuth);

practiceRouter.post("/coding", async (req: AuthedRequest, res) => {
  const schema = z.object({
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    category: z.enum(["Arrays", "Strings", "OOP", "Java", "SQL", "DBMS", "Operating Systems", "Networks"])
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !req.user) return fail(res, 400, "Choose a valid difficulty and category");
  try {
    const [resume, analysis, chatHistory, interviewHistory, codingHistory] = await Promise.all([
      store.latestResume(req.user.id),
      store.latestAnalysis(req.user.id),
      store.chatHistory(req.user.id),
      store.interviewHistory(req.user.id),
      store.codingHistory(req.user.id)
    ]);
    const generated = await generateCodingQuestion({
      difficulty: parsed.data.difficulty,
      category: parsed.data.category,
      context: { user: req.user, resumeText: resume?.rawText, analysis, chatHistory: chatHistory as never, interviewHistory, codingHistory }
    });
    const saved = await store.createCoding({ userId: req.user.id, ...generated });
    return ok(res, { question: saved });
  } catch (error) {
    if (error instanceof AiConfigurationError) return fail(res, 503, error.message);
    throw error;
  }
});

practiceRouter.get("/coding", async (req: AuthedRequest, res) => {
  if (!req.user) return fail(res, 401, "Authentication required");
  const questions = await store.codingHistory(req.user.id);
  return ok(res, { questions });
});
