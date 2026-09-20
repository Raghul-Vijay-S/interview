import { Router } from "express";
import { store } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthedRequest } from "../types.js";
import { fail, ok } from "../utils/http.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (req: AuthedRequest, res) => {
  if (!req.user) return fail(res, 401, "Authentication required");
  const [resume, analysis, chats, coding, interviews, roadmap] = await Promise.all([
    store.latestResume(req.user.id),
    store.latestAnalysis(req.user.id),
    store.chatHistory(req.user.id),
    store.codingHistory(req.user.id),
    store.interviewHistory(req.user.id),
    store.roadmap(req.user.id)
  ]);

  const resumeScore = Number(analysis?.score ?? 0);
  const interviewReadiness = interviews[0] ? Math.round(((interviews[0].technicalScore as number) + (interviews[0].communicationScore as number)) / 2) : Math.max(35, resumeScore - 12);
  const skillScore = analysis?.skills ? Math.min(96, 45 + (analysis.skills as string[]).length * 6) : 0;
  const placementProbability = resumeScore ? Math.round((resumeScore + interviewReadiness + skillScore) / 3) : 0;

  return ok(res, {
    user: req.user,
    resume,
    analysis,
    chats,
    coding,
    interviews,
    roadmap,
    metrics: { resumeScore, interviewReadiness, skillScore, placementProbability },
    analytics: {
      skillGrowth: [
        { week: "W1", value: Math.max(20, skillScore - 24) },
        { week: "W2", value: Math.max(25, skillScore - 14) },
        { week: "W3", value: Math.max(30, skillScore - 6) },
        { week: "W4", value: skillScore || 38 }
      ],
      weeklyPerformance: [
        { day: "Mon", coding: 42, interview: 38 },
        { day: "Tue", coding: 54, interview: 46 },
        { day: "Wed", coding: 61, interview: 55 },
        { day: "Thu", coding: 70, interview: 64 },
        { day: "Fri", coding: 78, interview: interviewReadiness || 58 }
      ]
    }
  });
});
