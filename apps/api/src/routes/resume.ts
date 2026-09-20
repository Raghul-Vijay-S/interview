import { Router } from "express";
import multer from "multer";
import { AiConfigurationError, analyzeResume } from "../services/ai.js";
import { store } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import { parseResume } from "../services/resumeParser.js";
import type { AuthedRequest } from "../types.js";
import { fail, ok } from "../utils/http.js";

export const resumeRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 7 * 1024 * 1024 } });

resumeRouter.use(requireAuth);

resumeRouter.post("/upload", upload.single("resume"), async (req: AuthedRequest, res) => {
  if (!req.user) return fail(res, 401, "Authentication required");
  if (!req.file) return fail(res, 400, "Upload a PDF or DOCX resume");
  try {
    const rawText = await parseResume(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (rawText.trim().length < 80) return fail(res, 400, "Could not read enough text from this resume. Try a text-based PDF or DOCX file.");
    const resume = await store.createResume({
      userId: req.user.id,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      rawText
    });
    const [chatHistory, interviewHistory, codingHistory] = await Promise.all([
      store.chatHistory(req.user.id),
      store.interviewHistory(req.user.id),
      store.codingHistory(req.user.id)
    ]);
    const analysis = await analyzeResume({
      resumeText: rawText,
      context: { user: req.user, resumeText: rawText, chatHistory: chatHistory as never, interviewHistory, codingHistory }
    });
    const saved = await store.createAnalysis({
      ...analysis,
      userId: req.user.id,
      resumeId: resume.id
    });
    return ok(res, { resume, analysis: saved });
  } catch (error) {
    if (error instanceof AiConfigurationError) return fail(res, 503, error.message);
    if (error instanceof Error) return fail(res, 400, `Resume upload failed: ${error.message}`);
    throw error;
  }
});

resumeRouter.get("/latest", async (req: AuthedRequest, res) => {
  if (!req.user) return fail(res, 401, "Authentication required");
  const resume = await store.latestResume(req.user.id);
  const analysis = await store.latestAnalysis(req.user.id);
  return ok(res, { resume, analysis });
});
