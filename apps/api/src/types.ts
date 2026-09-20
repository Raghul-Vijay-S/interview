import type { Request } from "express";

export type SafeUser = {
  id: string;
  email: string;
  name?: string | null;
  degree?: string | null;
  college?: string | null;
  targetRole?: string | null;
  languages: string[];
  onboarded: boolean;
  avatarUrl?: string | null;
};

export type AuthedRequest = Request & {
  user?: SafeUser;
};

export type ResumeAnalysisPayload = {
  score: number;
  atsScore: number;
  skills: string[];
  education: unknown[];
  projects: unknown[];
  experience: unknown[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  suggestions: string[];
  targetRole: string;
  companyReadiness: Record<string, number>;
};

export type ChatMessagePayload = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};
