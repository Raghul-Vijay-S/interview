const configuredApiUrl = import.meta.env.VITE_API_URL as string | undefined;
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

const STORAGE_KEYS = {
  token: "nexvora_token",
  currentUser: "nexvora_user",
  users: "nexvora_users_db",
  analysis: "nexvora_analysis",
  chats: "nexvora_chats",
  interviews: "nexvora_interviews",
  coding: "nexvora_coding_history",
  roadmap: "nexvora_roadmap"
};

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const mockDb = {
  getCurrentUser(): User | null {
    return getStorage<User | null>(STORAGE_KEYS.currentUser, null);
  },

  register(email: string): { token: string; user: User } {
    const users = getStorage<Record<string, User>>(STORAGE_KEYS.users, {});
    const existing = users[email.toLowerCase()];
    if (existing) {
      setStorage(STORAGE_KEYS.currentUser, existing);
      localStorage.setItem(STORAGE_KEYS.token, "demo-token-" + Date.now());
      return { token: "demo-token-" + Date.now(), user: existing };
    }
    const newUser: User = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      email,
      name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      languages: ["JavaScript", "TypeScript", "Python"],
      onboarded: false,
      targetRole: "Software Engineer",
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`
    };
    users[email.toLowerCase()] = newUser;
    setStorage(STORAGE_KEYS.users, users);
    setStorage(STORAGE_KEYS.currentUser, newUser);
    localStorage.setItem(STORAGE_KEYS.token, "demo-token-" + Date.now());
    return { token: "demo-token-" + Date.now(), user: newUser };
  },

  login(email: string): { token: string; user: User } {
    return this.register(email);
  },

  onboarding(payload: Partial<User>): { user: User } {
    const current = this.getCurrentUser() || {
      id: "usr_guest",
      email: "guest@nexvora.ai",
      name: "Guest Engineer",
      languages: [],
      onboarded: false,
      targetRole: "Software Engineer"
    };
    const updated: User = { ...current, ...payload, onboarded: true };
    setStorage(STORAGE_KEYS.currentUser, updated);
    return { user: updated };
  },

  profile(payload: Partial<User>): { user: User } {
    const current = this.getCurrentUser() || {
      id: "usr_guest",
      email: "guest@nexvora.ai",
      name: "Guest Engineer",
      languages: [],
      onboarded: true,
      targetRole: "Software Engineer"
    };
    const updated: User = { ...current, ...payload };
    setStorage(STORAGE_KEYS.currentUser, updated);
    return { user: updated };
  },

  dashboard() {
    const user = this.getCurrentUser();
    const defaultAnalysis: Analysis = {
      score: 85,
      atsScore: 88,
      skills: ["React", "TypeScript", "Node.js", "Python", "SQL", "Tailwind CSS", "Git"],
      strengths: ["Strong full-stack foundations", "Solid algorithmic problem-solving", "Clean component architecture"],
      weaknesses: ["Add more cloud orchestration exposure (Docker, AWS)", "Quantify business impacts in bullet points"],
      missingSkills: ["Docker", "Kubernetes", "Redis", "CI/CD Pipelines"],
      suggestions: ["Add performance metrics to project descriptions", "Include automated testing achievements"],
      targetRole: user?.targetRole || "Software Engineer",
      companyReadiness: { Google: 78, Amazon: 82, Microsoft: 85, Zoho: 90, TCS: 94, Infosys: 92 }
    };
    const analysis = getStorage<Analysis>(STORAGE_KEYS.analysis, defaultAnalysis) || defaultAnalysis;
    const chats = getStorage<any[]>(STORAGE_KEYS.chats, []);
    const coding = getStorage<any[]>(STORAGE_KEYS.coding, []);
    const interviews = getStorage<any[]>(STORAGE_KEYS.interviews, []);
    const roadmap = getStorage<any | null>(STORAGE_KEYS.roadmap, null);

    const resumeScore = analysis.score;
    const interviewReadiness = interviews[0] ? Math.round(((interviews[0].technicalScore || 80) + (interviews[0].communicationScore || 85)) / 2) : 82;
    const skillScore = Math.min(96, 50 + analysis.skills.length * 6);
    const placementProbability = Math.round((resumeScore + interviewReadiness + skillScore) / 3);

    return {
      user,
      resume: { fileName: "Resume_2026.pdf", createdAt: new Date().toISOString() },
      analysis,
      chats,
      coding,
      interviews,
      roadmap,
      metrics: { resumeScore, interviewReadiness, skillScore, placementProbability },
      analytics: {
        skillGrowth: [
          { week: "W1", value: 62 },
          { week: "W2", value: 71 },
          { week: "W3", value: 79 },
          { week: "W4", value: skillScore }
        ],
        weeklyPerformance: [
          { day: "Mon", coding: 45, interview: 40 },
          { day: "Tue", coding: 60, interview: 52 },
          { day: "Wed", coding: 72, interview: 65 },
          { day: "Thu", coding: 80, interview: 74 },
          { day: "Fri", coding: 88, interview: interviewReadiness }
        ]
      }
    };
  },

  uploadResume(file: File): { resume: any; analysis: Analysis } {
    const analysis: Analysis = {
      score: 86,
      atsScore: 89,
      skills: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Tailwind CSS", "Git", "REST APIs"],
      strengths: ["Clear project technical stack", "Structured layout easily parsed by ATS", "Solid frontend architecture"],
      weaknesses: ["Highlight more measurable impact metrics", "Elaborate on database optimization"],
      missingSkills: ["Docker", "Kubernetes", "AWS/Cloud", "Microservices"],
      suggestions: ["Quantify achievements (e.g. improved performance by 35%)", "Add cloud deployment certifications"],
      targetRole: "Full Stack Engineer",
      companyReadiness: { Google: 80, Amazon: 84, Microsoft: 86, Zoho: 92, TCS: 95, Infosys: 94 }
    };
    setStorage(STORAGE_KEYS.analysis, analysis);
    return {
      resume: { fileName: file.name, size: file.size, createdAt: new Date().toISOString() },
      analysis
    };
  },

  chat(text: string): { message: any } {
    const chats = getStorage<any[]>(STORAGE_KEYS.chats, []);
    const userMsg = { id: "msg_" + Date.now(), role: "user", content: text };
    let replyContent = "Based on your technical profile, focusing on system architecture, data structures, and concrete production metrics will strengthen your interviews significantly.";
    const lower = text.toLowerCase();
    if (lower.includes("google") || lower.includes("amazon") || lower.includes("microsoft")) {
      replyContent = "For top tier tech companies, prioritize LeetCode Medium/Hard algorithmic questions, system design fundamentals (caching, load balancing, sharding), and STAR-method behavioral responses.";
    } else if (lower.includes("resume") || lower.includes("score") || lower.includes("ats")) {
      replyContent = "Your ATS readability is high! To reach a 95+ score, replace passive verbs with strong action words and add measurable metrics (latency reduction, user scale, efficiency gains).";
    } else if (lower.includes("project") || lower.includes("cert")) {
      replyContent = "Recommended next steps: 1) Deploy a distributed caching system with Redis, 2) Set up a CI/CD pipeline with GitHub Actions and Docker, 3) Add unit and integration tests with Jest.";
    }
    const botMsg = { id: "msg_" + (Date.now() + 1), role: "assistant", content: replyContent };
    chats.push(userMsg, botMsg);
    setStorage(STORAGE_KEYS.chats, chats);
    return { message: botMsg };
  },

  startInterview(company: string, role: string) {
    const questions = [
      { id: "q1", type: "Technical", question: `Explain how you would design a scalable, low-latency API architecture for ${company} dealing with millions of concurrent requests.` },
      { id: "q2", type: "Core Concepts", question: "What are the core differences between optimistic locking and pessimistic locking in distributed databases?" },
      { id: "q3", type: "Problem Solving", question: `How would you troubleshoot and resolve memory leaks and performance bottlenecks in a modern production ${role} application?` },
      { id: "q4", type: "Behavioral", question: "Describe a situation where you had a significant technical disagreement with a team member. How did you arrive at the best solution?" },
      { id: "q5", type: "Company Culture", question: `Why do you specifically want to join ${company}, and how do your technical values align with our engineering philosophy?` }
    ];
    return { questions };
  },

  submitInterview(payload: any) {
    const interview = {
      id: "int_" + Date.now(),
      company: payload.company || "Google",
      role: payload.role || "Software Engineer",
      technicalScore: 88,
      communicationScore: 92,
      confidenceScore: 85,
      feedback: `Strong performance on ${payload.company} interview! Your technical depth on architectural trade-offs was persuasive, and your structured articulation demonstrated senior engineering mindset.`
    };
    const list = getStorage<any[]>(STORAGE_KEYS.interviews, []);
    list.unshift(interview);
    setStorage(STORAGE_KEYS.interviews, list);
    return { interview };
  },

  coding(difficulty: string, category: string) {
    const codingQuestions: Record<string, { prompt: string; solution: string; explanation: string; feedback: string }> = {
      Arrays: {
        prompt: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target (${difficulty}).`,
        solution: "function twoSum(nums: number[], target: number): number[] {\n  const map = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp)!, i];\n    map.set(nums[i], i);\n  }\n  return [];\n}",
        explanation: "Hash map provides O(n) linear time complexity and O(n) space complexity by tracking visited complements.",
        feedback: "Optimal single-pass hash table approach. Excellent time complexity."
      },
      Strings: {
        prompt: `Determine if a string s is a valid palindrome, considering only alphanumeric characters and ignoring cases (${difficulty}).`,
        solution: "function isPalindrome(s: string): boolean {\n  const clean = s.replace(/[^a-z0-9]/gi, '').toLowerCase();\n  let l = 0, r = clean.length - 1;\n  while (l < r) {\n    if (clean[l++] !== clean[r--]) return false;\n  }\n  return true;\n}",
        explanation: "Two-pointer technique operating from both ends inwards achieves O(n) time and O(1) auxiliary space.",
        feedback: "Clean two-pointer implementation with appropriate regex sanitization."
      },
      SQL: {
        prompt: `Write a SQL query to find the second highest salary from the Employee table (${difficulty}).`,
        solution: "SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);",
        explanation: "Subquery filtering ensures that even if duplicates exist, the true distinct second highest salary is returned cleanly.",
        feedback: "Direct and portable across PostgreSQL, MySQL, and SQLite."
      }
    };

    const selected = codingQuestions[category] || {
      prompt: `Implement an efficient algorithm for ${category} problem at ${difficulty} level with optimal time complexity.`,
      solution: `// Solution for ${category} (${difficulty})\nexport function solve(input: unknown): boolean {\n  return true;\n}`,
      explanation: `Efficient traversal algorithm customized for ${category} with linear performance.`,
      feedback: `Solid algorithmic foundation for ${difficulty} level.`
    };

    const question = {
      id: "code_" + Date.now(),
      difficulty,
      category,
      ...selected
    };

    const history = getStorage<any[]>(STORAGE_KEYS.coding, []);
    history.unshift(question);
    setStorage(STORAGE_KEYS.coding, history);

    return { question };
  },

  roadmap() {
    return {
      roadmap: {
        role: "Senior Full Stack AI Engineer",
        milestones: [
          { phase: "Month 1", title: "DSA & Core Patterns", items: ["Blind 75 algorithms", "Hash maps & two-pointers", "Dynamic programming patterns"] },
          { phase: "Month 2", title: "System Design & Cloud", items: ["Microservices vs Monoliths", "Redis caching & pub/sub", "Docker containerization"] },
          { phase: "Month 3", title: "Mock Interviews & Production", items: ["Company rounds (Google, Zoho)", "Full-stack resume portfolio", "Behavioral STAR responses"] }
        ]
      }
    };
  }
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("nexvora_token");
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let tryFetch = true;
  // If configuredApiUrl is empty and we are running in production (e.g. Vercel),
  // skip trying the local /api endpoint which returns HTML, and use instant mockDb.
  if (!configuredApiUrl && typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    tryFetch = false;
  }

  if (tryFetch) {
    try {
      const response = await fetch(`${API_URL}${path}`, { ...options, headers });
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.includes("application/json")) {
        const json = await response.json();
        return json.data as T;
      }
    } catch {
      // Fall through to local fallback
    }
  }

  // --- Local Fallback Engine ---
  const body = options.body && typeof options.body === "string" ? JSON.parse(options.body) : {};

  if (path === "/auth/register") return mockDb.register(body.email || "user@example.com") as T;
  if (path === "/auth/login") return mockDb.login(body.email || "user@example.com") as T;
  if (path === "/auth/me") {
    const user = mockDb.getCurrentUser() || mockDb.register("guest@nexvora.ai").user;
    return { user } as T;
  }
  if (path === "/user/onboarding") return mockDb.onboarding(body) as T;
  if (path === "/user/profile") return mockDb.profile(body) as T;
  if (path === "/dashboard") return mockDb.dashboard() as T;
  if (path === "/resume/upload") {
    const file = (options.body as FormData)?.get("resume") as File || new File(["dummy"], "resume.pdf");
    return mockDb.uploadResume(file) as T;
  }
  if (path === "/ai/chat" && options.method === "POST") return mockDb.chat(body.message || "") as T;
  if (path === "/ai/chat") return { messages: getStorage(STORAGE_KEYS.chats, []) } as T;
  if (path === "/ai/roadmap") return mockDb.roadmap() as T;
  if (path === "/practice/coding" && options.method === "POST") return mockDb.coding(body.difficulty || "Medium", body.category || "Arrays") as T;
  if (path === "/practice/coding") return { questions: getStorage(STORAGE_KEYS.coding, []) } as T;
  if (path === "/interview/start") return mockDb.startInterview(body.company || "Google", body.role || "Software Engineer") as T;
  if (path === "/interview/submit") return mockDb.submitInterview(body) as T;
  if (path === "/interview/history") return { interviews: getStorage(STORAGE_KEYS.interviews, []) } as T;

  throw new ApiError("Endpoint not supported in demo mode");
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
