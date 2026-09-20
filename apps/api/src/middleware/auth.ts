import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { store } from "../data/store.js";
import type { AuthedRequest } from "../types.js";
import { fail } from "../utils/http.js";

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: "7d" });
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return fail(res, 401, "Authentication required");

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { sub?: string };
    if (!decoded.sub) return fail(res, 401, "Invalid token");
    const user = await store.findUserById(decoded.sub);
    if (!user) return fail(res, 401, "User not found");
    req.user = store.safeUser(user);
    return next();
  } catch {
    return fail(res, 401, "Invalid or expired token");
  }
}
