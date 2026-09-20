import OpenAI from "openai";
import { config } from "../config.js";
import type { ResumeAnalysisPayload, SafeUser } from "../types.js";
import { localResumeAnalysis as trainedLocalResumeAnalysis, trainedRoleProfiles } from "./resumeModel.js";

const openAiClient = config.openAiKey ? new OpenAI({ apiKey: config.openAiKey }) : null;

type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AiContext = {
  user: SafeUser;
  resumeText?: string;
  analysis?: unknown;
  chatHistory?: AiChatMessage[];
  interviewHistory?: unknown[];
  codingHistory?: unknown[];
};

export class AiConfigurationError extends Error {
  constructor() {
    super("Configure OPENAI_API_KEY or GEMINI_API_KEY to generate dynamic AI responses.");
  }
}

function ensureProvider() {
  if (!openAiClient && !config.geminiApiKey) throw new AiConfigurationError();
}

function extractJson(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced ?? trimmed;
  const start = Math.min(
    ...["{", "["].map((char) => {
      const index = candidate.indexOf(char);
      return index === -1 ? Number.POSITIVE_INFINITY : index;
    })
  );
  const json = Number.isFinite(start) ? candidate.slice(start) : candidate;
  return JSON.parse(json);
}

function compactContext(context: AiContext) {
  return {
    userProfile: {
      name: context.user.name,
      degree: context.user.degree,
      college: context.user.college,
      targetRole: context.user.targetRole,
      languages: context.user.languages
    },
    latestResumeText: context.resumeText?.slice(0, 14000),
    latestResumeAnalysis: context.analysis,
    recentChatHistory: context.chatHistory?.slice(-18),
    previousInterviewSessions: context.interviewHistory?.slice(0, 10),
    previousCodingQuestions: context.codingHistory?.slice(0, 12)
  };
}

function localAssistantReply(input: { question: string; context: AiContext }) {
  const question = input.question.trim();
  const normalized = question.toLowerCase();
  const role = input.context.user.targetRole ?? "Software Engineer";
  const languages = input.context.user.languages?.filter(Boolean).slice(0, 3) ?? [];
  const analysis = input.context.analysis && typeof input.context.analysis === "object"
    ? input.context.analysis as { skills?: string[]; missingSkills?: string[]; weaknesses?: string[]; suggestions?: string[] }
    : undefined;
  const skills = analysis?.skills?.slice(0, 3) ?? languages;
  const gaps = analysis?.missingSkills?.slice(0, 3) ?? [];
  const history = input.context.chatHistory ?? [];
  const priorQuestions = history.filter((message) => message.role === "user").map((message) => message.content.toLowerCase());
  const isRepeat = priorQuestions.slice(0, -1).some((message) => message === normalized);
  const stack = skills.length ? skills.join(", ") : "the core stack in your strongest project";
  const gap = gaps[0] ?? "data structures and problem solving";

  if (/\b(resume|cv|ats|bullet)\b/.test(normalized)) {
    return `For a ${role} resume, make every bullet prove impact. Pick one ${stack} project and rewrite a bullet as: “Built [feature] with [technology], which improved [metric] by [number].”\n\nNext actions:\n1. Add 2 quantified bullets to your best project.\n2. Put ${gap} only if you can discuss it in an interview.\n3. Match the top 5 keywords from the job description naturally in your summary and project bullets.`;
  }

  if (/\b(interview|hr|introduce|tell me|answer)\b/.test(normalized)) {
    return `For a ${role} interview, use a short STAR structure: situation, action, result. Prepare one story about a difficult ${stack} decision, one collaboration story, and one failure you improved from.\n\nPractice answer: “I built [project] using [stack]. The challenge was [problem], so I [specific action]. The result was [measurable outcome].”\n\nSend me one project from your resume and I’ll turn it into a 60-second answer.`;
  }

  if (/\b(code|coding|dsa|algorithm|leetcode|program)\b/.test(normalized)) {
    return `Here is a focused ${role} coding plan:\n1. Spend 30 minutes on arrays, strings, and hash maps.\n2. Spend 20 minutes explaining the brute-force and optimized solution aloud.\n3. Spend 10 minutes recording mistakes in a review note.\n\nThis week, prioritize ${gap}, then solve 2 medium problems using ${stack}. Aim to explain time and space complexity before writing code.`;
  }

  if (/\b(improve|improvement|better|tips|help|guide|plan)\b/.test(normalized)) {
    const repeatNote = isRepeat ? " Since you asked for a different direction, this plan focuses on execution rather than generic advice." : "";
    return `To improve as a ${role}, work in a weekly loop:${repeatNote}\n\n• Build: extend one ${stack} project with a user-facing feature.\n• Practice: solve 5 focused problems around ${gap}.\n• Explain: write one project case study with the problem, trade-offs, and measurable result.\n• Review: do one mock interview and list the 3 answers that need evidence.\n\nFor today: choose one project, add a small feature, and write down one metric you can measure. What project are you working on?`;
  }

  return `I can help you make progress toward a ${role} role. Based on your profile, start with ${stack} and strengthen ${gap}.\n\nTell me which of these you want next: a resume review, a 7-day learning plan, a coding problem, or a mock interview question. If you share a project or job description, I’ll tailor the answer to it.`;
}

async function generateWithOpenAi(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], json: boolean) {
  if (!openAiClient) return null;
  const response = await openAiClient.chat.completions.create({
    model: config.openAiModel,
    temperature: 0.85,
    presence_penalty: 0.55,
    frequency_penalty: 0.35,
    messages,
    ...(json ? { response_format: { type: "json_object" as const } } : {})
  });
  return response.choices[0]?.message.content ?? "";
}

async function generateWithGemini(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], json: boolean) {
  if (!config.geminiApiKey) return null;
  const prompt = messages.map((message) => `${message.role.toUpperCase()}:\n${typeof message.content === "string" ? message.content : JSON.stringify(message.content)}`).join("\n\n");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.85,
        responseMimeType: json ? "application/json" : "text/plain"
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    })
  });
  if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
  const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
}

async function generateText(system: string, user: string) {
  ensureProvider();
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    { role: "user", content: user }
  ];
  const content = await generateWithOpenAi(messages, false) ?? await generateWithGemini(messages, false);
  if (!content?.trim()) throw new Error("AI provider returned an empty response");
  return content.trim();
}

async function generateJson<T>(system: string, user: string) {
  ensureProvider();
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: `${system}\nReturn only valid JSON. Do not wrap it in markdown.` },
    { role: "user", content: user }
  ];
  const content = await generateWithOpenAi(messages, true) ?? await generateWithGemini(messages, true);
  if (!content?.trim()) throw new Error("AI provider returned an empty response");
  return extractJson(content) as T;
}

function assertAnalysis(value: ResumeAnalysisPayload) {
  const requiredArrays = ["skills", "strengths", "weaknesses", "missingSkills", "suggestions"] as const;
  for (const key of requiredArrays) {
    if (!Array.isArray(value[key])) throw new Error(`AI analysis missing ${key}`);
  }
  if (!Number.isFinite(value.score) || !Number.isFinite(value.atsScore)) throw new Error("AI analysis missing scores");
  return value;
}

const companyNames = ["Google", "Amazon", "TCS", "Infosys", "Zoho", "Microsoft"];

function wordsFrom(text = "") {
  return Array.from(new Set(text.match(/[A-Za-z][A-Za-z+#.-]{2,}/g)?.map((word) => word.trim()).filter(Boolean) ?? []));
}

function pick<T>(items: T[], count: number) {
  const copy = [...items].sort(() => Math.random() - 0.5);
  return copy.slice(0, count);
}

function legacyLocalResumeAnalysis(resumeText: string, context: AiContext): ResumeAnalysisPayload {
  const normalized = resumeText.toLowerCase();
  const knownSkills = [
    "JavaScript", "TypeScript", "React", "Node.js", "Express", "Python", "Java", "SQL", "PostgreSQL",
    "MongoDB", "AWS", "Docker", "Git", "REST APIs", "Data Structures", "Algorithms", "Machine Learning",
    "HTML", "CSS", "Tailwind CSS", "Prisma", "System Design"
  ];
  const skills = knownSkills.filter((skill) => normalized.includes(skill.toLowerCase().replace(".js", "")));
  const inferredSkills = pick(wordsFrom(resumeText).filter((word) => /^[A-Z]/.test(word) && word.length < 18), 6);
  const detected = Array.from(new Set([...skills, ...inferredSkills])).slice(0, 14);
  const targetRole = context.user.targetRole ?? "Software Engineer";
  const mustHave = targetRole.toLowerCase().includes("frontend")
    ? ["React Testing Library", "Accessibility", "Performance Optimization", "Design Systems"]
    : targetRole.toLowerCase().includes("data")
      ? ["Python", "SQL", "Statistics", "Model Evaluation", "Data Visualization"]
      : ["System Design", "Testing", "Cloud Deployment", "Database Indexing", "CI/CD"];
  const missingSkills = mustHave.filter((skill) => !detected.some((item) => item.toLowerCase().includes(skill.toLowerCase().split(" ")[0]))).slice(0, 5);
  const sectionScore = ["project", "experience", "education", "skill", "certification"].reduce((score, word) => score + (normalized.includes(word) ? 6 : 0), 0);
  const score = Math.min(92, Math.max(48, 42 + detected.length * 3 + sectionScore));
  const atsScore = Math.min(94, Math.max(45, score - (normalized.includes("summary") ? 0 : 5) + (resumeText.length > 1800 ? 4 : -3)));

  return {
    score,
    atsScore,
    skills: detected.length ? detected : ["Communication", "Problem Solving", "Programming Fundamentals"],
    education: normalized.includes("education") ? ["Education section detected"] : [],
    projects: normalized.includes("project") ? ["Project experience detected; quantify impact and tech stack for each project."] : [],
    experience: normalized.includes("experience") ? ["Experience section detected"] : [],
    strengths: [
      detected.length > 4 ? `Shows a useful technical base across ${detected.slice(0, 4).join(", ")}.` : "Has a readable foundation that can be shaped into a stronger technical resume.",
      "Resume text was parsed successfully, so ATS systems should be able to read the document.",
      targetRole ? `Target role context is available for ${targetRole}.` : "Profile context can be expanded to improve personalization."
    ],
    weaknesses: [
      "Add measurable outcomes such as latency reduced, users served, marks improved, or revenue/cost impact.",
      "Use stronger action verbs and make each project bullet prove ownership, tools, and result.",
      "Keep skills aligned with the target role instead of listing unrelated technologies."
    ],
    missingSkills,
    suggestions: [
      "Add a 2-3 line professional summary with target role, strongest stack, and one measurable achievement.",
      "Rewrite project bullets as: built X using Y, solved Z, measured by result.",
      "Add links for GitHub, portfolio, LinkedIn, and deployed projects where possible.",
      `Prepare interview stories around ${pick(detected, 3).join(", ") || "your strongest projects"}.`
    ],
    targetRole,
    companyReadiness: Object.fromEntries(companyNames.map((company, index) => [company, Math.max(38, Math.min(92, atsScore - 12 + detected.length + index * 2))]))
  };
}

function localInterview(input: { company: string; role: string; context: AiContext }) {
  const resumeSkills = wordsFrom(input.context.resumeText).filter((word) => word.length < 18);
  const skills = pick(resumeSkills.length ? resumeSkills : input.context.user.languages.concat(["data structures", "APIs", "databases", "projects"]), 5);
  const seed = Date.now().toString(36);
  const base = [
    `Walk me through one project that best proves you are ready for a ${input.role} role at ${input.company}.`,
    `Design a scalable service for a high-traffic feature at ${input.company}. What APIs, database tables, and failure handling would you use?`,
    `Pick ${skills[0] ?? "a core technology"} from your resume. What is one difficult bug you could face with it and how would you debug it?`,
    `Solve this verbally: given an array of integers, how would you find duplicate-heavy patterns efficiently and explain the complexity?`,
    `How would you improve the performance of a slow dashboard or resume analysis page?`,
    `Tell me about a time you learned a new technology quickly. What did you build with it?`,
    `What tradeoffs would you consider between SQL and NoSQL for a placement preparation platform?`,
    `How do authentication, rate limiting, and input validation work together in a production API?`,
    `Explain a project from your resume as if I am a non-technical hiring manager.`,
    `What would you test first in a resume upload and AI analysis workflow?`,
    `Describe how you would structure frontend state for a multi-step interview practice screen.`,
    `Why do you want ${input.company}, and what part of the ${input.role} role matches your current strengths?`,
    `Give an example of a weak resume bullet and rewrite it into an impact-focused bullet.`,
    `If your generated coding question repeats previous practice, how would you change the prompt or system design to avoid repetition?`,
    `What is one skill gap you have right now, and what is your 30-day plan to close it?`
  ];
  return pick(base, 12).map((question, index) => ({
    id: `local-${seed}-${index + 1}`,
    question,
    type: (index % 5 === 0 ? "hr" : index % 4 === 0 ? "resume" : index % 3 === 0 ? "system" : "technical") as "technical" | "system" | "hr" | "resume"
  }));
}

type CodingTemplate = {
  title: string;
  prompt: string;
  solution: string;
  explanation: string;
};

function previousPrompts(context: AiContext) {
  return (context.codingHistory ?? [])
    .map((item) => typeof item === "object" && item && "prompt" in item ? String((item as { prompt?: unknown }).prompt ?? "") : "")
    .filter(Boolean);
}

function localCodingQuestion(input: { difficulty: string; category: string; context: AiContext }) {
  const bank = {
    Arrays: {
      Easy: [
        {
          title: "Missing Interview Slot",
          prompt: "You are given sorted interview slot IDs from 1 to n with exactly one missing ID. Return the missing ID in O(n) time and O(1) extra space.",
          solution: "Use the expected sum n * (n + 1) / 2 and subtract the actual sum, or use XOR to avoid overflow in stricter languages.",
          explanation: "The array is sorted but searching is not required. A single pass is enough because every present ID contributes once."
        },
        {
          title: "Move Low Scores",
          prompt: "Given an array of candidate scores, move every score below 40 to the end while preserving the order of passing scores.",
          solution: "Build the passing list first and append failing scores after it, or use stable partitioning if the language provides it.",
          explanation: "This tests stable ordering. The direct approach is O(n) time and O(n) space."
        }
      ],
      Medium: [
        {
          title: "Resume Keyword Window",
          prompt: "Given an array of resume keywords and a target set of required skills, return the smallest contiguous window containing all required skills.",
          solution: "Use a sliding window with frequency maps. Expand right until all required skills are covered, then shrink left while coverage remains valid.",
          explanation: "Each pointer moves at most n times, so the solution is O(n) with O(k) space for required skills."
        },
        {
          title: "Placement Streak",
          prompt: "Given daily practice scores, find the longest subarray where the average score is at least a target readiness value.",
          solution: "Transform scores by subtracting the target, then use prefix sums and a monotonic structure to find the longest non-negative range.",
          explanation: "The transformed problem becomes finding a longest subarray with sum >= 0, which is more efficient than checking all ranges."
        }
      ],
      Hard: [
        {
          title: "Top K Skill Gaps Across Cohorts",
          prompt: "Given multiple sorted arrays of missing-skill frequencies from different colleges, return the global top k skill gaps without fully merging every array.",
          solution: "Use a max heap seeded with the first item from each sorted array, repeatedly pop the largest and push the next item from that same array.",
          explanation: "The heap contains at most one active item per cohort, giving O(k log m) time for m cohorts."
        },
        {
          title: "Median ATS Score Stream",
          prompt: "Design an algorithm that receives ATS scores one by one and returns the median after each upload.",
          solution: "Maintain a max heap for the lower half and a min heap for the upper half. Rebalance after every insertion.",
          explanation: "Two heaps keep both halves balanced, giving O(log n) insertion and O(1) median lookup."
        }
      ]
    },
    Strings: {
      Easy: [
        {
          title: "Normalize Resume Title",
          prompt: "Given a resume headline string, trim extra spaces, lowercase common filler words, and return a clean title-cased headline.",
          solution: "Split by whitespace, normalize each token, skip empty values, and join the transformed words.",
          explanation: "This checks string traversal and clean handling of messy input."
        },
        {
          title: "Valid Skill Tag",
          prompt: "Return true if a skill tag contains only letters, digits, plus, hash, dot, or hyphen and has length between 2 and 30.",
          solution: "Scan each character and reject invalid symbols or invalid length before scanning.",
          explanation: "A direct scan is clearer than a complex regex and runs in O(n)."
        }
      ],
      Medium: [
        {
          title: "Anagram Skill Groups",
          prompt: "Given a list of skill strings, group skills that are anagrams after ignoring spaces and case.",
          solution: "Normalize every string, sort its characters to form a key, and group original strings by that key.",
          explanation: "Sorting each normalized token gives a stable signature for anagram membership."
        },
        {
          title: "Minimum Resume Edits",
          prompt: "Given two resume bullet strings, compute the minimum insertions, deletions, and replacements needed to convert one into the other.",
          solution: "Use dynamic programming over both strings where dp[i][j] is the edit distance for prefixes.",
          explanation: "Each state depends on delete, insert, and replace transitions, giving O(nm) time."
        }
      ],
      Hard: [
        {
          title: "Repeated Interview Phrase Detector",
          prompt: "Find the longest repeated substring in an interview transcript string.",
          solution: "Use binary search on length plus rolling hash, or build a suffix array for a more advanced solution.",
          explanation: "Brute force is too slow. Hashing lets you test repeated substrings of a fixed length efficiently."
        },
        {
          title: "Wildcard Resume Search",
          prompt: "Implement pattern matching where ? matches one character and * matches any sequence for searching resume text.",
          solution: "Use dynamic programming with states for text index and pattern index, handling star as empty or consuming one character.",
          explanation: "The DP avoids exponential branching from repeated star choices."
        }
      ]
    },
    OOP: {
      Easy: [
        {
          title: "Candidate Class",
          prompt: "Design a Candidate class with name, skills, targetRole, and a method that checks whether a required skill exists.",
          solution: "Keep fields private where possible, expose methods for mutation, and store skills in a set for quick lookup.",
          explanation: "The task checks encapsulation and choosing a useful collection."
        }
      ],
      Medium: [
        {
          title: "Interview Scheduler",
          prompt: "Design classes for Interview, Candidate, Interviewer, and Scheduler. Prevent double-booking for the same interviewer.",
          solution: "Model each entity separately and let Scheduler own booking validation using time-overlap checks.",
          explanation: "Good OOP separates data ownership from orchestration logic."
        },
        {
          title: "Question Generator Strategy",
          prompt: "Design an extensible coding question generator where each category uses a different generation strategy.",
          solution: "Create a QuestionStrategy interface and one implementation per category, then select a strategy through a factory.",
          explanation: "The strategy pattern removes category-specific branching from the main generator."
        }
      ],
      Hard: [
        {
          title: "Pluggable AI Provider System",
          prompt: "Design an OOP system that can switch between OpenAI, Gemini, and local fallback generators without changing route code.",
          solution: "Define an AiProvider interface, implement each provider, and inject the selected provider into services.",
          explanation: "Dependency inversion makes provider changes isolated and testable."
        }
      ]
    },
    Java: {
      Easy: [
        {
          title: "Skill Frequency Map",
          prompt: "Write a Java method that receives a List<String> of skills and returns a Map<String, Integer> frequency count ignoring case.",
          solution: "Iterate through the list, normalize each skill, and use getOrDefault or merge to update counts.",
          explanation: "This tests common Java collections and clean normalization."
        }
      ],
      Medium: [
        {
          title: "Thread-Safe Score Cache",
          prompt: "Implement a Java class that caches resume scores by userId and is safe for concurrent reads and writes.",
          solution: "Use ConcurrentHashMap and expose methods for put, get, invalidate, and clearExpired if TTL is required.",
          explanation: "ConcurrentHashMap avoids unsafe shared mutable HashMap access."
        },
        {
          title: "Custom Comparator Ranking",
          prompt: "Sort candidates by ATS score descending, then interview score descending, then name ascending.",
          solution: "Use Comparator.comparing with reversed numeric comparators and a final natural-order name comparator.",
          explanation: "Chained comparators make multi-field ordering explicit."
        }
      ],
      Hard: [
        {
          title: "Executor-Based Interview Runner",
          prompt: "Build a Java service that evaluates multiple coding submissions in parallel and returns results in the original order.",
          solution: "Use ExecutorService, submit Callable tasks with original indexes, collect Future results, and place each result at its index.",
          explanation: "Parallel execution improves throughput while index tracking preserves response order."
        }
      ]
    },
    SQL: {
      Easy: [
        {
          title: "Latest Resume Uploads",
          prompt: "Write SQL to list each user with their latest resume upload date.",
          solution: "Group resumes by user_id and select MAX(created_at), then join to users for user details.",
          explanation: "Aggregation is enough when only the latest timestamp is required."
        }
      ],
      Medium: [
        {
          title: "Top Interview Readiness",
          prompt: "Write SQL to return the top 10 users by average of communication, technical, and confidence score from their latest interview.",
          solution: "Use a window function to rank interviews per user by created_at, filter rank 1, then order by computed average.",
          explanation: "Window functions solve latest-row-per-group problems cleanly."
        },
        {
          title: "Unpracticed Skill Gaps",
          prompt: "Find missing skills from resume analyses that do not have any coding question generated in the same category.",
          solution: "Unnest or join the missing skills table, left join coding_questions by mapped category, and filter null matches.",
          explanation: "An anti-join identifies gaps with no corresponding practice."
        }
      ],
      Hard: [
        {
          title: "Seven-Day Progress Funnel",
          prompt: "Write SQL for a 7-day funnel: registered users, onboarded users, resume uploads, interviews started, and coding questions generated per day.",
          solution: "Create daily CTEs for each event source, aggregate by date, then full outer join or join against a generated date series.",
          explanation: "A date spine prevents missing days and keeps metrics aligned."
        }
      ]
    },
    DBMS: {
      Easy: [
        {
          title: "Normalize Candidate Data",
          prompt: "Given a table storing comma-separated skills inside users, redesign it into normalized tables.",
          solution: "Create users, skills, and user_skills join tables with primary and foreign keys.",
          explanation: "Many-to-many data belongs in a join table, not a comma-separated string."
        }
      ],
      Medium: [
        {
          title: "Index Resume Search",
          prompt: "Choose indexes for searching resumes by userId, createdAt, and targetRole. Explain the order.",
          solution: "Use composite indexes matching common filters and ordering, such as (user_id, created_at DESC) for latest resume lookup.",
          explanation: "Indexes should match query predicates and sort order."
        }
      ],
      Hard: [
        {
          title: "Transaction-Safe Score Update",
          prompt: "Design a transaction that saves a resume upload, generated analysis, and dashboard metric update atomically.",
          solution: "Wrap all writes in one transaction and roll back if analysis or metric persistence fails.",
          explanation: "Atomicity prevents dashboards from showing analysis for a resume that was not saved."
        }
      ]
    },
    "Operating Systems": {
      Easy: [
        {
          title: "Round Robin Practice Scheduler",
          prompt: "Simulate round-robin scheduling for practice tasks with a fixed time quantum and return completion order.",
          solution: "Use a queue, repeatedly process up to quantum time, and requeue unfinished tasks.",
          explanation: "The queue naturally models round-robin fairness."
        }
      ],
      Medium: [
        {
          title: "Deadlock Detection",
          prompt: "Given allocation and request matrices, detect whether interview evaluation workers are deadlocked.",
          solution: "Use the standard safety-style algorithm: find processes whose requests can be satisfied, release allocations, and repeat.",
          explanation: "If no remaining process can proceed, the remaining set is deadlocked."
        }
      ],
      Hard: [
        {
          title: "LRU Page Replacement",
          prompt: "Implement LRU page replacement for resume parsing cache pages and return page faults.",
          solution: "Use a hash map plus doubly linked list, or an ordered map, to update recency in O(1).",
          explanation: "LRU requires both fast lookup and fast recency updates."
        }
      ]
    },
    Networks: {
      Easy: [
        {
          title: "HTTP Status Classifier",
          prompt: "Given HTTP status codes from API calls, classify each as success, client error, server error, or redirect.",
          solution: "Check numeric ranges: 200s, 300s, 400s, and 500s.",
          explanation: "This tests basic protocol understanding and boundary handling."
        }
      ],
      Medium: [
        {
          title: "Token Bucket Rate Limiter",
          prompt: "Design a token bucket limiter for resume uploads allowing burst capacity and steady refill.",
          solution: "Store current tokens and lastRefill timestamp. Refill based on elapsed time, then consume a token if available.",
          explanation: "Token buckets allow controlled bursts while enforcing a long-term rate."
        },
        {
          title: "Retry With Backoff",
          prompt: "Implement a client retry policy for failed AI requests using exponential backoff and jitter.",
          solution: "Retry only transient failures, multiply delay each attempt, add random jitter, and cap maximum delay.",
          explanation: "Backoff reduces pressure on overloaded services and jitter avoids synchronized retries."
        }
      ],
      Hard: [
        {
          title: "API Latency Diagnosis",
          prompt: "Given timestamped DNS, TCP, TLS, request, and response phases, identify the dominant latency bottleneck per request.",
          solution: "Compute phase durations, find max phase per request, then aggregate by endpoint and phase.",
          explanation: "Breaking latency into phases reveals whether the issue is network setup, server processing, or payload transfer."
        }
      ]
    }
  } as Record<string, Record<string, CodingTemplate[]>>;

  const templates = bank[input.category]?.[input.difficulty] ?? bank.Arrays.Medium;
  const used = previousPrompts(input.context).map((prompt) => prompt.toLowerCase());
  const unused = templates.filter((template) => !used.some((prompt) => prompt.includes(template.title.toLowerCase())));
  const historyOffset = previousPrompts(input.context).length % templates.length;
  const template = (unused.length ? pick(unused, 1)[0] : templates[historyOffset]);
  const role = input.context.user.targetRole ?? "Software Engineer";
  const sessionId = Date.now().toString(36).slice(-5);
  return {
    difficulty: input.difficulty,
    category: input.category,
    prompt: `[${template.title} - ${sessionId}] ${template.prompt} Frame your answer as if you are interviewing for a ${role} role.`,
    solution: template.solution,
    explanation: template.explanation,
    feedback: `For ${input.difficulty} ${input.category}, first state the brute-force idea, then the optimized approach, complexity, and edge cases. This question is intentionally different from your recent practice history.`
  };
}

export async function analyzeResume(input: { resumeText: string; context: AiContext }) {
  if (!openAiClient && !config.geminiApiKey) return trainedLocalResumeAnalysis(input.resumeText, input.context.user);
  const result = await generateJson<ResumeAnalysisPayload>(
    "You are NEXVORA AI's senior resume intelligence engine. Analyze resumes deeply and personalize every result to the user's profile, target role, preferred languages, chat history, and previous activity. Generate original ATS scoring, skill gap detection, strengths, weaknesses, missing skills, improvements, extracted education/projects/experience, and company readiness. Do not use generic templates. Use the supplied trained role profiles as evidence for role and skill-gap decisions, but never claim skills that are absent from the resume.",
    JSON.stringify({
      task: "Generate a fresh, personalized resume analysis and ATS assessment.",
      requiredShape: {
        score: "number 0-100",
        atsScore: "number 0-100",
        skills: ["detected skill strings"],
        education: ["structured education findings"],
        projects: ["structured project findings"],
        experience: ["structured experience findings"],
        strengths: ["specific resume strengths"],
        weaknesses: ["specific weaknesses"],
        missingSkills: ["skills missing for target role"],
        suggestions: ["specific improvements"],
        targetRole: "target role",
        companyReadiness: { Google: 0, Amazon: 0, TCS: 0, Infosys: 0, Zoho: 0, Microsoft: 0 }
      },
      trainedRoleProfiles: trainedRoleProfiles(),
      context: compactContext({ ...input.context, resumeText: input.resumeText })
    })
  );
  return assertAnalysis(result);
}

export async function assistantReply(input: {
  question: string;
  context: AiContext;
}) {
  if (!openAiClient && !config.geminiApiKey) return localAssistantReply(input);
  return generateText(
    "You are NEXVORA AI, a ChatGPT-style career and resume assistant. Use the stored conversation history, resume, latest analysis, user profile, target role, previous coding practice, and previous interviews. Be specific, context-aware, and personalized. Never claim you know something that is not in the context.",
    JSON.stringify({
      task: "Reply to the user's latest message with memory-aware guidance.",
      latestUserMessage: input.question,
      context: compactContext(input.context)
    })
  );
}

export async function generateCodingQuestion(input: {
  difficulty: string;
  category: string;
  context: AiContext;
}) {
  if (!openAiClient && !config.geminiApiKey) return localCodingQuestion(input);
  return generateJson<{
    difficulty: string;
    category: string;
    prompt: string;
    solution: string;
    explanation: string;
    feedback: string;
  }>(
    "You are an AI coding interviewer. Generate one original coding question personalized to the user's resume, target role, skill gaps, and previous coding history. Avoid repeating previous prompts. Include a complete solution, explanation, and AI feedback rubric.",
    JSON.stringify({
      task: "Generate a unique coding question for this user.",
      difficulty: input.difficulty,
      category: input.category,
      requiredShape: {
        difficulty: input.difficulty,
        category: input.category,
        prompt: "original problem statement",
        solution: "complete solution approach or code-like explanation",
        explanation: "why the solution works and complexity",
        feedback: "personalized evaluation advice"
      },
      context: compactContext(input.context)
    })
  );
}

export async function generateInterview(input: {
  company: string;
  role: string;
  context: AiContext;
}) {
  if (!openAiClient && !config.geminiApiKey) return localInterview(input);
  return generateJson<Array<{ id: string; question: string; type: "technical" | "system" | "hr" | "resume" }>>(
    "You are an AI interviewer. Generate fresh, company-specific mock interview questions based on the user's resume, target role, latest analysis, skill gaps, chat history, and previous interviews. Prevent repetition by avoiding questions semantically similar to previous interview history. Mix technical, system/design, resume, and HR questions when appropriate.",
    JSON.stringify({
      task: "Generate a new non-repeating mock interview session.",
      company: input.company,
      role: input.role,
      count: 12,
      requiredShape: [{ id: "unique id", question: "question text", type: "technical | system | hr | resume" }],
      context: compactContext(input.context)
    })
  );
}

export async function scoreInterview(input: {
  company: string;
  role: string;
  questions: unknown[];
  answers: string[];
  context: AiContext;
}) {
  if (!openAiClient && !config.geminiApiKey) {
    const answered = input.answers.filter((answer) => answer.trim().length > 20).length;
    const ratio = input.questions.length ? answered / input.questions.length : 0;
    return {
      communicationScore: Math.round(45 + ratio * 42),
      technicalScore: Math.round(40 + ratio * 45),
      confidenceScore: Math.round(42 + ratio * 43),
      feedback: `You answered ${answered} of ${input.questions.length} questions with usable detail. Improve by using a clear structure: context, approach, tradeoff, result, and one measurable example from your resume.`
    };
  }
  return generateJson<{
    communicationScore: number;
    technicalScore: number;
    confidenceScore: number;
    feedback: string;
  }>(
    "You are an AI interview evaluator. Score the user's actual answers in context of their resume, target company, target role, previous practice, and skill gaps. Produce personalized feedback, not generic advice.",
    JSON.stringify({
      task: "Evaluate mock interview answers.",
      company: input.company,
      role: input.role,
      questions: input.questions,
      answers: input.answers,
      requiredShape: {
        communicationScore: "number 0-100",
        technicalScore: "number 0-100",
        confidenceScore: "number 0-100",
        feedback: "specific feedback and next actions"
      },
      context: compactContext(input.context)
    })
  );
}

export async function generateRoadmap(input: {
  context: AiContext;
}) {
  return generateJson<Array<{ week: number; title: string; tasks: string[]; successMetric: string }>>(
    "You are an AI career roadmap strategist. Generate a personalized roadmap from the user's resume, profile, target role, skill gaps, chat memory, coding history, and interview history. Make every milestone specific and measurable.",
    JSON.stringify({
      task: "Generate a personalized AI career roadmap.",
      requiredShape: [{ week: 1, title: "milestone title", tasks: ["specific task"], successMetric: "measurable outcome" }],
      context: compactContext(input.context)
    })
  );
}
