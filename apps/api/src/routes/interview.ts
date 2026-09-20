import { Router } from "express";
import { z } from "zod";
import { AiConfigurationError, generateInterview, scoreInterview } from "../services/ai.js";
import { store } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthedRequest } from "../types.js";
import { fail, ok } from "../utils/http.js";

export const interviewRouter = Router();
interviewRouter.use(requireAuth);

interviewRouter.post("/start", async (req: AuthedRequest, res) => {
  const schema = z.object({
    company: z.enum(["Google", "Amazon", "TCS", "Infosys", "Zoho", "Microsoft"]),
    role: z.string().min(2)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !req.user) return fail(res, 400, "Choose a supported company and role");
  try {
    const [resume, analysis, chatHistory, interviewHistory, codingHistory] = await Promise.all([
      store.latestResume(req.user.id),
      store.latestAnalysis(req.user.id),
      store.chatHistory(req.user.id),
      store.interviewHistory(req.user.id),
      store.codingHistory(req.user.id)
    ]);
    const questions = await generateInterview({
      company: parsed.data.company,
      role: parsed.data.role,
      context: { user: req.user, resumeText: resume?.rawText, analysis, chatHistory: chatHistory as never, interviewHistory, codingHistory }
    });
    return ok(res, { questions });
  } catch (error) {
    if (error instanceof AiConfigurationError) return fail(res, 503, error.message);
    throw error;
  }
});

interviewRouter.post("/submit", async (req: AuthedRequest, res) => {
  const schema = z.object({
    company: z.enum(["Google", "Amazon", "TCS", "Infosys", "Zoho", "Microsoft"]),
    role: z.string().min(2),
    questions: z.array(z.unknown()),
    answers: z.array(z.string())
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !req.user) return fail(res, 400, "Submit interview questions and answers");
  try {
    const [resume, analysis, chatHistory, interviewHistory, codingHistory] = await Promise.all([
      store.latestResume(req.user.id),
      store.latestAnalysis(req.user.id),
      store.chatHistory(req.user.id),
      store.interviewHistory(req.user.id),
      store.codingHistory(req.user.id)
    ]);
    const scores = await scoreInterview({
      company: parsed.data.company,
      role: parsed.data.role,
      questions: parsed.data.questions,
      answers: parsed.data.answers,
      context: { user: req.user, resumeText: resume?.rawText, analysis, chatHistory: chatHistory as never, interviewHistory, codingHistory }
    });
    const interview = await store.createInterview({
      userId: req.user.id,
      company: parsed.data.company,
      role: parsed.data.role,
      questions: parsed.data.questions,
      answers: parsed.data.answers,
      ...scores
    });
    return ok(res, { interview });
  } catch (error) {
    if (error instanceof AiConfigurationError) return fail(res, 503, error.message);
    throw error;
  }
});

interviewRouter.get("/history", async (req: AuthedRequest, res) => {
  if (!req.user) return fail(res, 401, "Authentication required");
  const interviews = await store.interviewHistory(req.user.id);
  return ok(res, { interviews });
});
