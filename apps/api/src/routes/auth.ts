import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { store } from "../data/store.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import type { AuthedRequest } from "../types.js";
import { fail, ok } from "../utils/http.js";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "Use a valid email and password with at least 8 characters");
  const exists = await store.findUserByEmail(parsed.data.email);
  if (exists) return fail(res, 409, "Account already exists");
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await store.createUser({ email: parsed.data.email, passwordHash });
  return ok(res, { token: signToken(user.id), user: store.safeUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "Use a valid email and password");
  const user = await store.findUserByEmail(parsed.data.email);
  if (!user?.passwordHash) return fail(res, 401, "Invalid credentials");
  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return fail(res, 401, "Invalid credentials");
  return ok(res, { token: signToken(user.id), user: store.safeUser(user) });
});

authRouter.post("/google", async (req, res) => {
  if (!config.googleClientId) return fail(res, 501, "Google OAuth is not configured");
  const schema = z.object({ credential: z.string().min(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "Missing Google credential");
  const client = new OAuth2Client(config.googleClientId);
  const ticket = await client.verifyIdToken({ idToken: parsed.data.credential, audience: config.googleClientId });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) return fail(res, 401, "Invalid Google credential");
  let user = await store.findUserByEmail(payload.email);
  if (!user) {
    user = await store.createUser({ email: payload.email, googleId: payload.sub, name: payload.name, avatarUrl: payload.picture });
  }
  return ok(res, { token: signToken(user.id), user: store.safeUser(user) });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  return ok(res, { user: req.user });
});
