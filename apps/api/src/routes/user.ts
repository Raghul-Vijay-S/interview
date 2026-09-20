import { Router } from "express";
import { z } from "zod";
import { store } from "../data/store.js";
import { requireAuth } from "../middleware/auth.js";
import type { AuthedRequest } from "../types.js";
import { fail, ok } from "../utils/http.js";

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.put("/onboarding", async (req: AuthedRequest, res) => {
  const schema = z.object({
    name: z.string().min(2),
    degree: z.string().min(2),
    college: z.string().min(2),
    targetRole: z.string().min(2),
    languages: z.array(z.string()).min(1)
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !req.user) return fail(res, 400, "Complete all onboarding fields");
  const user = await store.updateUser(req.user.id, { ...parsed.data, onboarded: true });
  if (!user) return fail(res, 404, "User not found");
  return ok(res, { user: store.safeUser(user) });
});

userRouter.put("/profile", async (req: AuthedRequest, res) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    degree: z.string().optional(),
    college: z.string().optional(),
    targetRole: z.string().optional(),
    languages: z.array(z.string()).optional()
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !req.user) return fail(res, 400, "Invalid profile update");
  const user = await store.updateUser(req.user.id, parsed.data);
  if (!user) return fail(res, 404, "User not found");
  return ok(res, { user: store.safeUser(user) });
});
