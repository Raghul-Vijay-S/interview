import type { ResumeAnalysisPayload, SafeUser } from "../types.js";

// These role profiles were trained from NEXVORA_500_Resume_Dataset.csv (500 labelled resumes).
// They are intentionally kept as a compact, deployable model rather than loading a local CSV at runtime.
const roleProfiles: Record<string, string[]> = {
  "AI Engineer": ["Python", "PyTorch", "Machine Learning", "APIs", "LLMs", "SQL"],
  "Backend Developer": ["SQL", "Docker", "Spring Boot", "Git", "REST APIs", "Java"],
  "Business Analyst": ["Power BI", "Communication", "Excel", "SQL", "Requirements Analysis", "Jira"],
  "Cloud Engineer": ["Azure", "Networking", "Docker", "Linux", "Terraform", "AWS"],
  "Cybersecurity Analyst": ["Networking", "Python", "Wireshark", "Linux", "SIEM", "Security Analysis"],
  "Data Analyst": ["Pandas", "SQL", "Excel", "Python", "Statistics", "Power BI"],
  "Data Scientist": ["NumPy", "Machine Learning", "SQL", "Python", "Pandas", "Statistics"],
  "Database Administrator": ["MySQL", "PostgreSQL", "Backup", "Oracle", "SQL", "Linux"],
  "DevOps Engineer": ["Kubernetes", "Docker", "Linux", "AWS", "Jenkins", "Git"],
  "Embedded Systems Engineer": ["Arduino", "ESP32", "C", "Microcontrollers", "Embedded C", "C++"],
  "Frontend Developer": ["React", "HTML", "TypeScript", "CSS", "JavaScript", "Git"],
  "Full Stack Developer": ["JavaScript", "Express", "Git", "Node.js", "React", "MongoDB"],
  "Machine Learning Engineer": ["Pandas", "TensorFlow", "SQL", "Machine Learning", "Scikit-learn", "Python"],
  "Mobile App Developer": ["Kotlin", "Android", "Java", "REST APIs", "Git", "Firebase"],
  "Network Engineer": ["Linux", "Cisco", "TCP/IP", "Python", "Networking", "Wireshark"],
  "Product Analyst": ["Analytics", "SQL", "A/B Testing", "Power BI", "Python", "Excel"],
  "QA Engineer": ["Jira", "Selenium", "Python", "SQL", "Test Automation", "Java"],
  "Software Engineer": ["REST APIs", "SQL", "Data Structures", "Python", "Git", "Java"],
  "Technical Support Engineer": ["Windows", "SQL", "Linux", "Troubleshooting", "Networking", "IT Support"],
  "UI/UX Designer": ["UI Design", "UX Research", "Wireframing", "Prototyping", "Adobe XD", "Figma"]
};

const commonSkills = ["JavaScript", "TypeScript", "React", "Node.js", "Express", "Python", "Java", "C++", "C#", "SQL", "PostgreSQL", "MongoDB", "AWS", "Azure", "Docker", "Git", "REST APIs", "HTML", "CSS", "Tailwind", "Power BI", "Excel", "Figma", "Linux", "Kubernetes", "TensorFlow", "PyTorch"];
const companyNames = ["Google", "Amazon", "TCS", "Infosys", "Zoho", "Microsoft"];

function hasSkill(text: string, skill: string) {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(text);
}

function normaliseRole(role?: string | null) {
  if (!role) return undefined;
  const requested = role.trim().toLowerCase();
  return Object.keys(roleProfiles).find((known) => known.toLowerCase() === requested)
    ?? Object.keys(roleProfiles).find((known) => known.toLowerCase().includes(requested) || requested.includes(known.toLowerCase()));
}

function inferRole(text: string, requestedRole?: string | null) {
  const selected = normaliseRole(requestedRole);
  const ranked = Object.entries(roleProfiles)
    .map(([role, skills]) => ({ role, matches: skills.filter((skill) => hasSkill(text, skill)).length }))
    .sort((a, b) => b.matches - a.matches || a.role.localeCompare(b.role))[0]?.role ?? "Software Engineer";
  // Analyse the uploaded resume itself. Profile role is only a tie-breaker when the
  // document contains no stronger role evidence (for example, a user uploads a friend's resume).
  const bestMatches = roleProfiles[ranked].filter((skill) => hasSkill(text, skill)).length;
  return bestMatches > 0 ? ranked : selected ?? ranked;
}

export function localResumeAnalysis(resumeText: string, user: SafeUser): ResumeAnalysisPayload {
  const text = resumeText.replace(/\s+/g, " ").trim();
  const role = inferRole(text, user.targetRole);
  const expectedSkills = roleProfiles[role];
  const vocabulary = Array.from(new Set([...commonSkills, ...Object.values(roleProfiles).flat()]));
  const skills = vocabulary.filter((skill) => hasSkill(text, skill)).slice(0, 16);
  const missingSkills = expectedSkills.filter((skill) => !hasSkill(text, skill)).slice(0, 5);
  const hasSection = (pattern: RegExp) => pattern.test(text);
  const sections = [
    hasSection(/\b(summary|profile|objective)\b/i),
    hasSection(/\b(skills|technical skills|technologies)\b/i),
    hasSection(/\b(experience|employment|work history|internship)\b/i),
    hasSection(/\b(projects?|portfolio)\b/i),
    hasSection(/\b(education|university|college|b\.?tech|bachelor|master)\b/i)
  ].filter(Boolean).length;
  const impactStatements = (text.match(/\b(\d+(?:\.\d+)?%|\d+\+? (?:users|clients|tests|projects)|reduced|increased|improved|saved|achieved)\b/gi) ?? []).length;
  const skillCoverage = expectedSkills.length ? (expectedSkills.length - missingSkills.length) / expectedSkills.length : 0;
  const score = Math.round(Math.min(96, Math.max(38, 35 + sections * 7 + skillCoverage * 26 + Math.min(impactStatements, 5) * 2)));
  const atsScore = Math.round(Math.min(96, Math.max(35, score + (text.length >= 700 ? 4 : -5) + (hasSection(/\b(contact|email|linkedin|github)\b/i) ? 3 : 0))));
  const detected = skills.length ? skills : ["No role-specific skills detected"];

  return {
    score,
    atsScore,
    skills: detected,
    education: hasSection(/\b(education|university|college|b\.?tech|bachelor|master)\b/i) ? ["Education section detected"] : [],
    projects: hasSection(/\b(projects?|portfolio)\b/i) ? ["Projects section detected"] : [],
    experience: hasSection(/\b(experience|employment|work history|internship)\b/i) ? ["Experience section detected"] : [],
    strengths: [
      `${role} was selected from the dataset-trained role profiles${user.targetRole ? " and your target role" : ""}.`,
      skills.length ? `Detected role-relevant skills: ${skills.slice(0, 5).join(", ")}.` : "The document text is readable, but role-specific skills need clearer labels.",
      sections >= 4 ? "The resume has strong ATS-friendly section coverage." : "The resume text was parsed successfully and can be strengthened with clearer section headings."
    ],
    weaknesses: [
      ...(impactStatements ? [] : ["Add measurable outcomes to project and experience bullets (for example, time reduced, users served, or accuracy improved)."]),
      ...(hasSection(/\b(projects?|portfolio)\b/i) ? [] : ["Add a Projects section with the problem, tools used, and result for each project."]),
      ...(missingSkills.length ? [`For ${role}, strengthen evidence for: ${missingSkills.slice(0, 3).join(", ")}.`] : ["All core dataset skills for the selected role are represented; focus next on outcomes and depth."])
    ].slice(0, 3),
    missingSkills,
    suggestions: [
      `Tailor the headline and summary to ${role}.`,
      "Use one concise bullet format: action + technology + measurable result.",
      "Keep section titles standard: Summary, Skills, Experience, Projects, Education.",
      "Include GitHub, LinkedIn, and portfolio links as plain text so ATS parsers can read them."
    ],
    targetRole: role,
    companyReadiness: Object.fromEntries(companyNames.map((company, index) => [company, Math.min(94, Math.max(30, atsScore - 10 + Math.round(skillCoverage * 8) + index * 2))]))
  };
}

export function trainedRoleProfiles() {
  return roleProfiles;
}
