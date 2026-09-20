import { Router } from "express";
import { z } from "zod";
import { AiConfigurationError, assistantReply, generateRoadmap } from "../services/ai.js";
import { store } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthedRequest } from "../types.js";
import { fail, ok } from "../utils/http.js";

export const aiRouter = Router();
aiRouter.use(requireAuth);

aiRouter.get("/chat", async (req: AuthedRequest, res) => {
  if (!req.user) return fail(res, 401, "Authentication required");
  const messages = await store.chatHistory(req.user.id);
  return ok(res, { messages });
});

aiRouter.post("/chat", async (req: AuthedRequest, res) => {
  const schema = z.object({ message: z.string().min(2) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !req.user) return fail(res, 400, "Message is required");
  await store.createChat({ userId: req.user.id, role: "user", content: parsed.data.message });
  try {
    const [resume, analysis, chatHistory, interviewHistory, codingHistory] = await Promise.all([
      store.latestResume(req.user.id),
      store.latestAnalysis(req.user.id),
      store.chatHistory(req.user.id),
      store.interviewHistory(req.user.id),
      store.codingHistory(req.user.id)
    ]);
    const content = await assistantReply({
      question: parsed.data.message,
      context: { user: req.user, resumeText: resume?.rawText, analysis, chatHistory: chatHistory as never, interviewHistory, codingHistory }
    });
    const assistant = await store.createChat({ userId: req.user.id, role: "assistant", content });
    return ok(res, { message: assistant });
  } catch (error) {
    if (error instanceof AiConfigurationError) return fail(res, 503, error.message);
    throw error;
  }
});

aiRouter.post("/roadmap", async (req: AuthedRequest, res) => {
  if (!req.user) return fail(res, 401, "Authentication required");
  try {
    const [resume, analysis, chatHistory, interviewHistory, codingHistory] = await Promise.all([
      store.latestResume(req.user.id),
      store.latestAnalysis(req.user.id),
      store.chatHistory(req.user.id),
      store.interviewHistory(req.user.id),
      store.codingHistory(req.user.id)
    ]);
    const milestones = await generateRoadmap({
      context: { user: req.user, resumeText: resume?.rawText, analysis, chatHistory: chatHistory as never, interviewHistory, codingHistory }
    });
    const roadmap = await store.upsertRoadmap({ userId: req.user.id, role: req.user.targetRole ?? "Software Engineer", milestones });
    return ok(res, { roadmap });
  } catch (error) {
    if (error instanceof AiConfigurationError) return fail(res, 503, error.message);
    throw error;
  }
});

aiRouter.get("/roadmap", async (req: AuthedRequest, res) => {
  if (!req.user) return fail(res, 401, "Authentication required");
  const roadmap = await store.roadmap(req.user.id);
  return ok(res, { roadmap });
});
