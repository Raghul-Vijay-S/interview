const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;
// In development, Vite proxies this same-origin path to the local API. This
// keeps authentication working when the frontend is opened through a LAN or
// preview hostname instead of localhost.
const API_URL = configuredApiUrl || "/api";

export type User = {
  id: string;
  email: string;
  name?: string;
  degree?: string;
  college?: string;
  targetRole?: string;
  languages: string[];
  onboarded: boolean;
  avatarUrl?: string;
};

export type Analysis = {
  score: number;
  atsScore: number;
  skills: string[];
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  suggestions: string[];
  targetRole: string;
  companyReadiness: Record<string, number>;
};

export class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("nexvora_token");
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Unable to reach the authentication service. Please try again shortly.");
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(json.error ?? "Request failed");
  return json.data as T;
}

export const api = {
  register: (email: string, password: string) => request<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) => request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<{ user: User }>("/auth/me"),
  onboarding: (payload: Partial<User>) => request<{ user: User }>("/user/onboarding", { method: "PUT", body: JSON.stringify(payload) }),
  profile: (payload: Partial<User>) => request<{ user: User }>("/user/profile", { method: "PUT", body: JSON.stringify(payload) }),
  dashboard: () => request<any>("/dashboard"),
  uploadResume: (file: File) => {
    const form = new FormData();
    form.append("resume", file);
    return request<{ resume: any; analysis: Analysis }>("/resume/upload", { method: "POST", body: form });
  },
  chatHistory: () => request<{ messages: any[] }>("/ai/chat"),
  chat: (message: string) => request<{ message: any }>("/ai/chat", { method: "POST", body: JSON.stringify({ message }) }),
  generateRoadmap: () => request<{ roadmap: any }>("/ai/roadmap", { method: "POST" }),
  coding: (difficulty: string, category: string) => request<{ question: any }>("/practice/coding", { method: "POST", body: JSON.stringify({ difficulty, category }) }),
  codingHistory: () => request<{ questions: any[] }>("/practice/coding"),
  startInterview: (company: string, role: string) => request<{ questions: any[] }>("/interview/start", { method: "POST", body: JSON.stringify({ company, role }) }),
  submitInterview: (payload: any) => request<{ interview: any }>("/interview/submit", { method: "POST", body: JSON.stringify(payload) })
};
